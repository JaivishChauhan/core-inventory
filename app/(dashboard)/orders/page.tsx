"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Ban,
  CheckCircle,
  History,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

type MoveRecord = {
  id: string
  productName: string
  sku: string
  quantity: number
  moveType: keyof typeof MOVE_TYPE_LABELS
  status: keyof typeof MOVE_STATUS_CONFIG
  reference: string | null
  createdAt: string
  sourceLocationName: string
  sourceWarehouseName: string | null
  destLocationName: string
  destWarehouseName: string | null
}

const STATUS_BADGE_CLASSES: Record<keyof typeof MOVE_STATUS_CONFIG, string> = {
  draft: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  waiting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ready: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
}

/**
 * OrdersPage — displays all stock moves as an "orders" view.
 * Shows real product/route data (no hardcoded customer/payment columns).
 * Includes validate/cancel actions for actionable moves.
 * @client Required for query state, mutations, and interactive filtering.
 */
export default function OrdersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading, isError } = useQuery<{ moves: MoveRecord[] }>({
    queryKey: ["orders"],
    queryFn: () =>
      fetch("/api/inventory/move").then(
        (r) => r.json() as Promise<{ moves: MoveRecord[] }>
      ),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const moves = data?.moves ?? []

  const statusCounts = {
    all: moves.length,
    draft: moves.filter((m) => m.status === "draft").length,
    waiting: moves.filter((m) => m.status === "waiting").length,
    ready: moves.filter((m) => m.status === "ready").length,
    done: moves.filter((m) => m.status === "done").length,
  }

  const filteredMoves = moves.filter((move) => {
    if (activeTab !== "all" && move.status !== activeTab) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesReference = move.reference?.toLowerCase().includes(query)
      const matchesProduct = move.productName.toLowerCase().includes(query)
      const matchesSku = move.sku.toLowerCase().includes(query)
      if (!matchesReference && !matchesProduct && !matchesSku) return false
    }
    return true
  })

  const validateMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const res = await fetch(`/api/inventory/move/${moveId}/validate`, {
        method: "PATCH",
      })
      const responseData = (await res.json()) as { error?: string }
      if (!res.ok)
        throw new Error(responseData.error ?? "Failed to validate move")
      return responseData
    },
    onSuccess: () => {
      toast.success("Move validated successfully.")
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cancelMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const res = await fetch(`/api/inventory/move/${moveId}/cancel`, {
        method: "PATCH",
      })
      const responseData = (await res.json()) as { error?: string }
      if (!res.ok)
        throw new Error(responseData.error ?? "Failed to cancel move")
      return responseData
    },
    onSuccess: () => {
      toast.success("Move canceled.")
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const isActionableStatus = (moveStatus: string) =>
    ["draft", "waiting", "ready"].includes(moveStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="text-gradient">Orders</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage all stock movements across your inventory.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          { key: "all", label: "All orders", color: "blue" },
          { key: "draft", label: "New orders", color: "blue" },
          { key: "waiting", label: "Awaiting processing", color: "amber" },
          { key: "ready", label: "Ready to ship", color: "yellow" },
          { key: "done", label: "Completed", color: "emerald" },
        ] as const).map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-xl border p-4 text-left transition-all ${
              activeTab === key
                ? `border-${color}-500/50 bg-${color}-500/10`
                : "border-border/50 bg-card/50 hover:bg-card"
            }`}
          >
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {statusCounts[key as keyof typeof statusCounts]}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </button>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product, SKU, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="pl-6">Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-16 text-center text-destructive"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="size-8" />
                        <span>Failed to load orders. Please refresh.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMoves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <History className="size-10 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">
                          No movements found
                        </p>
                        <p className="text-sm text-muted-foreground/60">
                          Try adjusting your filters or search query.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMoves.map((move) => (
                    <TableRow
                      key={move.id}
                      className="border-border/50 transition-colors hover:bg-muted/10"
                    >
                      <TableCell className="pl-6">
                        <span className="font-mono text-sm font-medium">
                          #{move.reference ?? move.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {MOVE_TYPE_LABELS[move.moveType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{move.productName}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {move.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {move.sourceLocationName}
                        {move.sourceWarehouseName
                          ? ` (${move.sourceWarehouseName})`
                          : ""}
                        {" → "}
                        {move.destLocationName}
                        {move.destWarehouseName
                          ? ` (${move.destWarehouseName})`
                          : ""}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {move.quantity}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(move.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_BADGE_CLASSES[move.status] ?? ""}
                        >
                          {MOVE_STATUS_CONFIG[move.status]?.label ?? move.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isActionableStatus(move.status) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  validateMoveMutation.mutate(move.id)
                                }
                                disabled={validateMoveMutation.isPending}
                              >
                                <CheckCircle className="mr-2 size-3.5 text-emerald-600" />
                                Validate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  cancelMoveMutation.mutate(move.id)
                                }
                                disabled={cancelMoveMutation.isPending}
                                className="text-destructive focus:text-destructive"
                              >
                                <Ban className="mr-2 size-3.5" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
