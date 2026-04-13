/**
 * HTTP API Client
 * Base client for making API requests with auth header injection
 */
interface ClientConfig {
    baseUrl: string;
    timeout?: number;
}
declare class ApiClient {
    private baseUrl;
    private timeout;
    constructor(config: ClientConfig);
    /**
     * Get stored JWT token from localStorage
     */
    private getToken;
    /**
     * Make GET request
     */
    get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
    /**
     * Make POST request
     */
    post<T>(path: string, body?: unknown): Promise<T>;
    /**
     * Make PATCH request
     */
    patch<T>(path: string, body?: unknown): Promise<T>;
    /**
     * Core fetch wrapper with error handling
     */
    private request;
}
export declare const api: ApiClient;
export default ApiClient;
//# sourceMappingURL=client.d.ts.map