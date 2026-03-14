"use client"

/**
 * App Sidebar — The persistent left navigation panel ("The Compass").
 * Uses shadcn/ui Sidebar component for collapse/expand/mobile-sheet.
 * Redesigned with glass aesthetic and updated App Router paths.
 */

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  LayoutDashboard,
  LineChart,
  Package,
  ShoppingCart,
  History,
  Sparkles,
  ScanLine,
  Settings,
  LogOut,
  User,
  Boxes,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const overviewItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Analytics", href: "/analytics", icon: LineChart },
]

const operationItems = [
  { title: "Products", href: "/products", icon: Package },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  { title: "Move History", href: "/move-history", icon: History },
]

const toolItems = [
  { title: "AI Insights", href: "/ai-insights", icon: Sparkles },
  { title: "Barcode Scanner", href: "/barcode", icon: ScanLine },
]

const systemItems = [
  { title: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const { data: sessionData } = useQuery<{
    user: { email: string; name: string }
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
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function isActiveRoute(href: string): boolean {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  function handleNavigate() {
    if (isMobile) setOpenMobile(false)
  }

  const userName = sessionData?.user.name ?? "Warehouse Manager"
  const userEmail = sessionData?.user.email ?? "manager@core.inv"
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="glass border-r border-white/10 text-foreground">
      <SidebarHeader className="border-b border-white/5 pb-4 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/5 transition-all">
              <Link href="/" onClick={handleNavigate}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-[0_0_15px_rgba(76,201,240,0.5)] glow-blue">
                  <Boxes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold tracking-wide text-white">Core Inventory</span>
                  <span className="truncate text-xs text-muted-foreground/80">Warehouse IMS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2 scrollbar-none">
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => {
                const active = isActiveRoute(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`touch-target transition-all duration-200 ${
                        active 
                          ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_rgba(76,201,240,1)] bg-gradient-to-r from-cyan-500/10 to-transparent glow-blue" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon className={`size-4 ${active ? "text-cyan-400" : ""}`} />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden mt-4">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationItems.map((item) => {
                const active = isActiveRoute(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`touch-target transition-all duration-200 ${
                        active 
                          ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_rgba(76,201,240,1)] bg-gradient-to-r from-cyan-500/10 to-transparent glow-blue" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon className={`size-4 ${active ? "text-cyan-400" : ""}`} />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden mt-4">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => {
                const active = isActiveRoute(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`touch-target transition-all duration-200 ${
                        active 
                          ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_rgba(76,201,240,1)] bg-gradient-to-r from-cyan-500/10 to-transparent glow-blue" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon className={`size-4 ${active ? "text-cyan-400" : ""}`} />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden mt-4">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => {
                const active = isActiveRoute(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`touch-target transition-all duration-200 ${
                        active 
                          ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_rgba(76,201,240,1)] bg-gradient-to-r from-cyan-500/10 to-transparent glow-blue" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon className={`size-4 ${active ? "text-cyan-400" : ""}`} />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 pt-3 pb-3">
        <SidebarMenu>
          {/* Status Indicator inside the footer */}
          <SidebarMenuItem className="mb-2 px-3 flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
            <span className="relative flex h-2 w-2 status-dot-live">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium tracking-wide text-emerald-500/90 uppercase">
              System Online
            </span>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Profile"
                  className="touch-target hover:bg-white/5 transition-all"
                >
                  <Avatar className="size-8 ring-1 ring-white/10">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-inner">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium text-slate-200">{userName}</span>
                    <span className="truncate text-xs text-slate-400">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 glass glass-elevated border-white/10 py-1.5">
                <DropdownMenuItem asChild className="hover:bg-white/10 rounded-md focus:bg-white/10 transition-colors">
                  <Link href="/profile" onClick={handleNavigate} className="gap-2 text-slate-200">
                    <User className="size-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
