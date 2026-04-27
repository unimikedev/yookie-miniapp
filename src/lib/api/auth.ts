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
 * Authenticate via Telegram requestContact() — no OTP needed.
 * phone comes from tg.initDataUnsafe.contact.phone_number (Telegram-verified).
 * initData is HMAC-signed by Telegram and validated on the backend.
 */
export async function loginWithTelegramContact(
  phone: string,
  initData: string,
  name?: string
): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>('/auth/telegram-contact', { phone, initData, name });
  return response;
}

/**
 * Authenticate via Google credential (ID token from Google Sign-In)
 */
export async function loginWithGoogle(credential: string): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>('/auth/google', { credential });
  return response;
}
