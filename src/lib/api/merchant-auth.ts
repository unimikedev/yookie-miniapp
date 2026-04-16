/**
 * Merchant (B2B) Authentication API
 * Handles merchant registration, login, and session management
 */

import { apiClient } from './client';
import type { Merchant, MerchantStaff, MerchantService, MerchantAvailability } from '../api/types';

export interface MerchantRegisterPayload {
  business_name: string;
  business_type: 'salon' | 'individual';
  category: string;
  address: string;
  city: string;
  phone: string;
  description: string;
  instagram?: string;
  telegram_username?: string;
  services: Array<{
    name: string;
    price: number;
    duration_min: number;
    category: string;
  }>;
  staff?: Array<{
    name: string;
    specialization: string;
    phone?: string;
  }>;
}

export interface MerchantLoginPayload {
  phone: string;
  code: string;
}

export interface MerchantAuthResponse {
  token: string;
  merchant: Merchant;
}

export interface VerifyOtpResponse {
  token: string;
  merchant: Merchant;
}

/**
 * Request OTP for merchant registration/login
 */
export async function requestMerchantOtp(phone: string): Promise<void> {
  await apiClient.post('/api/merchant/auth/request-otp', { phone });
}

/**
 * Verify OTP and complete merchant auth
 */
export async function verifyMerchantOtp(
  phone: string,
  code: string,
  tempToken?: string
): Promise<MerchantAuthResponse> {
  const response = await apiClient.post<VerifyOtpResponse>('/api/merchant/auth/verify-otp', {
    phone,
    code,
    temp_token: tempToken,
  });
  
  return {
    token: response.token,
    merchant: response.merchant,
  };
}

/**
 * Complete merchant registration after OTP verification
 */
export async function completeMerchantRegistration(
  tempToken: string,
  payload: MerchantRegisterPayload
): Promise<MerchantAuthResponse> {
  const response = await apiClient.post<MerchantAuthResponse>(
    '/api/merchant/register',
    payload,
    {
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    }
  );
  
  return response;
}

/**
 * Get current merchant profile
 */
export async function getMerchantProfile(token: string): Promise<Merchant> {
  return apiClient.get<Merchant>('/api/merchant/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update merchant profile
 */
export async function updateMerchantProfile(
  token: string,
  updates: Partial<Merchant>
): Promise<Merchant> {
  return apiClient.patch<Merchant>('/api/merchant/profile', updates, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Logout merchant
 */
export async function logoutMerchant(): Promise<void> {
  // Client-side logout, just clear token
}
