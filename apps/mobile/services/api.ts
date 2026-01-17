import * as SecureStore from 'expo-secure-store';
import type {
  AuthRequestCodeRequest,
  AuthVerifyRequest,
  AuthResponse,
  UserProfile,
  UpdateUserRequest,
  CheckInStatus,
  ContactWithDetails,
  CreateInvitationResponse,
  AcceptInvitationRequest,
  ApiError,
} from '@alles-gut/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiClient {
  private accessToken: string | null = null;

  async init() {
    this.accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = { error: 'Error', message: 'An error occurred', statusCode: response.status };
      }
      throw new Error(error.message || 'An error occurred');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  private async clearTokens() {
    this.accessToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  // Auth endpoints
  async requestCode(data: AuthRequestCodeRequest): Promise<{ message: string }> {
    return this.request('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verify(data: AuthVerifyRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    await this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await this.request<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );

      await this.setTokens(response.accessToken, response.refreshToken);
      return true;
    } catch {
      await this.clearTokens();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'DELETE' });
    } finally {
      await this.clearTokens();
    }
  }

  // User endpoints
  async getProfile(): Promise<UserProfile> {
    return this.request('/user/me');
  }

  async updateProfile(data: UpdateUserRequest): Promise<UserProfile> {
    return this.request('/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<void> {
    await this.request('/user/me', { method: 'DELETE' });
    await this.clearTokens();
  }

  async exportData(): Promise<object> {
    return this.request('/user/export');
  }

  // Check-in endpoints
  async checkIn(): Promise<CheckInStatus> {
    return this.request('/checkin', { method: 'POST' });
  }

  async getCheckInStatus(): Promise<CheckInStatus> {
    return this.request('/checkin/status');
  }

  // Contacts endpoints
  async getContacts(): Promise<ContactWithDetails[]> {
    return this.request('/contacts');
  }

  async createInvitation(): Promise<CreateInvitationResponse> {
    return this.request('/contacts/invite', { method: 'POST' });
  }

  async acceptInvitation(data: AcceptInvitationRequest): Promise<ContactWithDetails> {
    return this.request('/contacts/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeContact(contactId: string): Promise<void> {
    return this.request(`/contacts/${contactId}`, { method: 'DELETE' });
  }

  // Notifications endpoints
  async registerPushToken(pushToken: string): Promise<void> {
    return this.request('/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const api = new ApiClient();
