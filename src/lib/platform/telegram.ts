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

  // BackButton
  BackButton: {
    isVisible: boolean
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
  }
  // MainButton
  MainButton: {
    isVisible: boolean
    text: string
    color: string
    textColor: string
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
  }

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

    // Expand to fill available space (prevents bottom bar overlap)
    this.webApp.expand()

    // Enable closing confirmation to prevent accidental exits
    this.webApp.enableClosingConfirmation()

    // Apply Telegram theme colors as CSS custom properties
    this.applyThemeColors()

    // Set safe-area insets from Telegram contentSafeAreaInset
    this.applySafeAreaInsets()

    // Set data-theme on html for CSS targeting
    document.documentElement.setAttribute('data-theme', this.webApp.colorScheme)

    // Set CSS custom properties for viewport
    document.documentElement.style.setProperty('--viewport-height', `${this.webApp.viewportHeight}px`)
    document.documentElement.style.setProperty('--viewport-stable-height', `${this.webApp.viewportStableHeight}px`)

    this.setupThemeListener()
    this.setupViewportListener()

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

  private applyThemeColors(): void {
    const tp = this.webApp.themeParams
    const map = {
      '--tg-theme-bg-color': tp.bg_color,
      '--tg-theme-text-color': tp.text_color,
      '--tg-theme-hint-color': tp.hint_text_color,
      '--tg-theme-link-color': tp.link_color,
      '--tg-theme-button-color': tp.button_color,
      '--tg-theme-button-text-color': tp.button_text_color,
      '--tg-theme-secondary-bg-color': tp.secondary_bg_color,
    }
    for (const [prop, value] of Object.entries(map)) {
      if (value) {
        document.documentElement.style.setProperty(prop, value)
      }
    }
  }

  private applySafeAreaInsets(): void {
    // Telegram WebApp provides contentSafeAreaInset via CSS env() variables
    // We bridge them to our --safe-area-* custom properties
    const safeAreaTop = 'env(safe-area-inset-top, 0px)'
    const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)'
    const safeAreaLeft = 'env(safe-area-inset-left, 0px)'
    const safeAreaRight = 'env(safe-area-inset-right, 0px)'

    document.documentElement.style.setProperty('--safe-area-top', safeAreaTop)
    document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom)
    document.documentElement.style.setProperty('--safe-area-left', safeAreaLeft)
    document.documentElement.style.setProperty('--safe-area-right', safeAreaRight)
  }

  private setupViewportListener(): void {
    this.webApp.onEvent('viewportChanged', () => {
      document.documentElement.style.setProperty('--viewport-height', `${this.webApp.viewportHeight}px`)
      document.documentElement.style.setProperty('--viewport-stable-height', `${this.webApp.viewportStableHeight}px`)
    })
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
      // Update CSS variables and data-theme on theme change
      document.documentElement.setAttribute('data-theme', this.webApp.colorScheme)
      this.applyThemeColors()
      // Notify React context
      this.themeChangeCallbacks.forEach((callback) => callback())
    })
  }

  // ─── Telegram WebApp specific helpers ──────────────────

  /** Show Telegram native BackButton */
  showBackButton(onClick: () => void): void {
    this.webApp.BackButton.onClick(onClick)
    this.webApp.BackButton.show()
  }

  /** Hide Telegram native BackButton */
  hideBackButton(): void {
    this.webApp.BackButton.offClick(() => {})
    this.webApp.BackButton.hide()
  }

  /** Set Telegram MainButton text and show it */
  setMainButton(text: string, onClick: () => void, options?: { isEnabled?: boolean; isProgressVisible?: boolean }): void {
    this.webApp.MainButton.offClick(() => {})
    this.webApp.MainButton.setText(text)
    this.webApp.MainButton.onClick(onClick)
    if (options?.isEnabled === false) {
      this.webApp.MainButton.disable()
    } else {
      this.webApp.MainButton.enable()
    }
    if (options?.isProgressVisible) {
      this.webApp.MainButton.showProgress()
    } else {
      this.webApp.MainButton.hideProgress()
    }
    this.webApp.MainButton.show()
  }

  /** Hide Telegram MAINButton */
  hideMainButton(): void {
    this.webApp.MainButton.offClick(() => {})
    this.webApp.MainButton.hide()
  }

  /** Get raw WebApp instance (escape hatch) */
  getWebApp(): TelegramWebApp {
    return this.webApp
  }
}
