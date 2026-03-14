import { ClipboardCheck, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inventory Adjustments",
}

/**
 * Inventory Adjustments page — cycle counts and audits.
 * Fixes reality vs. system mismatches by logging corrections to the ledger.
 */
export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Adjustments
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconcile physical counts with system records.
          </p>
        </div>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto">
          <Plus className="size-4" />
          New Adjustment
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <ClipboardCheck className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Adjustments Table</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter actual counted quantities. The system auto-calculates
                  the difference.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Phase 4 — Operation Forms
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
