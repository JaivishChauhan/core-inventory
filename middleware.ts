import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Next.js Middleware — runs on every matched request.
 * Refreshes the Supabase auth session to keep cookies fresh.
 *
 * @security This is the auth boundary. Redirect logic for
 * protected routes will be added in Phase 5 (Auth).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser favicon)
     * - Public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
