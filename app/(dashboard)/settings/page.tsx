import { Building2, MapPin, Warehouse } from "lucide-react"
import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getInventoryReferenceData } from "@/lib/db/queries/inventory"

export const metadata: Metadata = {
  title: "Settings | Core Inventory",
}

export default async function SettingsPage() {
  const referenceData = await getInventoryReferenceData()

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="text-gradient">Warehouse Settings</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review warehouse entities, their location hierarchy, and the virtual
          locations used by the stock ledger.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Warehouses</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {referenceData.warehouses.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Internal Locations</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {referenceData.internalLocations.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Tracked Categories</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {referenceData.categories.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {referenceData.warehouses.map((warehouse) => {
          const warehouseLocations = referenceData.locations.filter(
            (location) => location.warehouseId === warehouse.id
          )

          return (
            <Card key={warehouse.id} className="border-border/60 shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-indigo-600" />
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                </div>
                <CardDescription>
                  {warehouse.code}
                  {warehouse.address ? ` • ${warehouse.address}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Warehouse className="size-3.5" />
                    {warehouseLocations.filter((location) => location.type === "internal").length} internal
                  </Badge>
                  <Badge variant="outline">
                    {warehouseLocations.filter((location) => location.type !== "internal").length} virtual
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {warehouseLocations.map((location) => (
                    <div
                      key={location.id}
                      className="rounded-xl border border-border/60 bg-background px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-muted-foreground" />
                          <p className="font-medium">{location.name}</p>
                        </div>
                        <Badge
                          variant={
                            location.type === "internal" ? "success" : "outline"
                          }
                          className="capitalize"
                        >
                          {location.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
