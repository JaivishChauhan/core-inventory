import { ArrowLeftRight, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Internal Transfers",
}

/**
 * Internal Transfers page — moving stock within the warehouse.
 * Total company stock remains unchanged; location metadata updates.
 */
export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Internal Transfers
          </h1>
          <p className="text-sm text-muted-foreground">
            Move stock between locations within your warehouses.
          </p>
        </div>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto">
          <Plus className="size-4" />
          New Transfer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <ArrowLeftRight className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Transfers Table</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track internal movements. Total stock stays constant, location
                  availability updates.
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
