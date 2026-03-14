import { randomInt, createHash } from "crypto"

/** OTP validity window in minutes */
export const OTP_EXPIRY_MINUTES = 10

/**
 * Generates a 6-digit numeric OTP using the Node.js crypto module.
 * randomInt is cryptographically secure — do not use Math.random().
 */
export function generateOtpCode(): string {
  return String(randomInt(100000, 999999))
}

/**
 * Hashes an OTP code with SHA-256 for secure DB storage.
 * OTP tokens are short-lived and scoped, so SHA-256 is appropriate
 * here (unlike passwords which need bcrypt/argon2).
 * @param otp - The raw 6-digit code
 */
export function hashOtpToken(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

/**
 * Returns the OTP expiry Date object based on OTP_EXPIRY_MINUTES.
 * Centralized so the expiry window is never magic-numbered elsewhere.
 */
export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}
