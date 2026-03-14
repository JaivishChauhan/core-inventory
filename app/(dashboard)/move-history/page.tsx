import { History } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Move History",
}

/**
 * Move History page — the immutable audit trail.
 * A dense, read-only data table of every confirmed ledger entry.
 * This is the ultimate source of truth for all stock movements.
 */
export default function MoveHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Move History</h1>
        <p className="text-sm text-muted-foreground">
          Immutable audit trail of every stock movement. The ultimate source of
          truth.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <History className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Master Audit Log</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Date, Reference, Product, Source, Destination, Quantity, and
                  Status for every confirmed entry.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Phase 4 — Data Table Integration
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
