import { PlatformProvider, PlatformContext, PlatformUser } from './types';
interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            added_to_attachment_menu?: boolean;
            allows_write_to_pm?: boolean;
            photo_url?: string;
        };
        auth_date: number;
        hash: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_text_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
        accent_text_color?: string;
        section_bg_color?: string;
        section_header_text_color?: string;
        subtitle_text_color?: string;
        destructive_text_color?: string;
    };
    viewportHeight: number;
    viewportStableHeight: number;
    isExpanded: boolean;
    isClosingConfirmationEnabled: boolean;
    isVerticalSwipesEnabled: boolean;
    isHorizontalSwipesEnabled: boolean;
    headerColor: string;
    backgroundColor: string;
    bottomBarColor: string;
    isIframed: boolean;
    expand(): void;
    close(): void;
    enableClosingConfirmation(): void;
    disableClosingConfirmation(): void;
    onEvent(eventType: string, callback: () => void): void;
    offEvent(eventType: string, callback: () => void): void;
    sendData(data: string): void;
    openLink(url: string, options?: {
        try_instant_view?: boolean;
    }): void;
    openTelegramLink(url: string): void;
    openInvoice(url: string, callback?: (status: string) => void): void;
    showPopup(params: Record<string, unknown>, callback?: (buttonId: string) => void): void;
    showAlert(message: string, callback?: () => void): void;
    showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
    showScanQrPopup(params: Record<string, unknown>, callback?: (data: string) => void): void;
    closeScanQrPopup(): void;
    readTextFromClipboard(callback?: (text: string | null) => void): void;
    requestWriteAccess(callback?: (allowed: boolean) => void): void;
    requestContactAccess(callback?: (allowed: boolean) => void): void;
    HapticFeedback: {
        impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
        notificationOccurred(type: 'success' | 'warning' | 'error'): void;
        selectionChanged(): void;
    };
    CloudStorage: {
        getItem(key: string, callback?: (error: string | null, value: string | null) => void): void;
        setItem(key: string, value: string, callback?: (error: string | null) => void): void;
        getItems(keys: string[], callback?: (error: string | null, values: Record<string, string>) => void): void;
        setItems(items: Record<string, string>, callback?: (error: string | null) => void): void;
        removeItem(key: string, callback?: (error: string | null) => void): void;
        removeItems(keys: string[], callback?: (error: string | null) => void): void;
        getKeys(callback?: (error: string | null, keys: string[]) => void): void;
    };
    ready(): void;
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
    setBottomBarColor(color: string): void;
}
declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}
export declare class TelegramPlatform implements PlatformProvider {
    private webApp;
    private themeChangeCallbacks;
    constructor();
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
    private mapUser;
    private mapColorScheme;
    private mapPlatform;
    private setupThemeListener;
}
export {};
//# sourceMappingURL=telegram.d.ts.map