/**
 * Authentication API functions
 */
import { api } from './client';
/**
 * Request OTP code for phone number
 */
export async function requestOtp(phone) {
    const payload = { phone };
    await api.post('/auth/otp/request', payload);
}
/**
 * Verify OTP code and get auth token
 */
export async function verifyOtp(phone, code) {
    const payload = { phone, code };
    const response = await api.post('/auth/otp/verify', payload);
    return response;
}
//# sourceMappingURL=auth.js.map