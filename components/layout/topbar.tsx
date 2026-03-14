"use client"

/**
 * Top Application Bar — global context and quick actions.
 * Redesigned with glass top bar aesthetic and Cmd+K search affordance.
 */

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Warehouse,
  Command,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants"

/**
 * Debounced search handler.
 */
function useDebounceSearch(delayMs: number) {
  const [query, setQuery] = useState("")
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (timeoutId) clearTimeout(timeoutId)

      const newTimeout = setTimeout(() => {
        // TODO: Wire to global search API or Cmd+K palette
      }, delayMs)

      setTimeoutId(newTimeout)
    },
    [delayMs, timeoutId]
  )

  return { query, handleSearchChange }
}

function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        onOpen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpen])
}

export function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  // Ensure default is 300 to match original logic in case the constant is absent/undefined
  const { query, handleSearchChange } = useDebounceSearch(SEARCH_DEBOUNCE_MS || 300)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  const { data: sessionData } = useQuery<{
    user: { email: string; name: string; warehouseId: string | null }
  }>({
    queryKey: ["auth-me"],
    queryFn: () => fetch("/api/auth/me").then((response) => response.json()),
    staleTime: 5 * 60 * 1000,
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) throw new Error("Failed to log out.")
    },
    onSuccess: () => {
      toast.success("Logged out successfully.")
      router.replace("/login")
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  useCommandPaletteShortcut(() => {
    const searchInput = document.querySelector<HTMLInputElement>(
      "[data-search-input]"
    )
    searchInput?.focus()
  })

  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard"
    if (path.startsWith("/analytics")) return "Analytics"
    if (path.startsWith("/products")) return "Products"
    if (path.startsWith("/orders")) return "Orders"
    if (path.startsWith("/move-history")) return "Move History"
    if (path.startsWith("/ai-insights")) return "AI Insights"
    if (path.startsWith("/barcode")) return "Barcode Scanner"
    if (path.startsWith("/settings")) return "Settings"
    if (path.startsWith("/profile")) return "My Profile"
    
    // Legacy fallbacks
    if (path.startsWith("/operations/receipts")) return "Receipts"
    if (path.startsWith("/operations/deliveries")) return "Delivery Orders"
    if (path.startsWith("/operations/transfers")) return "Internal Transfers"
    if (path.startsWith("/operations/adjustments")) return "Inventory Adjustments"
    return "Overview"
  }
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 glass glass-elevated border-b border-white/10 shadow-soft">
      {/* Sidebar toggle */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="touch-target -ml-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors" />
        <Separator orientation="vertical" className="hidden h-5 bg-white/10 sm:block" />
        <div className="hidden sm:flex items-center ml-2">
          <span className="font-semibold text-[15px] tracking-tight text-white drop-shadow-sm">{pageTitle}</span>
        </div>
      </div>

      {/* Global Search — Affordance Cmd+K */}
      <div className="relative order-3 w-full flex-1 sm:order-none sm:max-w-md sm:ml-4">
        <div 
          className={`relative flex items-center w-full rounded-full transition-all duration-300 ${
            isSearchFocused ? "ring-2 ring-cyan-500/50 bg-black/40 glow-blue" : "bg-black/20 hover:bg-black/30 border border-white/5"
          }`}
        >
          <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search everywhere..."
            className="w-full h-9 pl-10 pr-16 bg-transparent border-none text-sm text-slate-200 placeholder:text-slate-400/70 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            data-search-input
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            <kbd className="inline-flex h-5 items-center gap-1 rounded bg-white/10 px-2 font-mono text-[10px] font-medium text-slate-300 backdrop-blur-md border border-white/5 shadow-inner">
              <Command className="size-3" />K
            </kbd>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Warehouse Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="touch-target btn-lift hidden h-9 gap-2 text-xs sm:inline-flex bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-200 rounded-full px-4 transition-all"
            >
              <Warehouse className="size-3.5 text-cyan-400" />
              <span className="hidden md:inline font-medium">
                {sessionData?.user.warehouseId ? "Main WH" : "Select WH"}
              </span>
              <ChevronDown className="size-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass glass-elevated border-white/10 text-slate-200 p-1.5">
            <DropdownMenuLabel className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold px-2 py-1.5">
              Active Location
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="gap-3 p-2 hover:bg-white/10 focus:bg-white/10 rounded-md cursor-pointer transition-colors">
              <div className="rounded-lg bg-cyan-500/20 p-1.5 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <Warehouse className="size-4 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-white">
                  {sessionData?.user.warehouseId ? "Main Warehouse" : "No selection"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Global Context
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-[11px] text-slate-400 hover:text-white focus:bg-white/10 cursor-pointer rounded-md">
              Manage locations...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="touch-target relative size-9 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bell className="size-[18px]" />
          <Badge
            variant="destructive"
            className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full p-0 text-[9px] font-bold bg-cyan-500 border-none text-white shadow-[0_0_10px_rgba(6,182,212,0.8)] glow-blue"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="hidden h-5 bg-white/10 sm:block" />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="touch-target h-9 gap-2 px-1 py-1 sm:px-1.5 rounded-full hover:bg-white/5 transition-all"
            >
              <Avatar className="size-7 ring-2 ring-white/10 transition-all hover:ring-white/30">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-bold text-white shadow-inner">
                  {(sessionData?.user.name ?? "WH")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass glass-elevated border-white/10 p-1.5">
            <DropdownMenuLabel className="font-normal px-2 py-1.5 pt-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-white">
                  {sessionData?.user.name ?? "Warehouse Manager"}
                </p>
                <p className="text-xs text-slate-400">
                  {sessionData?.user.email ?? "manager@core.inv"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="gap-2 text-slate-200 focus:bg-white/10 focus:text-white cursor-pointer rounded-md transition-colors">
              <Link href="/profile">
                <User className="size-4 text-slate-400" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 text-slate-200 focus:bg-white/10 focus:text-white cursor-pointer rounded-md transition-colors">
              <Link href="/settings">
                <Warehouse className="size-4 text-slate-400" />
                Warehouses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-md mt-1 transition-colors"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
