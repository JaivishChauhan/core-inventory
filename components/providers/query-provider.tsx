"use client"

/**
 * TanStack Query provider wrapper.
 * Configured with sensible defaults for a warehouse app:
 * - 5 minute stale time (stock data changes moderately)
 * - Refetch on window focus for real-time awareness
 *
 * @client Required because QueryClientProvider uses React context.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

interface QueryProviderProps {
  children: ReactNode
}

/** Stale time for queries — 5 minutes in ms */
const QUERY_STALE_TIME_MS = 5 * 60 * 1000

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
