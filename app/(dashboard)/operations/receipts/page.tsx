import { PackagePlus, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Receipts",
}

/**
 * Receipts page — incoming goods from vendors.
 * Follows the List -> Slide-over -> Validate pattern.
 */
export default function ReceiptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receipts</h1>
          <p className="text-sm text-muted-foreground">
            Process incoming vendor deliveries and validate received quantities.
          </p>
        </div>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto">
          <Plus className="size-4" />
          New Receipt
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <PackagePlus className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Receipts Operation Table</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  View past and pending vendor deliveries. Create new receipts
                  via slide-over.
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
