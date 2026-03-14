import { NextResponse, type NextRequest } from "next/server"
import { verifySessionToken } from "@/lib/auth/jwt"

/** Routes that don't require authentication */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
]

/**
 * Next.js Route Middleware — enforces authentication on all matched routes.
 *
 * @security Runs on the Edge Runtime before any route handler executes.
 * @security Token is verified (not just parsed) — expired/tampered tokens are rejected.
 * @security Logged-in users hitting /login are redirected home to prevent state confusion.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const sessionToken = request.cookies.get("ci_session")?.value

  if (!isPublicRoute) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const session = await verifySessionToken(sessionToken)
    if (!session) {
      // Token is invalid or expired — clear cookie and redirect
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("ci_session")
      return response
    }
  }

  // Prevent authenticated users from seeing the login page
  if (pathname === "/login" && sessionToken) {
    const session = await verifySessionToken(sessionToken)
    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
