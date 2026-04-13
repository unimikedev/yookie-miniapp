/**
 * Authentication API functions
 */
import { VerifyOtpResponse } from './types';
/**
 * Request OTP code for phone number
 */
export declare function requestOtp(phone: string): Promise<void>;
/**
 * Verify OTP code and get auth token
 */
export declare function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse>;
//# sourceMappingURL=auth.d.ts.map