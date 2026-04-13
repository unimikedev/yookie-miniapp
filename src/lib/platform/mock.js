export class MockPlatform {
    constructor() {
        this.themeChangeCallbacks = [];
        this.user = {
            id: 'mock-user-123',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            languageCode: 'ru',
            photoUrl: undefined,
        };
    }
    async init() {
        const colorScheme = {
            bg: '#ffffff',
            text: '#1a1a1a',
            hint: '#aeaeb2',
            link: '#7c3aed',
            button: '#7c3aed',
            buttonText: '#ffffff',
        };
        return {
            user: this.user,
            isReady: true,
            theme: 'light',
            colorScheme,
            viewportHeight: window.innerHeight,
            viewportStableHeight: window.innerHeight,
            platform: 'web',
        };
    }
    getUser() {
        return this.user;
    }
    hapticFeedback(type) {
        console.log(`[Mock] Haptic feedback: ${type}`);
    }
    async showAlert(message) {
        console.log(`[Mock] Alert: ${message}`);
        alert(message);
    }
    async showConfirm(message) {
        console.log(`[Mock] Confirm: ${message}`);
        const result = confirm(message);
        return result;
    }
    openLink(url, _options) {
        console.log(`[Mock] Opening link: ${url}`);
        window.open(url, '_blank');
    }
    close() {
        console.log('[Mock] Close requested');
    }
    expand() {
        console.log('[Mock] Expand requested');
    }
    enableClosingConfirmation() {
        console.log('[Mock] Closing confirmation enabled');
    }
    disableClosingConfirmation() {
        console.log('[Mock] Closing confirmation disabled');
    }
    onThemeChanged(callback) {
        this.themeChangeCallbacks.push(callback);
    }
    getInitData() {
        return null;
    }
    ready() {
        console.log('[Mock] Ready called');
    }
}
//# sourceMappingURL=mock.js.map