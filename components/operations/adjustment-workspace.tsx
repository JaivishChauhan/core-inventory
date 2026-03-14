"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MOVE_STATUS_CONFIG } from "@/lib/constants"

type ReferenceDataResponse = {
  internalLocations: Array<{
    id: string
    name: string
    warehouseId: string
    warehouseName: string
  }>
  products: Array<{
    id: string
    name: string
    sku: string
    totalAvailable: number
  }>
}

type AdjustmentMove = {
  id: string
  productName: string
  sku: string
  quantity: number
  status: keyof typeof MOVE_STATUS_CONFIG
  reference: string | null
  createdAt: string
  sourceLocationName: string
  sourceWarehouseName: string | null
  destLocationName: string
  destWarehouseName: string | null
}

type MoveResponse = {
  moves: AdjustmentMove[]
}

export function AdjustmentWorkspace() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [countedQuantity, setCountedQuantity] = useState("0")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  const { data: referenceData, isLoading: isLoadingReferenceData } =
    useQuery<ReferenceDataResponse>({
      queryKey: ["inventory-reference-data", "adjustments"],
      queryFn: () =>
        fetch("/api/inventory/reference-data?includeProducts=1").then(
          (response) => response.json() as Promise<ReferenceDataResponse>
        ),
      staleTime: 5 * 60 * 1000,
    })

  const { data: moveData, isLoading, isError } = useQuery<MoveResponse>({
    queryKey: ["moves", "adjustment"],
    queryFn: () =>
      fetch("/api/inventory/move?moveType=adjustment").then(
        (response) => response.json() as Promise<MoveResponse>
      ),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const createAdjustmentMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Select a product before applying an adjustment.")
      if (!locationId) throw new Error("Select a location before applying an adjustment.")
      if (!Number.isFinite(Number(countedQuantity)) || Number(countedQuantity) < 0) {
        throw new Error("Enter a valid counted quantity.")
      }

      const response = await fetch("/api/inventory/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          counted_quantity: Number(countedQuantity),
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? "Failed to apply adjustment.")
      return data
    },
    onSuccess: () => {
      toast.success("Inventory adjustment applied and posted to the ledger.")
      queryClient.invalidateQueries({ queryKey: ["moves", "adjustment"] })
      queryClient.invalidateQueries({ queryKey: ["move-history"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setOpen(false)
      setProductId("")
      setLocationId("")
      setCountedQuantity("0")
      setReference("")
      setNotes("")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const moves = moveData?.moves ?? []

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">Inventory Adjustments</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Reconcile physical counts against recorded stock. The app calculates the
            delta and logs it directly to the ledger.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="btn-lift rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
              <Plus className="mr-2 size-4" />
              New Adjustment
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="sm:max-w-xl">
            <SheetHeader>
              <div className="flex flex-row items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <ClipboardCheck className="size-5" />
                </div>
                <div>
                  <SheetTitle>Apply Stock Adjustment</SheetTitle>
                  <SheetDescription>
                    Enter the counted quantity and the system will log only the difference.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 flex h-[calc(100%-4rem)] flex-col gap-4">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData?.products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — {product.totalAvailable} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an internal location" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData?.internalLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.warehouseName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="counted-quantity">Counted Quantity</Label>
                <Input
                  id="counted-quantity"
                  type="number"
                  min={0}
                  value={countedQuantity}
                  onChange={(event) => setCountedQuantity(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The app compares this physical count with the current ledger stock.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adjustment-reference">Reference</Label>
                <Input
                  id="adjustment-reference"
                  placeholder="COUNT-MAR-14 / DAMAGE-07"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adjustment-notes">Notes</Label>
                <Input
                  id="adjustment-notes"
                  placeholder="Optional reason for the count change"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="mt-auto flex gap-3 border-t border-border/60 pt-4">
                <Button
                  onClick={() => createAdjustmentMutation.mutate()}
                  disabled={
                    createAdjustmentMutation.isPending || isLoadingReferenceData
                  }
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                >
                  {createAdjustmentMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Applying
                    </>
                  ) : (
                    "Apply Adjustment"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/20">
                <TableHead className="pl-6">Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead className="pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/10" />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-destructive">
                    Failed to load adjustments. Please refresh.
                  </TableCell>
                </TableRow>
              ) : moves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <ClipboardCheck className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        No adjustments have been logged yet
                      </p>
                      <p className="text-sm text-muted-foreground/60">
                        Apply the first counted-stock correction when a variance appears.
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
                    <TableCell>
                      <Badge variant={move.status === "done" ? "success" : "outline"}>
                        {MOVE_STATUS_CONFIG[move.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {move.quantity}
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-muted-foreground">
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
