import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for use in Server Components and Route Handlers.
 * Reads auth cookies from the request headers for session-aware queries.
 *
 * @security Uses SECURITY INVOKER context — all queries respect RLS.
 * @returns Supabase client with server-side cookie management.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const supabase = await createClient()
 * const { data } = await supabase.from("products").select("*")
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
