"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

type MoveTypeFilter = "adjustment" | "all" | "delivery" | "internal_transfer" | "receipt"
type StatusFilter = "all" | "canceled" | "done" | "draft" | "ready" | "waiting"

type ReferenceDataResponse = {
  categories: string[]
  warehouses: Array<{
    id: string
    name: string
    code: string
    address: string | null
  }>
}

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

type MoveResponse = {
  moves: MoveRecord[]
}

export default function MoveHistoryPage() {
  const [moveType, setMoveType] = useState<MoveTypeFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [warehouseId, setWarehouseId] = useState("all")
  const [category, setCategory] = useState("all")

  const { data: referenceData } = useQuery<ReferenceDataResponse>({
    queryKey: ["inventory-reference-data", "move-history"],
    queryFn: () =>
      fetch("/api/inventory/reference-data").then(
        (response) => response.json() as Promise<ReferenceDataResponse>
      ),
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, isError } = useQuery<MoveResponse>({
    queryKey: ["move-history", moveType, status, warehouseId, category],
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (moveType !== "all") searchParams.set("moveType", moveType)
      if (status !== "all") searchParams.set("status", status)
      if (warehouseId !== "all") searchParams.set("warehouseId", warehouseId)
      if (category !== "all") searchParams.set("category", category)
      return fetch(`/api/inventory/move?${searchParams.toString()}`).then(
        (response) => response.json() as Promise<MoveResponse>
      )
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const moves = data?.moves ?? []
  const filterSummary = useMemo(
    () => [moveType, status, warehouseId, category].filter((value) => value !== "all").length,
    [category, moveType, status, warehouseId]
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">Move History</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Immutable audit log of all receipts, deliveries, transfers, and adjustments.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {filterSummary > 0
            ? `${filterSummary} filters active`
            : "Showing all ledger entries"}
        </p>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={moveType} onValueChange={(value) => setMoveType(value as MoveTypeFilter)}>
            <SelectTrigger className="w-full sm:w-[190px]">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="receipt">Receipts</SelectItem>
              <SelectItem value="delivery">Deliveries</SelectItem>
              <SelectItem value="internal_transfer">Internal Transfers</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {referenceData?.warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {referenceData?.categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-2">
            <History className="size-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base">All Movements</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/20">
                <TableHead className="pl-6">Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="pr-6 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/10" />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-destructive">
                    Failed to load history. Please refresh.
                  </TableCell>
                </TableRow>
              ) : moves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <History className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        No ledger entries match the current filters
                      </p>
                      <p className="text-sm text-muted-foreground/60">
                        Adjust the filters or create a new operation to populate the audit trail.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                moves.map((move) => (
                  <TableRow key={move.id} className="border-border/50">
                    <TableCell className="pl-6 font-mono text-xs">
                      {move.reference ?? move.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{MOVE_TYPE_LABELS[move.moveType]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          move.status === "done"
                            ? "success"
                            : move.status === "canceled"
                              ? "destructive"
                              : move.status === "waiting"
                                ? "warning"
                                : "outline"
                        }
                      >
                        {MOVE_STATUS_CONFIG[move.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{move.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{move.sku}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {move.sourceLocationName}
                      {move.sourceWarehouseName ? ` (${move.sourceWarehouseName})` : ""}
                      {" -> "}
                      {move.destLocationName}
                      {move.destWarehouseName ? ` (${move.destWarehouseName})` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {move.quantity}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                      {new Date(move.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
