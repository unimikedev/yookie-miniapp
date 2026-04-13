export class TelegramPlatform {
    constructor() {
        this.themeChangeCallbacks = [];
        if (!window.Telegram?.WebApp) {
            throw new Error('Telegram WebApp is not available');
        }
        this.webApp = window.Telegram.WebApp;
    }
    async init() {
        const user = this.mapUser(this.webApp.initDataUnsafe.user);
        const colorScheme = this.mapColorScheme(this.webApp.themeParams);
        this.setupThemeListener();
        return {
            user,
            isReady: true,
            theme: this.webApp.colorScheme,
            colorScheme,
            viewportHeight: this.webApp.viewportHeight,
            viewportStableHeight: this.webApp.viewportStableHeight,
            platform: this.mapPlatform(this.webApp.platform),
        };
    }
    getUser() {
        const telegramUser = this.webApp.initDataUnsafe.user;
        if (!telegramUser) {
            return null;
        }
        return this.mapUser(telegramUser);
    }
    hapticFeedback(type) {
        if (type === 'light' || type === 'medium' || type === 'heavy') {
            this.webApp.HapticFeedback.impactOccurred(type);
        }
        else {
            // type is 'success' | 'error' — both are valid notification types
            this.webApp.HapticFeedback.notificationOccurred(type);
        }
    }
    async showAlert(message) {
        return new Promise((resolve) => {
            this.webApp.showAlert(message, () => {
                resolve();
            });
        });
    }
    async showConfirm(message) {
        return new Promise((resolve) => {
            this.webApp.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        });
    }
    openLink(url, options) {
        this.webApp.openLink(url, { try_instant_view: options?.tryInstantView ?? false });
    }
    close() {
        this.webApp.close();
    }
    expand() {
        this.webApp.expand();
    }
    enableClosingConfirmation() {
        this.webApp.enableClosingConfirmation();
    }
    disableClosingConfirmation() {
        this.webApp.disableClosingConfirmation();
    }
    onThemeChanged(callback) {
        this.themeChangeCallbacks.push(callback);
    }
    getInitData() {
        return this.webApp.initData || null;
    }
    ready() {
        this.webApp.ready();
    }
    mapUser(telegramUser) {
        if (!telegramUser) {
            return null;
        }
        return {
            id: String(telegramUser.id),
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
            languageCode: telegramUser.language_code,
            photoUrl: telegramUser.photo_url,
        };
    }
    mapColorScheme(themeParams) {
        return {
            bg: themeParams.bg_color || '#ffffff',
            text: themeParams.text_color || '#1a1a1a',
            hint: themeParams.hint_text_color || '#aeaeb2',
            link: themeParams.link_color || '#7c3aed',
            button: themeParams.button_color || '#7c3aed',
            buttonText: themeParams.button_text_color || '#ffffff',
        };
    }
    mapPlatform(platform) {
        switch (platform.toLowerCase()) {
            case 'ios':
                return 'ios';
            case 'android':
                return 'android';
            case 'web':
                return 'web';
            default:
                return 'telegram';
        }
    }
    setupThemeListener() {
        this.webApp.onEvent('themeChanged', () => {
            this.themeChangeCallbacks.forEach((callback) => callback());
        });
    }
}
//# sourceMappingURL=telegram.js.map