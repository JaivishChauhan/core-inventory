"use client"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { History, AlertCircle } from "lucide-react"
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
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  waiting: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  ready: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

const TYPE_BADGE_CLASSES: Record<keyof typeof MOVE_TYPE_LABELS, string> = {
  receipt: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  delivery: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  internal_transfer: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  adjustment: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
}

export default function MoveHistoryPage() {
  const { data, isLoading, isError } = useQuery<{ moves: StockMove[] }>({
    queryKey: ["move-history"],
    queryFn: () => fetch("/api/inventory/move").then((r) => r.json()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const moves = data?.moves ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="text-gradient">Move History</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full immutable ledger of all stock movements. Sorted newest first.
        </p>
      </div>

      <Card className="border-border/50 shadow-soft">
        <CardHeader className="border-b border-border/50 pb-4">
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
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="pr-6 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-6" : ""}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-destructive">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-8" />
                      <span>Failed to load history. Please refresh.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : moves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <History className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">No movements recorded yet</p>
                      <p className="text-sm text-muted-foreground/60">
                        Stock moves will appear here once operations begin.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                moves.map((move) => (
                  <TableRow key={move.id} className="border-border/50 transition-colors hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <span className="font-mono text-xs text-muted-foreground">
                        {move.reference ?? move.id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASSES[move.move_type] ?? ""}`}>
                        {MOVE_TYPE_LABELS[move.move_type] ?? move.move_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[move.status] ?? ""}`}>
                        {MOVE_STATUS_CONFIG[move.status]?.label ?? move.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold">{move.quantity}</span>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {new Date(move.created_at).toLocaleString("en-IN", {
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
