import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "Sign In | Core Inventory",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {children}
    </div>
  )
}
