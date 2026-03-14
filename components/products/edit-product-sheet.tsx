"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil } from "lucide-react"
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

const EditProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().min(0, "Must be 0 or greater"),
})

type EditProductFormValues = z.infer<typeof EditProductSchema>

type EditableProduct = {
  id: string
  name: string
  sku: string
  category: string
  unitOfMeasure: string
  reorderPoint: number
}

/**
 * EditProductSheet — slide-over panel for editing an existing product.
 * SKU is displayed but cannot be changed (immutable ledger reference).
 * @client Required for interactive form state and mutation.
 */
export function EditProductSheet({
  product,
  trigger,
}: {
  product: EditableProduct
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(EditProductSchema),
    defaultValues: {
      name: product.name,
      category: product.category,
      unit_of_measure: product.unitOfMeasure,
      reorder_point: product.reorderPoint,
    },
  })

  const editProductMutation = useMutation({
    mutationFn: async (values: EditProductFormValues) => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as { error?: string; product?: unknown }
      if (!res.ok) throw new Error(data.error ?? "Failed to update product")
      return data
    },
    onSuccess: () => {
      toast.success("Product updated successfully.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  /**
   * Resets form values to the current product when the sheet opens.
   * Prevents stale data if the sheet was closed and product updated externally.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      reset({
        name: product.name,
        category: product.category,
        unit_of_measure: product.unitOfMeasure,
        reorder_point: product.reorderPoint,
      })
    }
    setOpen(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-row items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Pencil className="size-5" />
            </div>
            <div>
              <SheetTitle>Edit Product</SheetTitle>
              <SheetDescription>
                Update catalog details for{" "}
                <span className="font-mono font-semibold">{product.sku}</span>.
                SKU cannot be changed.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((values) => editProductMutation.mutate(values))}
          className="mt-6 flex h-[calc(100%-4rem)] flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Name *
            </Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              SKU
            </Label>
            <Input value={product.sku} disabled className="bg-muted/40 font-mono" />
            <p className="text-xs text-muted-foreground">
              SKU is immutable after creation to preserve ledger references.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Category *
              </Label>
              <Input id="edit-category" {...register("category")} />
              {errors.category ? (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-unit" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Unit *
              </Label>
              <Input id="edit-unit" {...register("unit_of_measure")} />
              {errors.unit_of_measure ? (
                <p className="text-xs text-destructive">{errors.unit_of_measure.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-reorder" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Reorder Point
            </Label>
            <Input
              id="edit-reorder"
              type="number"
              min={0}
              {...register("reorder_point", { valueAsNumber: true })}
            />
            {errors.reorder_point ? (
              <p className="text-xs text-destructive">{errors.reorder_point.message}</p>
            ) : null}
          </div>

          <div className="mt-auto flex gap-3 border-t border-border/60 pt-4">
            <Button
              type="submit"
              disabled={editProductMutation.isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              id="btn-submit-edit-product"
            >
              {editProductMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
