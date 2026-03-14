"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, AlertCircle, Search, Plus, Download, SlidersHorizontal } from "lucide-react"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

type StockMove = {
  id: string
  product_id: string
  move_type: keyof typeof MOVE_TYPE_LABELS
  status: keyof typeof MOVE_STATUS_CONFIG
  quantity: number
  reference: string | null
  created_at: string
  validated_at: string | null
}

const STATUS_BADGE_CLASSES: Record<keyof typeof MOVE_STATUS_CONFIG, string> = {
  draft: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  waiting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ready: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading, isError } = useQuery<{ moves: StockMove[] }>({
    queryKey: ["move-history"],
    queryFn: () => fetch("/api/inventory/move").then((r) => r.json()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const moves = data?.moves ?? []

  // Calculate status counts
  const statusCounts = {
    all: moves.length,
    draft: moves.filter((m) => m.status === "draft").length,
    waiting: moves.filter((m) => m.status === "waiting").length,
    ready: moves.filter((m) => m.status === "ready").length,
    done: moves.filter((m) => m.status === "done").length,
  }

  // Filter moves based on active tab
  const filteredMoves = moves.filter((move) => {
    if (activeTab !== "all" && move.status !== activeTab) return false
    if (searchQuery && !move.reference?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order list</h1>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl border p-4 text-left transition-all ${
            activeTab === "all"
              ? "border-blue-500/50 bg-blue-500/10"
              : "border-border/50 bg-card/50 hover:bg-card"
          }`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-xs text-muted-foreground">All orders</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("draft")}
          className={`rounded-xl border p-4 text-left transition-all ${
            activeTab === "draft"
              ? "border-blue-500/50 bg-blue-500/10"
              : "border-border/50 bg-card/50 hover:bg-card"
          }`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold">{statusCounts.draft}</p>
            <p className="text-xs text-muted-foreground">New orders</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("waiting")}
          className={`rounded-xl border p-4 text-left transition-all ${
            activeTab === "waiting"
              ? "border-amber-500/50 bg-amber-500/10"
              : "border-border/50 bg-card/50 hover:bg-card"
          }`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold">{statusCounts.waiting}</p>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          className={`rounded-xl border p-4 text-left transition-all ${
            activeTab === "ready"
              ? "border-yellow-500/50 bg-yellow-500/10"
              : "border-border/50 bg-card/50 hover:bg-card"
          }`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold">{statusCounts.ready}</p>
            <p className="text-xs text-muted-foreground">On delivery</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("done")}
          className={`rounded-xl border p-4 text-left transition-all ${
            activeTab === "done"
              ? "border-emerald-500/50 bg-emerald-500/10"
              : "border-border/50 bg-card/50 hover:bg-card"
          }`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold">{statusCounts.done}</p>
            <p className="text-xs text-muted-foreground">Delivered orders</p>
          </div>
        </button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 size-4" />
                Sort: default
              </Button>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Add order
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>ORDER NUMBER</TableHead>
                  <TableHead>CUSTOMER</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead>PRICE</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PAYMENT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center text-destructive">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="size-8" />
                        <span>Failed to load history. Please refresh.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMoves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <History className="size-10 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">No movements found</p>
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
                      <TableCell>
                        <input type="checkbox" className="rounded" />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          #{move.reference ?? move.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">Kris Poyer</p>
                          <p className="text-xs text-muted-foreground">kris.poyer@mail.com</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{MOVE_TYPE_LABELS[move.move_type]}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">$ {move.quantity * 100}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(move.created_at).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">PayPal</span>
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
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>1 of 18</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                &lt;
              </Button>
              <Button variant="outline" size="sm">
                &gt;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
