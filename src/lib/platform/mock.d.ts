import { PlatformProvider, PlatformContext, PlatformUser } from './types';
export declare class MockPlatform implements PlatformProvider {
    private user;
    private themeChangeCallbacks;
    constructor();
    init(): Promise<PlatformContext>;
    getUser(): PlatformUser | null;
    hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;
    showAlert(message: string): Promise<void>;
    showConfirm(message: string): Promise<boolean>;
    openLink(url: string, _options?: {
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
//# sourceMappingURL=mock.d.ts.map