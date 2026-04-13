import { PlatformProvider, PlatformContext, PlatformUser, ColorScheme } from './types'

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
      added_to_attachment_menu?: boolean
      allows_write_to_pm?: boolean
      photo_url?: string
    }
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_text_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
    accent_text_color?: string
    section_bg_color?: string
    section_header_text_color?: string
    subtitle_text_color?: string
    destructive_text_color?: string
  }
  viewportHeight: number
  viewportStableHeight: number
  isExpanded: boolean
  isClosingConfirmationEnabled: boolean
  isVerticalSwipesEnabled: boolean
  isHorizontalSwipesEnabled: boolean
  headerColor: string
  backgroundColor: string
  bottomBarColor: string
  isIframed: boolean

  expand(): void
  close(): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  onEvent(eventType: string, callback: () => void): void
  offEvent(eventType: string, callback: () => void): void
  sendData(data: string): void
  openLink(url: string, options?: { try_instant_view?: boolean }): void
  openTelegramLink(url: string): void
  openInvoice(url: string, callback?: (status: string) => void): void
  showPopup(params: Record<string, unknown>, callback?: (buttonId: string) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showScanQrPopup(params: Record<string, unknown>, callback?: (data: string) => void): void
  closeScanQrPopup(): void
  readTextFromClipboard(callback?: (text: string | null) => void): void
  requestWriteAccess(callback?: (allowed: boolean) => void): void
  requestContactAccess(callback?: (allowed: boolean) => void): void
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void
    notificationOccurred(type: 'success' | 'warning' | 'error'): void
    selectionChanged(): void
  }
  CloudStorage: {
    getItem(key: string, callback?: (error: string | null, value: string | null) => void): void
    setItem(key: string, value: string, callback?: (error: string | null) => void): void
    getItems(keys: string[], callback?: (error: string | null, values: Record<string, string>) => void): void
    setItems(items: Record<string, string>, callback?: (error: string | null) => void): void
    removeItem(key: string, callback?: (error: string | null) => void): void
    removeItems(keys: string[], callback?: (error: string | null) => void): void
    getKeys(callback?: (error: string | null, keys: string[]) => void): void
  }
  ready(): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  setBottomBarColor(color: string): void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export class TelegramPlatform implements PlatformProvider {
  private webApp: TelegramWebApp
  private themeChangeCallbacks: Array<() => void> = []

  constructor() {
    if (!window.Telegram?.WebApp) {
      throw new Error('Telegram WebApp is not available')
    }
    this.webApp = window.Telegram.WebApp
  }

  async init(): Promise<PlatformContext> {
    const user = this.mapUser(this.webApp.initDataUnsafe.user)
    const colorScheme = this.mapColorScheme(this.webApp.themeParams)

    this.setupThemeListener()

    return {
      user,
      isReady: true,
      theme: this.webApp.colorScheme,
      colorScheme,
      viewportHeight: this.webApp.viewportHeight,
      viewportStableHeight: this.webApp.viewportStableHeight,
      platform: this.mapPlatform(this.webApp.platform),
    }
  }

  getUser(): PlatformUser | null {
    const telegramUser = this.webApp.initDataUnsafe.user
    if (!telegramUser) {
      return null
    }
    return this.mapUser(telegramUser)
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
    if (type === 'light' || type === 'medium' || type === 'heavy') {
      this.webApp.HapticFeedback.impactOccurred(type)
    } else {
      // type is 'success' | 'error' — both are valid notification types
      this.webApp.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning')
    }
  }

  async showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.webApp.showAlert(message, () => {
        resolve()
      })
    })
  }

  async showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.webApp.showConfirm(message, (confirmed) => {
        resolve(confirmed)
      })
    })
  }

  openLink(url: string, options?: { tryInstantView?: boolean }): void {
    this.webApp.openLink(url, { try_instant_view: options?.tryInstantView ?? false })
  }

  close(): void {
    this.webApp.close()
  }

  expand(): void {
    this.webApp.expand()
  }

  enableClosingConfirmation(): void {
    this.webApp.enableClosingConfirmation()
  }

  disableClosingConfirmation(): void {
    this.webApp.disableClosingConfirmation()
  }

  onThemeChanged(callback: () => void): void {
    this.themeChangeCallbacks.push(callback)
  }

  getInitData(): string | null {
    return this.webApp.initData || null
  }

  ready(): void {
    this.webApp.ready()
  }

  private mapUser(telegramUser?: TelegramWebApp['initDataUnsafe']['user']): PlatformUser | null {
    if (!telegramUser) {
      return null
    }

    return {
      id: String(telegramUser.id),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      languageCode: telegramUser.language_code,
      photoUrl: telegramUser.photo_url,
    }
  }

  private mapColorScheme(themeParams: TelegramWebApp['themeParams']): ColorScheme {
    return {
      bg: themeParams.bg_color || '#ffffff',
      text: themeParams.text_color || '#1a1a1a',
      hint: themeParams.hint_text_color || '#aeaeb2',
      link: themeParams.link_color || '#7c3aed',
      button: themeParams.button_color || '#7c3aed',
      buttonText: themeParams.button_text_color || '#ffffff',
    }
  }

  private mapPlatform(
    platform: string
  ): 'telegram' | 'web' | 'ios' | 'android' {
    switch (platform.toLowerCase()) {
      case 'ios':
        return 'ios'
      case 'android':
        return 'android'
      case 'web':
        return 'web'
      default:
        return 'telegram'
    }
  }

  private setupThemeListener(): void {
    this.webApp.onEvent('themeChanged', () => {
      this.themeChangeCallbacks.forEach((callback) => callback())
    })
  }
}
