import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"

/**
 * Plus Jakarta Sans — FRD §2 Typography.
 * Geometric sans-serif with friendly rounded terminals.
 * Balances professional authority with modern approachability.
 */
const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

/**
 * JetBrains Mono for monospace (SKUs, IDs, quantities).
 */
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
})

/**
 * SEO metadata — proper title template for page-level titles.
 * @see FRD §9 for accessibility and semantic HTML requirements.
 */
export const metadata: Metadata = {
  title: {
    default: "Core Inventory — Warehouse IMS",
    template: "%s | Core Inventory",
  },
  description:
    "Real-time, event-sourced Inventory Management System for streamlined warehouse operations. Track stock movements, manage products, and maintain absolute data integrity.",
  keywords: [
    "inventory management",
    "warehouse",
    "stock tracking",
    "event sourced",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} antialiased`}
    >
      <body className="min-h-svh overflow-x-hidden bg-background font-sans text-foreground">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast: "shadow-soft",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
