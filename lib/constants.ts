/**
 * Application-wide constants.
 * No magic numbers or hardcoded values anywhere else.
 */

/** Debounce delay for search/filter inputs (ms) */
export const SEARCH_DEBOUNCE_MS = 300

/** Default page size for data tables */
export const DEFAULT_PAGE_SIZE = 25

/** Maximum page size for data tables */
export const MAX_PAGE_SIZE = 100

/** Navigation items for the sidebar and command palette */
export const NAV_ITEMS = {
  main: [
    {
      title: "Dashboard",
      href: "/",
      icon: "LayoutDashboard",
      description: "Command center and live warehouse pulse",
      keywords: ["home", "overview", "kpi"],
    },
    {
      title: "Products",
      href: "/products",
      icon: "Package",
      description: "Catalog, stock health, and location availability",
      keywords: ["sku", "catalog", "inventory"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: "BarChart3",
      description: "Trend lines, category mix, and operational reporting",
      keywords: ["charts", "reports", "trends"],
    },
  ],
  operations: [
    {
      title: "Receipts",
      href: "/operations/receipts",
      icon: "PackagePlus",
      description: "Inbound stock workflows and vendor receipts",
      keywords: ["incoming", "purchase", "inbound"],
    },
    {
      title: "Deliveries",
      href: "/operations/deliveries",
      icon: "Truck",
      description: "Outbound orders and shipping workflows",
      keywords: ["outbound", "dispatch", "shipment"],
    },
    {
      title: "Transfers",
      href: "/operations/transfers",
      icon: "ArrowLeftRight",
      description: "Internal warehouse movement and staging",
      keywords: ["move", "transfer", "relocation"],
    },
    {
      title: "Adjustments",
      href: "/operations/adjustments",
      icon: "ClipboardCheck",
      description: "Cycle counts and stock reconciliation",
      keywords: ["count", "variance", "reconcile"],
    },
    {
      title: "Move History",
      href: "/move-history",
      icon: "History",
      description: "Immutable ledger and audit trail",
      keywords: ["history", "ledger", "audit"],
    },
  ],
  intelligence: [
    {
      title: "AI Insights",
      href: "/ai-insights",
      icon: "Brain",
      description: "Reorder suggestions and inventory health previews",
      keywords: ["ai", "insights", "forecast"],
    },
    {
      title: "Barcode",
      href: "/barcode",
      icon: "ScanLine",
      description: "Manual barcode lookup and scanner preview",
      keywords: ["scan", "scanner", "lookup"],
    },
  ],
  system: [
    {
      title: "Orders",
      href: "/orders",
      icon: "ReceiptText",
      description: "All move documents grouped as orders",
      keywords: ["orders", "documents"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "Settings",
      description: "Warehouses, locations, and configuration",
      keywords: ["warehouse", "location", "config"],
    },
    {
      title: "Profile",
      href: "/profile",
      icon: "User",
      description: "Current session identity and warehouse context",
      keywords: ["account", "me", "user"],
    },
  ],
} as const

export const COMMAND_ACTIONS = [
  {
    title: "Open Dashboard",
    href: "/",
    icon: "Sparkles",
    description: "Jump back to the command center",
  },
  {
    title: "Review Analytics",
    href: "/analytics",
    icon: "LineChart",
    description: "Inspect category mix and movement trends",
  },
  {
    title: "Scan or Lookup Barcode",
    href: "/barcode",
    icon: "ScanSearch",
    description: "Manual lookup and scanner preview",
  },
  {
    title: "Open Settings",
    href: "/settings",
    icon: "Settings2",
    description: "Manage warehouses and locations",
  },
] as const

export const PAGE_TITLES = [
  { href: "/", title: "Dashboard" },
  { href: "/products", title: "Products" },
  { href: "/analytics", title: "Analytics" },
  { href: "/ai-insights", title: "AI Insights" },
  { href: "/barcode", title: "Barcode" },
  { href: "/orders", title: "Orders" },
  { href: "/operations/receipts", title: "Receipts" },
  { href: "/operations/deliveries", title: "Deliveries" },
  { href: "/operations/transfers", title: "Internal Transfers" },
  { href: "/operations/adjustments", title: "Inventory Adjustments" },
  { href: "/move-history", title: "Move History" },
  { href: "/settings", title: "Settings" },
  { href: "/profile", title: "Profile" },
] as const

export function getPageTitle(pathname: string) {
  const match = PAGE_TITLES.find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return match?.title ?? "Overview"
}

/** Move status labels and colors */
export const MOVE_STATUS_CONFIG = {
  draft: { label: "Draft", variant: "secondary" },
  waiting: { label: "Waiting", variant: "outline" },
  ready: { label: "Ready", variant: "default" },
  done: { label: "Done", variant: "default" },
  canceled: { label: "Canceled", variant: "destructive" },
} as const

/** Move type labels */
export const MOVE_TYPE_LABELS = {
  receipt: "Receipt",
  delivery: "Delivery",
  internal_transfer: "Internal Transfer",
  adjustment: "Adjustment",
} as const
