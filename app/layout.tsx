import { JetBrains_Mono, Sora, Space_Grotesk } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"

import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const fontDisplay = Sora({
  subsets: ["latin"],
  variable: "--font-app-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const fontBody = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-app-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-app-mono",
  weight: ["400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Core Inventory - Warehouse IMS",
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
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} antialiased`}
    >
      <body className="min-h-svh overflow-x-hidden bg-background text-foreground">
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
