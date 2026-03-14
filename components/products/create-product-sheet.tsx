"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Package } from "lucide-react"

const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().min(0, "Must be 0 or greater"),
})

type ProductFormValues = z.infer<typeof ProductFormSchema>

/**
 * CreateProductSheet — slide-over panel for creating a new product.
 * FRD §3: "Never navigate the user away from context to fill out a form."
 * Uses React Hook Form + Zod for type-safe client validation.
 * Optimistic UI: invalidates the product list query on success.
 *
 * "use client" required for form state, mutation, and sheet open/close.
 */
export function CreateProductSheet() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: { reorder_point: 0 },
  })

  const createProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          reorder_point: Number(values.reorder_point),
        }),
      })
      const data = await res.json() as { error?: string; product?: unknown }
      if (!res.ok) throw new Error(data.error ?? "Failed to create product")
      return data
    },
    onSuccess: () => {
      toast.success("Product created successfully.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
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
          className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-button"
        >
          <Plus className="mr-2 size-4" />
          New Product
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-row items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Package className="size-5" />
            </div>
            <div>
              <SheetTitle>Create Product</SheetTitle>
              <SheetDescription>
                Add a new item to the inventory catalog.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((values) =>
            createProductMutation.mutate({
              ...values,
              reorder_point: Number(values.reorder_point),
            })
          )}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Name *
            </Label>
            <Input id="name" placeholder="Steel Rods 12mm" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                SKU *
              </Label>
              <Input id="sku" placeholder="STL-ROD-12" {...register("sku")} />
              {errors.sku && (
                <p className="text-xs text-destructive">{errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_of_measure" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Unit *
              </Label>
              <Input id="unit_of_measure" placeholder="kg / piece / m" {...register("unit_of_measure")} />
              {errors.unit_of_measure && (
                <p className="text-xs text-destructive">{errors.unit_of_measure.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Category *
            </Label>
            <Input id="category" placeholder="Raw Materials" {...register("category")} />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reorder_point" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
              Alert is triggered when stock falls below this number.
            </p>
            {errors.reorder_point && (
              <p className="text-xs text-destructive">{errors.reorder_point.message}</p>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              id="btn-submit-product"
            >
              {createProductMutation.isPending ? "Saving…" : "Create Product"}
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
