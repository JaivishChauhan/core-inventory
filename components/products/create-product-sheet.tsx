"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, MapPin, Package, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().min(1, "SKU is required when provided").optional()
  ),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().min(0, "Must be 0 or greater"),
  initial_stock: z.number().min(0, "Must be 0 or greater"),
  initial_location_id: z.string().optional(),
})

type ProductFormValues = z.infer<typeof ProductFormSchema>

type ReferenceDataResponse = {
  internalLocations: Array<{
    id: string
    name: string
    warehouseId: string
    warehouseName: string
  }>
}

/**
 * CreateProductSheet — slide-over panel for creating a new product.
 * Adds optional initial stock so catalog creation can seed the ledger immediately.
 */
export function CreateProductSheet() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      reorder_point: 0,
      initial_stock: 0,
    },
  })

  const initialStock = useWatch({ control, name: "initial_stock" })
  const initialLocationId = useWatch({ control, name: "initial_location_id" })

  const { data: referenceData, isLoading: isLoadingReferenceData } =
    useQuery<ReferenceDataResponse>({
      queryKey: ["inventory-reference-data", "product-create"],
      queryFn: () =>
        fetch("/api/inventory/reference-data").then(
          (response) => response.json() as Promise<ReferenceDataResponse>
        ),
      staleTime: 5 * 60 * 1000,
    })

  const createProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sku: values.sku?.trim() || undefined,
          reorder_point: Number(values.reorder_point),
          initial_stock: Number(values.initial_stock ?? 0),
          initial_location_id:
            Number(values.initial_stock ?? 0) > 0
              ? values.initial_location_id
              : undefined,
        }),
      })

      const data = (await res.json()) as {
        error?: string
        initialMove?: unknown
        product?: unknown
      }

      if (!res.ok) throw new Error(data.error ?? "Failed to create product")
      return data
    },
    onSuccess: (data) => {
      toast.success(
        data.initialMove
          ? "Product and initial stock created successfully."
          : "Product created successfully."
      )
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-reference-data"] })
      setOpen(false)
      reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          id="btn-create-product"
          className="btn-lift rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
        >
          <Plus className="mr-2 size-4" />
          New Product
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-row items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Package className="size-5" />
            </div>
            <div>
              <SheetTitle>Create Product</SheetTitle>
              <SheetDescription>
                Add a new item to the catalog and optionally seed its opening
                stock.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((values) =>
            createProductMutation.mutate(values)
          )}
          className="mt-6 flex h-[calc(100%-4rem)] flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Product Name *
            </Label>
            <Input
              id="name"
              placeholder="Steel Rods 12mm"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="sku"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                SKU (optional)
              </Label>
              <Input
                id="sku"
                placeholder="Leave blank to auto-generate (e.g. SKU-000123)"
                {...register("sku")}
              />
              {errors.sku ? (
                <p className="text-xs text-destructive">{errors.sku.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="unit_of_measure"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Unit *
              </Label>
              <Input
                id="unit_of_measure"
                placeholder="kg / piece / m"
                {...register("unit_of_measure")}
              />
              {errors.unit_of_measure ? (
                <p className="text-xs text-destructive">
                  {errors.unit_of_measure.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="category"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Category *
            </Label>
            <Input
              id="category"
              placeholder="Raw Materials"
              {...register("category")}
            />
            {errors.category ? (
              <p className="text-xs text-destructive">
                {errors.category.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="reorder_point"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Reorder Point
              </Label>
              <Input
                id="reorder_point"
                type="number"
                min={0}
                placeholder="0"
                {...register("reorder_point", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Low-stock alerts trigger when available stock reaches this
                threshold.
              </p>
              {errors.reorder_point ? (
                <p className="text-xs text-destructive">
                  {errors.reorder_point.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="initial_stock"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Initial Stock
              </Label>
              <Input
                id="initial_stock"
                type="number"
                min={0}
                placeholder="0"
                {...register("initial_stock", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Optional opening balance that is logged as an adjustment.
              </p>
              {errors.initial_stock ? (
                <p className="text-xs text-destructive">
                  {errors.initial_stock.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Initial Stock Location
            </Label>
            <Select
              value={initialLocationId}
              onValueChange={(value) => setValue("initial_location_id", value)}
              disabled={
                Number(initialStock ?? 0) <= 0 || isLoadingReferenceData
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue
                  placeholder={
                    Number(initialStock ?? 0) > 0
                      ? "Choose where the opening stock lands"
                      : "Enable by entering an initial stock quantity"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {referenceData?.internalLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.warehouseName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              If left blank, the app uses the first internal location available.
            </p>
          </div>

          <div className="mt-auto flex gap-3 border-t border-border/60 pt-4">
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              id="btn-submit-product"
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Create Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
