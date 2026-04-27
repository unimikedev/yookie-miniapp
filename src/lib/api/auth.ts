/**
 * Authentication API functions
 */

import { api } from './client';
import { RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse, GoogleAuthResponse } from './types';

/**
 * Request OTP code for phone number.
 * If initData provided (Telegram Mini App signed string), code is sent via Telegram bot DM.
 */
export async function requestOtp(phone: string, initData?: string): Promise<void> {
  const payload: RequestOtpPayload & { initData?: string } = { phone, initData };
  await api.post('/auth/otp/send', payload);
}

/**
 * Verify OTP code and get auth token
 */
export async function verifyOtp(
  phone: string,
  code: string,
  initData?: string
): Promise<VerifyOtpResponse> {
  const payload: VerifyOtpPayload & { initData?: string } = { phone, code, initData };
  const response = await api.post<VerifyOtpResponse>('/auth/otp/verify', payload);
  return response;
}

/**
 * One-tap Telegram login — just initData, no phone or OTP needed.
 * Backend validates HMAC and looks up/creates user by telegram_chat_id.
 */
export async function loginWithTelegram(initData: string): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>('/auth/telegram', { initData });
  return response;
}

/**
 * Authenticate via Google credential (ID token from Google Sign-In)
 */
export async function loginWithGoogle(credential: string): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>('/auth/google', { credential });
  return response;
}
