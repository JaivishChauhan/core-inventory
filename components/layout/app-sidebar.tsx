"use client"

/**
 * App Sidebar — The persistent left navigation panel ("The Compass").
 * Uses shadcn/ui Sidebar component for collapse/expand/mobile-sheet.
 * FRD §3: Persistent left sidebar with routing to all main sections.
 * FRD §7: Icons in soft-colored containers, navigation icons inherit color.
 * FRD §8: Touch-friendly targets, mobile-first responsive.
 *
 * @client Required for interactive sidebar state (collapse, active route).
 */

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  History,
  Settings,
  Boxes,
  ChevronDown,
  LogOut,
  User,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mainNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Orders", href: "/orders", icon: History },
]

const operationItems = [
  { title: "Receipts", href: "/operations/receipts", icon: PackagePlus },
  { title: "Deliveries", href: "/operations/deliveries", icon: Truck },
  {
    title: "Transfers",
    href: "/operations/transfers",
    icon: ArrowLeftRight,
  },
  {
    title: "Adjustments",
    href: "/operations/adjustments",
    icon: ClipboardCheck,
  },
  { title: "Move History", href: "/move-history", icon: History },
]

const systemNavItems = [
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

  /**
   * Determines if a nav link is the currently active route.
   * Dashboard (/) requires exact match; all others use startsWith.
   */
  function isActiveRoute(href: string): boolean {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  /** Checks if any operation sub-route is active */
  const isOperationsActive = pathname.startsWith("/operations")

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
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" onClick={handleNavigate}>
                {/* FRD Visual DNA: Gradient brand icon */}
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                  <Boxes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold">Core Inventory</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Warehouse IMS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveRoute(item.href)}
                    tooltip={item.title}
                    className="touch-target"
                  >
                    <Link href={item.href} onClick={handleNavigate}>
                      <item.icon className="size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations — Collapsible Sub-Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                defaultOpen={isOperationsActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Operations"
                      className="touch-target"
                    >
                      <PackagePlus className="size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Operations
                      </span>
                      <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {operationItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActiveRoute(item.href)}
                          >
                            <Link href={item.href} onClick={handleNavigate}>
                              <item.icon className="size-3.5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveRoute(item.href)}
                    tooltip={item.title}
                    className="touch-target"
                  >
                    <Link href={item.href} onClick={handleNavigate}>
                      <item.icon className="size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Profile"
                  className="touch-target"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={handleNavigate} className="gap-2">
                    <User className="size-4" />
                    My Profile
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
