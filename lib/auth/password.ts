import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

/**
 * Hashes a plain-text password using bcrypt.
 * @security Uses 10 salt rounds for balance between security and performance.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a plain-text password against a bcrypt hash.
 * @security Constant-time comparison via bcrypt.compare.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
