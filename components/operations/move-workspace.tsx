"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  Loader2,
  PackagePlus,
  Plus,
  Truck,
} from "lucide-react"
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
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

type MoveType = "delivery" | "internal_transfer" | "receipt"
type MoveStatus = "all" | "done" | "draft" | "ready" | "waiting"

type LocationRecord = {
  id: string
  name: string
  type: string
  warehouseId: string
  warehouseName: string
}

type ProductRecord = {
  id: string
  name: string
  sku: string
  totalAvailable: number
}

type ReferenceDataResponse = {
  locations: LocationRecord[]
  internalLocations: Array<{
    id: string
    name: string
    warehouseId: string
    warehouseName: string
  }>
  products: ProductRecord[]
}

type MoveRecord = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  moveType: MoveType
  status: keyof typeof MOVE_STATUS_CONFIG
  reference: string | null
  createdAt: string
  sourceLocationName: string
  sourceWarehouseName: string | null
  destLocationName: string
  destWarehouseName: string | null
}

type MoveResponse = {
  moves: MoveRecord[]
}

const MOVE_CONFIG: Record<
  MoveType,
  {
    title: string
    subtitle: string
    description: string
    buttonLabel: string
    icon: typeof PackagePlus
    sheetTitle: string
    sheetDescription: string
    sourceLabel: string
    destinationLabel: string
    statusHelp: string
  }
> = {
  receipt: {
    title: "Receipts",
    subtitle: "Incoming Goods",
    description: "Create receipt documents, route them through waiting/ready states, and validate them into stock.",
    buttonLabel: "New Receipt",
    icon: PackagePlus,
    sheetTitle: "Create Receipt",
    sheetDescription: "Record incoming vendor stock before it is validated into the ledger.",
    sourceLabel: "Vendor Source",
    destinationLabel: "Receive Into",
    statusHelp: "Use waiting for planned receipts and ready once quantities are confirmed.",
  },
  delivery: {
    title: "Deliveries",
    subtitle: "Outgoing Orders",
    description: "Track pick-pack-validate workflow for customer shipments leaving the warehouse.",
    buttonLabel: "New Delivery",
    icon: Truck,
    sheetTitle: "Create Delivery Order",
    sheetDescription: "Create an outbound move and validate it once picking and packing are complete.",
    sourceLabel: "Ship From",
    destinationLabel: "Customer Destination",
    statusHelp: "Draft for new orders, waiting during picking, ready once packed and ready to dispatch.",
  },
  internal_transfer: {
    title: "Internal Transfers",
    subtitle: "Warehouse Reallocation",
    description: "Move stock between racks, production areas, and warehouses while preserving total company stock.",
    buttonLabel: "New Transfer",
    icon: ArrowLeftRight,
    sheetTitle: "Create Internal Transfer",
    sheetDescription: "Plan internal movement between two stock-holding locations before validation.",
    sourceLabel: "Move From",
    destinationLabel: "Move To",
    statusHelp: "Use draft for planning and ready once the move is physically staged.",
  },
}

function getStatusBadgeVariant(status: keyof typeof MOVE_STATUS_CONFIG) {
  if (status === "done") return "success"
  if (status === "canceled") return "destructive"
  if (status === "waiting") return "warning"
  if (status === "ready") return "secondary"
  return "outline"
}

function findVirtualLocation(
  locations: LocationRecord[],
  warehouseId: string,
  type: "customer" | "vendor"
) {
  return locations.find(
    (location) => location.type === type && location.warehouseId === warehouseId
  )
}

export function MoveWorkspace({ moveType }: { moveType: MoveType }) {
  const config = MOVE_CONFIG[moveType]
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<MoveStatus>("all")
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [workflowStatus, setWorkflowStatus] = useState<"draft" | "ready" | "waiting">(
    moveType === "receipt" ? "waiting" : "draft"
  )
  const [sourceLocationId, setSourceLocationId] = useState("")
  const [destinationLocationId, setDestinationLocationId] = useState("")

  const { data: referenceData, isLoading: isLoadingReferenceData } =
    useQuery<ReferenceDataResponse>({
      queryKey: ["inventory-reference-data", "operations", moveType],
      queryFn: () =>
        fetch("/api/inventory/reference-data?includeProducts=1").then(
          (response) => response.json() as Promise<ReferenceDataResponse>
        ),
      staleTime: 5 * 60 * 1000,
    })

  const { data: moveData, isLoading: isLoadingMoves, isError } =
    useQuery<MoveResponse>({
      queryKey: ["moves", moveType, statusFilter],
      queryFn: () => {
        const searchParams = new URLSearchParams({ moveType })
        if (statusFilter !== "all") searchParams.set("status", statusFilter)
        return fetch(`/api/inventory/move?${searchParams.toString()}`).then(
          (response) => response.json() as Promise<MoveResponse>
        )
      },
      staleTime: 15_000,
      refetchInterval: 30_000,
    })

  const createMoveMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Select a product before saving.")
      if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
        throw new Error("Enter a valid quantity greater than zero.")
      }

      const locations = referenceData?.locations ?? []

      let sourceId = sourceLocationId
      let destinationId = destinationLocationId

      if (moveType === "receipt") {
        if (!destinationId) throw new Error("Choose where the receipt lands.")
        const destinationLocation = locations.find((location) => location.id === destinationId)
        if (!destinationLocation) throw new Error("Choose a valid receiving location.")

        const vendorLocation = findVirtualLocation(
          locations,
          destinationLocation.warehouseId,
          "vendor"
        )

        if (!vendorLocation) {
          throw new Error("Vendor location is missing for this warehouse.")
        }

        sourceId = vendorLocation.id
      }

      if (moveType === "delivery") {
        if (!sourceId) throw new Error("Choose the source location for the delivery.")
        const sourceLocation = locations.find((location) => location.id === sourceId)
        if (!sourceLocation) throw new Error("Choose a valid shipping location.")

        const customerLocation = findVirtualLocation(
          locations,
          sourceLocation.warehouseId,
          "customer"
        )

        if (!customerLocation) {
          throw new Error("Customer location is missing for this warehouse.")
        }

        destinationId = customerLocation.id
      }

      if (moveType === "internal_transfer") {
        if (!sourceId || !destinationId) {
          throw new Error("Choose both source and destination locations.")
        }
        if (sourceId === destinationId) {
          throw new Error("Source and destination locations must be different.")
        }
      }

      const response = await fetch("/api/inventory/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          source_location_id: sourceId,
          dest_location_id: destinationId,
          quantity: Number(quantity),
          move_type: moveType,
          status: workflowStatus,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      const data = (await response.json()) as { error?: string; move?: unknown }
      if (!response.ok) throw new Error(data.error ?? "Failed to create operation.")
      return data
    },
    onSuccess: () => {
      toast.success(`${config.sheetTitle} saved.`)
      queryClient.invalidateQueries({ queryKey: ["moves", moveType] })
      queryClient.invalidateQueries({ queryKey: ["move-history"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setOpen(false)
      setProductId("")
      setQuantity("1")
      setReference("")
      setNotes("")
      setSourceLocationId("")
      setDestinationLocationId("")
      setWorkflowStatus(moveType === "receipt" ? "waiting" : "draft")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const validateMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      const response = await fetch(`/api/inventory/move/${moveId}/validate`, {
        method: "POST",
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? "Failed to validate move.")
      return data
    },
    onSuccess: () => {
      toast.success("Move validated and posted to the ledger.")
      queryClient.invalidateQueries({ queryKey: ["moves", moveType] })
      queryClient.invalidateQueries({ queryKey: ["move-history"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const internalLocations = useMemo(
    () => referenceData?.internalLocations ?? [],
    [referenceData?.internalLocations]
  )
  const products = useMemo(
    () => referenceData?.products ?? [],
    [referenceData?.products]
  )
  const visibleSourceLocations = useMemo(
    () => (moveType === "receipt" ? [] : internalLocations),
    [internalLocations, moveType]
  )
  const visibleDestinationLocations = useMemo(
    () => (moveType === "delivery" ? [] : internalLocations),
    [internalLocations, moveType]
  )

  const selectedSourceWarehouseId = useMemo(
    () =>
      referenceData?.locations.find((location) => location.id === sourceLocationId)?.warehouseId ??
      null,
    [referenceData?.locations, sourceLocationId]
  )

  const destinationOptions = useMemo(() => {
    if (moveType !== "internal_transfer" || !selectedSourceWarehouseId) {
      return visibleDestinationLocations
    }

    return visibleDestinationLocations.filter(
      (location) => location.warehouseId === selectedSourceWarehouseId
    )
  }, [moveType, selectedSourceWarehouseId, visibleDestinationLocations])

  const moves = moveData?.moves ?? []
  const Icon = config.icon

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">{config.title}</span>{" "}
            <span className="text-lg text-muted-foreground sm:text-xl">
              ({config.subtitle})
            </span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="btn-lift rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
              <Plus className="mr-2 size-4" />
              {config.buttonLabel}
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="sm:max-w-xl">
            <SheetHeader>
              <div className="flex flex-row items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Icon className="size-5" />
                </div>
                <div>
                  <SheetTitle>{config.sheetTitle}</SheetTitle>
                  <SheetDescription>{config.sheetDescription}</SheetDescription>
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
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — {product.totalAvailable} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`${moveType}-quantity`}>Quantity</Label>
                  <Input
                    id={`${moveType}-quantity`}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Workflow Status</Label>
                  <Select
                    value={workflowStatus}
                    onValueChange={(value) =>
                      setWorkflowStatus(value as "draft" | "ready" | "waiting")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{config.statusHelp}</p>
                </div>
              </div>

              {moveType !== "receipt" ? (
                <div className="space-y-1.5">
                  <Label>{config.sourceLabel}</Label>
                  <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an internal source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleSourceLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.warehouseName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {moveType !== "delivery" ? (
                <div className="space-y-1.5">
                  <Label>{config.destinationLabel}</Label>
                  <Select
                    value={destinationLocationId}
                    onValueChange={setDestinationLocationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an internal destination location" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.warehouseName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor={`${moveType}-reference`}>Reference</Label>
                <Input
                  id={`${moveType}-reference`}
                  placeholder="PO-10042 / SO-204 / PICK-88"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${moveType}-notes`}>Notes</Label>
                <Input
                  id={`${moveType}-notes`}
                  placeholder="Optional handling notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="mt-auto flex gap-3 border-t border-border/60 pt-4">
                <Button
                  onClick={() => createMoveMutation.mutate()}
                  disabled={
                    createMoveMutation.isPending ||
                    isLoadingReferenceData ||
                    products.length === 0
                  }
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                >
                  {createMoveMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    config.buttonLabel
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as MoveStatus)}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground">
          {moves.length} {moves.length === 1 ? "document" : "documents"} shown
        </p>
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
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMoves ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/10" />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-destructive">
                    Failed to load operation history. Please refresh.
                  </TableCell>
                </TableRow>
              ) : moves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <Icon className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        No {config.title.toLowerCase()} in this status yet
                      </p>
                      <p className="text-sm text-muted-foreground/60">
                        Create a new document to start the workflow.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                moves.map((move) => (
                  <TableRow key={move.id} className="border-border/50">
                    <TableCell className="pl-6">
                      <div className="space-y-1">
                        <p className="font-mono text-xs">
                          {move.reference ?? move.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {MOVE_TYPE_LABELS[move.moveType]}
                        </p>
                      </div>
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
                      <Badge variant={getStatusBadgeVariant(move.status)}>
                        {MOVE_STATUS_CONFIG[move.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {move.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(move.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {move.status !== "done" && move.status !== "canceled" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateMoveMutation.mutate(move.id)}
                          disabled={validateMoveMutation.isPending}
                        >
                          Validate
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Posted</span>
                      )}
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
