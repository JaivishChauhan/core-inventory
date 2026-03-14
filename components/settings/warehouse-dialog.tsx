"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Warehouse } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const WarehouseFormSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  code: z.string().min(1, "Warehouse code is required"),
  address: z.string().optional(),
})

type WarehouseFormValues = z.infer<typeof WarehouseFormSchema>

type WarehouseData = {
  id: string
  name: string
  code: string
  address: string | null
} | null

/**
 * WarehouseDialog — create or edit a warehouse.
 * When `warehouse` is null, operates in create mode.
 * @client Required for form state and mutations.
 */
export function WarehouseDialog({
  warehouse,
  trigger,
}: {
  warehouse?: WarehouseData
  trigger: React.ReactNode
}) {
  const isEditMode = Boolean(warehouse?.id)
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(WarehouseFormSchema),
    defaultValues: {
      name: warehouse?.name ?? "",
      code: warehouse?.code ?? "",
      address: warehouse?.address ?? "",
    },
  })

  const warehouseMutation = useMutation({
    mutationFn: async (values: WarehouseFormValues) => {
      const url = isEditMode
        ? `/api/warehouses/${warehouse!.id}`
        : "/api/warehouses"
      const method = isEditMode ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as { error?: string; warehouse?: unknown }
      if (!res.ok) throw new Error(data.error ?? "Operation failed")
      return data
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "Warehouse updated." : "Warehouse created."
      )
      queryClient.invalidateQueries({ queryKey: ["inventory-reference-data"] })
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      reset({
        name: warehouse?.name ?? "",
        code: warehouse?.code ?? "",
        address: warehouse?.address ?? "",
      })
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Warehouse className="size-5" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Warehouse" : "Create Warehouse"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update warehouse details."
                  : "Add a new physical warehouse location."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => warehouseMutation.mutate(values))}
          className="mt-4 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="wh-name" className="text-sm font-semibold">
              Name *
            </Label>
            <Input id="wh-name" placeholder="Main Warehouse" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-code" className="text-sm font-semibold">
              Code *
            </Label>
            <Input
              id="wh-code"
              placeholder="WH-MAIN"
              className="font-mono uppercase"
              {...register("code")}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier. Auto-uppercased.
            </p>
            {errors.code ? (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-address" className="text-sm font-semibold">
              Address
            </Label>
            <Input id="wh-address" placeholder="123 Industrial Ave" {...register("address")} />
          </div>

          <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={warehouseMutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
            >
              {warehouseMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Warehouse"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
