import { NextResponse } from "next/server"
import { buildLogoutCookieHeader } from "@/lib/auth/session"

/**
 * POST /api/auth/logout
 * Destroys the session cookie by setting Max-Age=0.
 * @security Server-side only. Client JS cannot clear HTTP-only cookies.
 */
export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully." })
  response.headers.set("Set-Cookie", buildLogoutCookieHeader())
  return response
}
