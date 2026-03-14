"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Package, ArrowLeft } from "lucide-react"

type ForgotPasswordStep = "email" | "otp" | null

/**
 * LoginPage — Password-based auth with signup/login tabs.
 * OTP is used only for password reset flow.
 *
 * "use client" required for form state, navigation, and toast calls.
 * @security Never stores credentials. JWT is set via HTTP-only cookie by the server.
 */
export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>(null)

  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Signup form
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  // Forgot password form
  const [resetEmail, setResetEmail] = useState("")
  const [resetOtp, setResetOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json() as { error?: string; user?: { name: string } }

      if (!res.ok) {
        toast.error(data.error ?? "Login failed.")
        return
      }

      toast.success(`Welcome back, ${data.user?.name ?? ""}!`)
      router.replace("/")
      router.refresh()
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsLoginLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSignupLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          name: signupName,
          password: signupPassword,
        }),
      })
      const data = await res.json() as { error?: string; user?: { name: string } }

      if (!res.ok) {
        toast.error(data.error ?? "Signup failed.")
        return
      }

      toast.success(`Welcome, ${data.user?.name ?? ""}!`)
      router.replace("/")
      router.refresh()
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsSignupLoading(false)
    }
  }

  async function handleRequestResetCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsResetLoading(true)

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json() as { error?: string; message?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send reset code.")
        return
      }

      toast.success("Reset code sent! Check your inbox.")
      setForgotPasswordStep("otp")
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsResetLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsResetLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
      })
      const data = await res.json() as { error?: string; message?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to reset password.")
        return
      }

      toast.success("Password reset successfully! You can now log in.")
      setForgotPasswordStep(null)
      setResetEmail("")
      setResetOtp("")
      setNewPassword("")
      setActiveTab("login")
    } catch {
      toast.error("Network error. Check your connection.")
    } finally {
      setIsResetLoading(false)
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
        <Card className="w-full panel glass">
          {forgotPasswordStep ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {forgotPasswordStep === "email" ? "Reset Password" : "Enter Reset Code"}
                </CardTitle>
                <CardDescription>
                  {forgotPasswordStep === "email"
                    ? "Enter your email to receive a password reset code."
                    : `We sent a 6-digit code to ${resetEmail}. Check your inbox.`}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {forgotPasswordStep === "email" ? (
                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@company.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isResetLoading}
                      className="w-full glow-blue rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {isResetLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Send Reset Code
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full gap-1.5"
                      onClick={() => {
                        setForgotPasswordStep(null)
                        setResetEmail("")
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Button>
                  </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reset-otp" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          6-Digit Code
                        </Label>
                        <Input
                          id="reset-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                          className="text-center font-mono text-2xl tracking-[0.5em]"
                          required
                          autoFocus
                          autoComplete="one-time-code"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isResetLoading || resetOtp.length < 6}
                        className="w-full glow-blue rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {isResetLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Reset Password
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full gap-1.5"
                        onClick={() => {
                        setForgotPasswordStep("email")
                        setResetOtp("")
                        setNewPassword("")
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Email Address
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@company.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Password
                        </Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm text-indigo-600 hover:text-indigo-700"
                        onClick={() => setForgotPasswordStep("email")}
                      >
                        Forgot password?
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoginLoading}
                        className="w-full glow-blue rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {isLoginLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sign In
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-4">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Jane Smith"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@company.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Password
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="At least 8 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSignupLoading}
                        className="w-full glow-blue rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {isSignupLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
