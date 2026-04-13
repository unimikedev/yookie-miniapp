/**
 * Authentication API functions
 */

import { api } from './client';
import { RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse } from './types';

/**
 * Request OTP code for phone number
 */
export async function requestOtp(phone: string): Promise<void> {
  const payload: RequestOtpPayload = { phone };
  await api.post('/auth/otp/request', payload);
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
