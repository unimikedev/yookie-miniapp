/**
 * HTTP API Client
 * Base client for making API requests with auth header injection
 */
import { ApiError } from './types';
class ApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.timeout = config.timeout || 30000;
    }
    /**
     * Get stored JWT token from localStorage
     */
    getToken() {
        try {
            return localStorage.getItem('yookie_auth_token');
        }
        catch {
            return null;
        }
    }
    /**
     * Make GET request
     */
    async get(path, params) {
        const url = new URL(`${this.baseUrl}${path}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return this.request(url.toString(), {
            method: 'GET',
        });
    }
    /**
     * Make POST request
     */
    async post(path, body) {
        const url = `${this.baseUrl}${path}`;
        return this.request(url, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    /**
     * Make PATCH request
     */
    async patch(path, body) {
        const url = `${this.baseUrl}${path}`;
        return this.request(url, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    /**
     * Core fetch wrapper with error handling
     */
    async request(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                let errorData = {
                    code: 'UNKNOWN_ERROR',
                    message: response.statusText,
                };
                try {
                    errorData = await response.json();
                }
                catch {
                    // Response is not JSON, use defaults
                }
                throw new ApiError(response.status, errorData.code, errorData.message, errorData.details);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed');
            }
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new ApiError(0, 'TIMEOUT_ERROR', 'Request timeout');
            }
            throw new ApiError(0, 'UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
// Singleton instance
let apiInstance = null;
function getApiClient() {
    if (!apiInstance) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        apiInstance = new ApiClient({ baseUrl });
    }
    return apiInstance;
}
export const api = new Proxy(new Object(), {
    get: (_, prop) => {
        return getApiClient()[prop];
    },
});
export default ApiClient;
//# sourceMappingURL=client.js.map