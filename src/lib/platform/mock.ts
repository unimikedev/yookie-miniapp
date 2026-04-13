import { PlatformProvider, PlatformContext, PlatformUser, ColorScheme } from './types'

export class MockPlatform implements PlatformProvider {
  private user: PlatformUser | null
  private themeChangeCallbacks: Array<() => void> = []

  constructor() {
    this.user = {
      id: 'mock-user-123',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      languageCode: 'ru',
      photoUrl: undefined,
    }
  }

  async init(): Promise<PlatformContext> {
    const colorScheme: ColorScheme = {
      bg: '#ffffff',
      text: '#1a1a1a',
      hint: '#aeaeb2',
      link: '#7c3aed',
      button: '#7c3aed',
      buttonText: '#ffffff',
    }

    return {
      user: this.user,
      isReady: true,
      theme: 'light',
      colorScheme,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      platform: 'web',
    }
  }

  getUser(): PlatformUser | null {
    return this.user
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
    console.log(`[Mock] Haptic feedback: ${type}`)
  }

  async showAlert(message: string): Promise<void> {
    console.log(`[Mock] Alert: ${message}`)
    alert(message)
  }

  async showConfirm(message: string): Promise<boolean> {
    console.log(`[Mock] Confirm: ${message}`)
    const result = confirm(message)
    return result
  }

  openLink(url: string, _options?: { tryInstantView?: boolean }): void {
    console.log(`[Mock] Opening link: ${url}`)
    window.open(url, '_blank')
  }

  close(): void {
    console.log('[Mock] Close requested')
  }

  expand(): void {
    console.log('[Mock] Expand requested')
  }

  enableClosingConfirmation(): void {
    console.log('[Mock] Closing confirmation enabled')
  }

  disableClosingConfirmation(): void {
    console.log('[Mock] Closing confirmation disabled')
  }

  onThemeChanged(callback: () => void): void {
    this.themeChangeCallbacks.push(callback)
  }

  getInitData(): string | null {
    return null
  }

  ready(): void {
    console.log('[Mock] Ready called')
  }
}
