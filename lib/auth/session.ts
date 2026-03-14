import { cookies } from "next/headers"
import { verifySessionToken, type SessionPayload } from "./jwt"

const SESSION_COOKIE_NAME = "ci_session"
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

/**
 * Reads and verifies the session from the HTTP-only cookie (server-side only).
 * Returns null if the user is unauthenticated or the session token has expired.
 * @security Cookie is HTTP-only and not accessible from client JS.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Builds the Set-Cookie header string to create a session.
 * @security HTTP-only, Secure in production, SameSite=Lax.
 */
export function buildSessionCookieHeader(token: string): string {
  const isProduction = process.env.NODE_ENV === "production"
  const secure = isProduction ? "; Secure" : ""
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`
}

/**
 * Builds the Set-Cookie header string to destroy a session (logout).
 * Sets Max-Age=0 to immediately expire the cookie.
 */
export function buildLogoutCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
