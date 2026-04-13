import { TelegramPlatform } from './telegram';
import { MockPlatform } from './mock';
export function createPlatform() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        try {
            return new TelegramPlatform();
        }
        catch {
            console.warn('Failed to initialize Telegram platform, falling back to mock');
            return new MockPlatform();
        }
    }
    return new MockPlatform();
}
export * from './types';
//# sourceMappingURL=index.js.map