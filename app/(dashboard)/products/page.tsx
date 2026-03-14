import { Package, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products",
}

/**
 * Products page — master catalog of all physical goods.
 * Server Component. The data table will be rendered here with
 * server-side pagination and column sorting.
 */
export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog. Stock is derived from the ledger.
          </p>
        </div>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto">
          <Plus className="size-4" />
          New Product
        </Button>
      </div>

      {/* Data Table Placeholder */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-md space-y-3 text-center">
              <Package className="mx-auto size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Product Data Table</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Server-side pagination, multi-column sorting, and column
                  visibility toggling.
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
