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

/** Navigation items for the sidebar */
export const NAV_ITEMS = {
  main: [
    { title: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { title: "Products", href: "/products", icon: "Package" },
  ],
  operations: [
    { title: "Receipts", href: "/operations/receipts", icon: "PackagePlus" },
    { title: "Deliveries", href: "/operations/deliveries", icon: "Truck" },
    {
      title: "Transfers",
      href: "/operations/transfers",
      icon: "ArrowLeftRight",
    },
    {
      title: "Adjustments",
      href: "/operations/adjustments",
      icon: "ClipboardCheck",
    },
  ],
  system: [
    { title: "Move History", href: "/move-history", icon: "History" },
    { title: "Settings", href: "/settings", icon: "Settings" },
  ],
} as const

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
