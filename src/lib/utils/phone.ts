/**
 * Phone formatting and validation utilities for Uzbekistan (+998)
 * Format: +998 XX XXX-XX-XX (13 chars with +, 12 digits)
 */

const UZBEKISTAN_PREFIX = '+998'

/**
 * Format a raw phone number into +998 XX XXX-XX-XX mask.
 * Only digits after +998 are kept, formatted with spaces/dashes.
 * Returns the masked string for display in input.
 */
export function formatPhoneMask(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/\D/g, '')

  // If starts with 998, strip it for processing
  let remainingDigits = digits
  if (digits.startsWith('998')) {
    remainingDigits = digits.slice(3)
  } else if (digits.startsWith('8') && digits.length === 10) {
    // Handle local format 8XXXXXXXXXX -> strip leading 8
    remainingDigits = digits.slice(1)
  }

  // Limit to 9 digits (Uzbekistan mobile number after 998)
  remainingDigits = remainingDigits.slice(0, 9)

  // Build masked string
  let result = UZBEKISTAN_PREFIX
  if (remainingDigits.length > 0) {
    result += ' ' + remainingDigits.slice(0, 2)
  }
  if (remainingDigits.length > 2) {
    result += ' ' + remainingDigits.slice(2, 5)
  }
  if (remainingDigits.length > 5) {
    result += '-' + remainingDigits.slice(5, 7)
  }
  if (remainingDigits.length > 7) {
    result += '-' + remainingDigits.slice(7, 9)
  }

  return result
}

/**
 * Validate that a phone number is a complete Uzbekistan number.
 * Returns true if the number has +998 followed by exactly 9 digits.
 */
export function isPhoneComplete(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  // Full number: 998 + 9 digits = 12 digits total
  if (digits.startsWith('998')) {
    return digits.length === 12
  }
  return false
}

/**
 * Get clean phone number (digits only, with country code).
 * Strips formatting from masked input for backend submission.
 */
export function getCleanPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) {
    return '+' + digits
  }
  if (digits.length === 9) {
    return '+998' + digits
  }
  // Return as-is if we can't parse it
  return value
}

/**
 * Strip digits from a string (for name validation).
 */
export function stripDigits(value: string): string {
  return value.replace(/\d/g, '')
}

/**
 * Check if a name contains any digits.
 */
export function nameHasDigits(value: string): boolean {
  return /\d/.test(value)
}
