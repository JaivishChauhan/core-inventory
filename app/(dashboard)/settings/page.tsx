"use client"

import { useQuery } from "@tanstack/react-query"
import {
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Warehouse,
} from "lucide-react"

import { WarehouseDialog } from "@/components/settings/warehouse-dialog"
import { LocationDialog } from "@/components/settings/location-dialog"
import { DeleteConfirmDialog } from "@/components/settings/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

type ReferenceDataResponse = {
  categories: string[]
  warehouses: Array<{
    id: string
    name: string
    code: string
    address: string | null
  }>
  locations: Array<{
    id: string
    name: string
    type: string
    warehouseId: string
    warehouseName: string
  }>
}

const LOCATION_TYPE_COLORS: Record<string, string> = {
  internal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  vendor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  customer: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  loss: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

/**
 * SettingsPage — full CRUD for warehouses and locations.
 * Displays warehouses as cards with location tables inside.
 * @client Required for mutations and query state.
 */
export default function SettingsPage() {
  const { data: referenceData, isLoading } = useQuery<ReferenceDataResponse>({
    queryKey: ["inventory-reference-data"],
    queryFn: () =>
      fetch("/api/inventory/reference-data").then(
        (res) => res.json() as Promise<ReferenceDataResponse>
      ),
    staleTime: 60_000,
  })

  const warehouseList = referenceData?.warehouses ?? []
  const allLocations = referenceData?.locations ?? []
  const categories = referenceData?.categories ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-2.5 dark:from-slate-800 dark:to-slate-900">
            <Settings2 className="size-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage warehouses, locations, and system configuration.
            </p>
          </div>
        </div>
        <WarehouseDialog
          trigger={
            <Button className="btn-lift glow-blue rounded-full">
              <Plus className="mr-2 size-4" />
              New Warehouse
            </Button>
          }
        />
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-gradient-to-br from-background to-muted/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Warehouse className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Warehouses</p>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-8" /> : warehouseList.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-gradient-to-br from-background to-muted/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Locations</p>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-8" /> : allLocations.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-gradient-to-br from-background to-muted/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Categories</p>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-8" /> : categories.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Warehouse Cards ─── */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="panel glass">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : warehouseList.length === 0 ? (
        <Card className="panel glass">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Warehouse className="size-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No warehouses yet</p>
            <p className="text-sm text-muted-foreground/70">
              Create your first warehouse to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {warehouseList.map((warehouse) => {
            const warehouseLocations = allLocations.filter(
              (loc) => loc.warehouseId === warehouse.id
            )

            return (
              <Card key={warehouse.id} className="panel glass">
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <Warehouse className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{warehouse.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{warehouse.code}</span>
                        {warehouse.address ? ` · ${warehouse.address}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LocationDialog
                      warehouseId={warehouse.id}
                      warehouseName={warehouse.name}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Plus className="size-3.5" />
                          Add Location
                        </Button>
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="size-8 p-0">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <WarehouseDialog
                          warehouse={warehouse}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="mr-2 size-3.5" />
                              Edit Warehouse
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuSeparator />
                        <DeleteConfirmDialog
                          entityType="warehouse"
                          entityId={warehouse.id}
                          entityName={warehouse.name}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              Delete Warehouse
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {warehouseLocations.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground/70">
                      No locations in this warehouse yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {warehouseLocations.map((location) => (
                        <div
                          key={location.id}
                          className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="size-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{location.name}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${LOCATION_TYPE_COLORS[location.type] ?? ""}`}
                            >
                              {location.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <LocationDialog
                              warehouseId={warehouse.id}
                              warehouseName={warehouse.name}
                              location={location}
                              trigger={
                                <Button variant="ghost" size="sm" className="size-7 p-0">
                                  <Pencil className="size-3" />
                                </Button>
                              }
                            />
                            <DeleteConfirmDialog
                              entityType="location"
                              entityId={location.id}
                              entityName={location.name}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Tracked Categories ─── */}
      <Card className="panel glass">
        <CardHeader>
          <CardTitle className="text-base">Tracked Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground/70">
              No categories yet. Create products with categories to see them here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
