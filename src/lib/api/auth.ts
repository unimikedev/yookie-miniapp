/**
 * Authentication API functions
 */

import { api } from './client';
import { RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse, GoogleAuthResponse, MerchantRegisterPayload } from './types';

/**
 * Register a new merchant (B2B)
 * Backend: POST /auth/register-merchant
 */
export async function registerMerchant(payload: MerchantRegisterPayload): Promise<{ token: string; user: VerifyOtpResponse['user'] }> {
  const response = await api.post<{ token: string; user: VerifyOtpResponse['user'] }>('/auth/register-merchant', payload);
  return response;
}

/**
 * Request OTP code for phone number.
 * If telegramId provided, code is sent via Telegram bot DM instead of SMS.
 */
export async function requestOtp(phone: string, telegramId?: number): Promise<void> {
  const payload: RequestOtpPayload & { telegramId?: number } = { phone, telegramId };
  await api.post('/auth/otp/send', payload);
}

/**
 * Verify OTP code and get auth token
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResponse> {
  const payload: VerifyOtpPayload = { phone, code };
  const response = await api.post<VerifyOtpResponse>('/auth/otp/verify', payload);
  return response;
}

/**
 * Authenticate via Google credential (ID token from Google Sign-In)
 */
export async function loginWithGoogle(credential: string): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>('/auth/google', { credential });
  return response;
}
