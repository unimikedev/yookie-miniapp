export interface PlatformUser {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    photoUrl?: string;
}
export interface ColorScheme {
    bg: string;
    text: string;
    hint: string;
    link: string;
    button: string;
    buttonText: string;
}
export interface PlatformContext {
    user: PlatformUser | null;
    isReady: boolean;
    theme: 'light' | 'dark';
    colorScheme: ColorScheme;
    viewportHeight: number;
    viewportStableHeight: number;
    platform: 'telegram' | 'web' | 'ios' | 'android';
}
export interface PlatformProvider {
    init(): Promise<PlatformContext>;
    getUser(): PlatformUser | null;
    hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;
    showAlert(message: string): Promise<void>;
    showConfirm(message: string): Promise<boolean>;
    openLink(url: string, options?: {
        tryInstantView?: boolean;
    }): void;
    close(): void;
    expand(): void;
    enableClosingConfirmation(): void;
    disableClosingConfirmation(): void;
    onThemeChanged(callback: () => void): void;
    getInitData(): string | null;
    ready(): void;
}
//# sourceMappingURL=types.d.ts.map