/**
 * HTTP API Client
 * Base client for making API requests with auth header injection
 */

import { ApiError, ApiErrorResponse } from './types';

interface ClientConfig {
  baseUrl: string;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Get stored JWT token from localStorage
   */
  private getToken(): string | null {
    try {
      return localStorage.getItem('yookie_auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Clear auth token and redirect to login on 401
   */
  private handleUnauthorized(): void {
    // Clear auth tokens
    try {
      localStorage.removeItem('yookie_auth_token');
      localStorage.removeItem('yookie_auth_user');
    } catch { /* noop */ }

    // Redirect to login page (only if not already there)
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
      window.location.href = '/auth';
    }
  }

  /**
   * Subscribe to token refresh events
   */
  private subscribeToTokenRefresh(callback: (token: string | null) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers about token refresh result
   */
  private notifyRefreshSubscribers(token: string | null): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Make GET request
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.toString(), {
      method: 'GET',
    });
  }

  /**
   * Make POST request
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make PATCH request
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    return this.request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make DELETE request
   */
  async delete<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.toString(), {
      method: 'DELETE',
    });
  }

  /**
   * Core fetch wrapper with error handling
   */
  private async request<T>(
    url: string,
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
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
        let errorData: ApiErrorResponse = {
          code: 'UNKNOWN_ERROR',
          message: response.statusText,
        };

        try {
          errorData = await response.json();
        } catch {
          // Response is not JSON, use defaults
        }

        const apiError = new ApiError(
          response.status,
          errorData.code,
          errorData.message,
          errorData.details
        );

        // Handle 401 Unauthorized - clear token and redirect to login
        if (response.status === 401) {
          // Prevent infinite loops by checking if we're already handling this
          if (!this.isRefreshing) {
            this.handleUnauthorized();
          }
        }

        throw apiError;
      }

      const data = await response.json();
      
      // Backend now wraps all responses in { data: T } format
      // Unwrap the inner data field to maintain backward compatibility
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data as T;
      }
      
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors: Chrome = "Failed to fetch", Safari/WebKit = "Load failed"
      if (error instanceof TypeError) {
        const msg = error.message.toLowerCase()
        if (msg.includes('failed to fetch') || msg.includes('load failed') || msg.includes('networkerror') || msg.includes('network')) {
          throw new ApiError(0, 'NETWORK_ERROR', 'Нет связи с сервером. Проверьте подключение к интернету.');
        }
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'TIMEOUT_ERROR', 'Превышено время ожидания. Попробуйте ещё раз.');
      }

      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Нет связи с сервером. Попробуйте позже.'
      );
    }
  }
}

// Singleton instance
let apiInstance: ApiClient | null = null;

function getApiClient(): ApiClient {
  if (!apiInstance) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    apiInstance = new ApiClient({ baseUrl });
  }
  return apiInstance;
}

export const api = new Proxy(new Object(), {
  get: (_, prop) => {
    return (getApiClient() as any)[prop];
  },
}) as ApiClient;

export default ApiClient;
