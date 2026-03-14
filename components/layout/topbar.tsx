"use client"

/**
 * Top Application Bar — global context and quick actions.
 * FRD §3: Reserved for global search (SKU/Product), notifications,
 * and the active Warehouse selector.
 * FRD §1: Keyboard-first — Cmd+K opens command palette search.
 * FRD §8: Mobile-first responsive with touch targets ≥ 44px.
 *
 * @client Required for search input state, dropdowns, and keyboard shortcuts.
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
 * Waits SEARCH_DEBOUNCE_MS before firing the callback to protect the API.
 * FRD §1: All search/filter inputs must be debounced (300ms).
 */
function useDebounceSearch(delayMs: number) {
  const [query, setQuery] = useState("")
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (timeoutId) clearTimeout(timeoutId)

      const newTimeout = setTimeout(() => {
        // TODO: Wire to global search API
      }, delayMs)

      setTimeoutId(newTimeout)
    },
    [delayMs, timeoutId]
  )

  return { query, handleSearchChange }
}

/**
 * Keyboard shortcut hook for Cmd+K (macOS) / Ctrl+K (Windows).
 * FRD §1: "Robust command palettes (Cmd+K) and keyboard shortcuts."
 */
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
  const { query, handleSearchChange } = useDebounceSearch(SEARCH_DEBOUNCE_MS)
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

  // Wire Cmd+K to focus the search input
  useCommandPaletteShortcut(() => {
    const searchInput = document.querySelector<HTMLInputElement>(
      "[data-search-input]"
    )
    searchInput?.focus()
  })

  // Dynamic Page Title
  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard"
    if (path.startsWith("/products")) return "Products"
    if (path.startsWith("/orders")) return "Orders"
    if (path.startsWith("/operations/receipts")) return "Receipts"
    if (path.startsWith("/operations/deliveries")) return "Delivery Orders"
    if (path.startsWith("/operations/transfers")) return "Internal Transfers"
    if (path.startsWith("/operations/adjustments")) return "Inventory Adjustments"
    if (path.startsWith("/move-history")) return "Move History"
    if (path.startsWith("/settings")) return "Warehouse Settings"
    if (path.startsWith("/profile")) return "My Profile"
    return "Overview"
  }
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm supports-backdrop-filter:bg-background/60 sm:flex-nowrap sm:gap-3 sm:px-4">
      {/* Sidebar toggle — touch-friendly (FRD §8) */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="touch-target -ml-1" />
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        {/* Dynamic Page Title */}
        <div className="hidden sm:flex items-center ml-1">
          <span className="font-semibold text-sm tracking-tight text-foreground">{pageTitle}</span>
        </div>
      </div>

      {/* Global Search — FRD §3 */}
      <div className="relative order-3 w-full flex-1 sm:order-none sm:max-w-md">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search SKU, products..."
          className={`h-9 pr-16 pl-8 text-sm transition-shadow duration-200 ${
            isSearchFocused
              ? "border-primary ring-2 ring-primary ring-offset-1"
              : ""
          }`}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          data-search-input
        />
        {/* Cmd+K hint */}
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex">
          <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
            <Command className="size-2.5" />K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Warehouse Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="touch-target btn-lift hidden h-9 gap-1.5 text-xs sm:inline-flex"
            >
              <Warehouse className="size-3.5" />
              <span className="hidden md:inline">
                {sessionData?.user.warehouseId ? "Active Warehouse" : "Select Warehouse"}
              </span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Switch Warehouse</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <div className="rounded-lg bg-indigo-50 p-1 dark:bg-indigo-950/50">
                <Warehouse className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {sessionData?.user.warehouseId ? "Warehouse selected" : "No warehouse pinned"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Manage warehouse context in Settings
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-muted-foreground">
              More warehouses via Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications — FRD §3 */}
        <Button
          variant="ghost"
          size="icon"
          className="touch-target relative size-9"
        >
          <Bell className="size-4" />
          <Badge
            variant="destructive"
            className="shadow-glow absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="hidden h-4 sm:block" />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="touch-target h-9 gap-2 px-1.5 sm:px-2"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-semibold text-white">
                  {(sessionData?.user.name ?? "Warehouse Manager")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs font-medium md:inline">
                {sessionData?.user.name ?? "Manager"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">
                  {sessionData?.user.name ?? "Warehouse Manager"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionData?.user.email ?? "manager@core.inv"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/profile">
                <User className="size-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/settings">
                <Warehouse className="size-4" />
                Warehouses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
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
