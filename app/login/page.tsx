"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Package, ArrowLeft } from "lucide-react"

type AuthStep = "email" | "otp"

/**
 * LoginPage — OTP-based passwordless auth flow.
 * Step 1: User enters email (and name if first-time).
 * Step 2: User enters the 6-digit OTP from their email.
 *
 * "use client" required for form state, navigation, and toast calls.
 * @security Never stores credentials. JWT is set via HTTP-only cookie by the server.
 */
export default function LoginPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<AuthStep>("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [requiresName, setRequiresName] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await res.json() as { error?: string; requiresName?: boolean; message?: string }

      if (!res.ok) {
        if (data.requiresName) {
          setRequiresName(true)
          toast.info("Welcome! Please enter your name to create your account.")
          return
        }
        toast.error(data.error ?? "Failed to send code.")
        return
      }

      toast.success("Code sent! Check your inbox.")
      setCurrentStep("otp")
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json() as { error?: string; user?: { name: string } }

      if (!res.ok) {
        toast.error(data.error ?? "Invalid code.")
        return
      }

      toast.success(`Welcome back, ${data.user?.name ?? ""}!`)
      router.replace("/")
      router.refresh()
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-16">
      {/* FRD: atmospheric blur orbs */}
      <div className="blur-orb h-[500px] w-[500px] -left-40 -top-40 bg-gradient-to-br from-indigo-400/30 to-violet-400/20" />
      <div className="blur-orb h-[350px] w-[350px] -bottom-20 -right-20 bg-gradient-to-br from-violet-400/30 to-indigo-400/20" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-button">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-gradient">Core Inventory</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enterprise Warehouse Management
            </p>
          </div>
        </div>

        {/* Auth card */}
        <Card className="w-full border-border/50 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {currentStep === "email" ? "Sign In" : "Enter Your Code"}
            </CardTitle>
            <CardDescription>
              {currentStep === "email"
                ? "Enter your work email to receive a sign-in code."
                : `We sent a 6-digit code to ${email}. Check your inbox.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {currentStep === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {requiresName && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus={!requiresName}
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="submit"
                  id="btn-request-otp"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all hover:-translate-y-0.5 hover:shadow-button disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center font-mono text-2xl tracking-[0.5em]"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <Button
                  type="submit"
                  id="btn-verify-otp"
                  disabled={isLoading || otp.length < 6}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all hover:-translate-y-0.5 hover:shadow-button disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify &amp; Sign In
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-1.5"
                  onClick={() => {
                    setCurrentStep("email")
                    setOtp("")
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
