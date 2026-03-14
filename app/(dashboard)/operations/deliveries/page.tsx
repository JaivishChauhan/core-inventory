import { Truck, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Deliveries",
}

/**
 * Deliveries page — outgoing goods to customers.
 * Follows the Pick -> Pack -> Validate workflow.
 */
export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-sm text-muted-foreground">
            Pick, pack, and validate outgoing customer shipments.
          </p>
        </div>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto">
          <Plus className="size-4" />
          New Delivery
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <Truck className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Delivery Orders Table</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manage outgoing shipments. Validation decrements the stock
                  ledger.
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
