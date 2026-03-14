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
            <Button className="btn-lift rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md glow-blue">
              <Plus className="mr-2 size-4" />
              New Adjustment
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="sm:max-w-xl panel glass">
            <SheetHeader>
              <div className="flex flex-row items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 text-indigo-400">
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
              <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/10">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="bg-transparent text-white">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent className="panel glass text-white">
                    {referenceData?.products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — {product.totalAvailable} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/10">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="bg-transparent text-white">
                    <SelectValue placeholder="Select an internal location" />
                  </SelectTrigger>
                  <SelectContent className="panel glass text-white">
                    {referenceData?.internalLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.warehouseName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/10">
                <Label htmlFor="counted-quantity">Counted Quantity</Label>
                <Input
                  id="counted-quantity"
                  type="number"
                  min={0}
                  className="bg-transparent text-white"
                  value={countedQuantity}
                  onChange={(event) => setCountedQuantity(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The app compares this physical count with the current ledger stock.
                </p>
              </div>

              <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/10">
                <Label htmlFor="adjustment-reference">Reference</Label>
                <Input
                  id="adjustment-reference"
                  className="bg-transparent text-white"
                  placeholder="COUNT-MAR-14 / DAMAGE-07"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </div>

              <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/10">
                <Label htmlFor="adjustment-notes">Notes</Label>
                <Input
                  id="adjustment-notes"
                  className="bg-transparent text-white"
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
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white glow-blue"
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
                <Button type="button" variant="outline" className="panel glass text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="panel glass border-border/60 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border/50">
                <TableHead className="pl-6 text-muted-foreground">Reference</TableHead>
                <TableHead className="text-muted-foreground">Product</TableHead>
                <TableHead className="text-muted-foreground">Route</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Delta</TableHead>
                <TableHead className="pr-6 text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index} className="border-border/50">
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-white/5" />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="border-border/50">
                  <TableCell colSpan={6} className="py-16 text-center text-destructive">
                    Failed to load adjustments. Please refresh.
                  </TableCell>
                </TableRow>
              ) : moves.length === 0 ? (
                <TableRow className="border-border/50">
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
                  <TableRow key={move.id} className="border-border/50 bg-white/5 transition-colors hover:bg-white/10">
                    <TableCell className="pl-6 font-mono text-xs text-white">
                      {move.reference ?? move.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-white">{move.productName}</p>
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
                      <Badge variant={move.status === "done" ? "success" : "outline"} className={move.status === "done" ? "" : "border-white/20 text-white"}>
                        {MOVE_STATUS_CONFIG[move.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-white">
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
