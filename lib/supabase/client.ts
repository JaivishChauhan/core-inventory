import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for use in Client Components ("use client").
 * Uses the browser's cookie storage for session management.
 *
 * @security The anon key is public-safe — all data access is gated by RLS policies.
 * @returns Supabase client instance for browser-side queries.
 *
 * @example
 * ```tsx
 * "use client"
 * const supabase = createClient()
 * const { data } = await supabase.from("products").select("*")
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
