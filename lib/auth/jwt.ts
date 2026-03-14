import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production-min-32-chars!!"
)

export type SessionPayload = {
  userId: string
  email: string
  name: string
  role: "admin" | "staff"
  warehouseId: string | null
}

/**
 * Signs a new JWT session token valid for 7 days.
 * @security Token is stored in an HTTP-only cookie — never in localStorage.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

/**
 * Verifies a session JWT and returns the payload.
 * Returns null on any failure (expired, tampered, malformed) — never throws.
 * @security Callers must treat null as "unauthenticated" and redirect.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
