"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, MapPin } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const LocationFormSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  type: z.enum(["internal", "vendor", "customer", "loss"]),
})

type LocationFormValues = z.infer<typeof LocationFormSchema>

type LocationData = {
  id: string
  name: string
  type: string
} | null

/**
 * LocationDialog — create or edit a warehouse location.
 * When `location` is null, operates in create mode and requires `warehouseId`.
 * @client Required for form state and mutations.
 */
export function LocationDialog({
  warehouseId,
  warehouseName,
  location,
  trigger,
}: {
  warehouseId: string
  warehouseName: string
  location?: LocationData
  trigger: React.ReactNode
}) {
  const isEditMode = Boolean(location?.id)
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(LocationFormSchema),
    defaultValues: {
      name: location?.name ?? "",
      type: (location?.type as LocationFormValues["type"]) ?? "internal",
    },
  })

  const currentType = watch("type")

  const locationMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const url = isEditMode
        ? `/api/locations/${location!.id}`
        : "/api/locations"
      const method = isEditMode ? "PUT" : "POST"

      const body = isEditMode
        ? values
        : { ...values, warehouse_id: warehouseId }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = (await res.json()) as { error?: string; location?: unknown }
      if (!res.ok) throw new Error(data.error ?? "Operation failed")
      return data
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "Location updated." : "Location created."
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
        name: location?.name ?? "",
        type: (location?.type as LocationFormValues["type"]) ?? "internal",
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
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <MapPin className="size-5" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Location" : "Add Location"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? `Update location in ${warehouseName}.`
                  : `Add a new location to ${warehouseName}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => locationMutation.mutate(values))}
          className="mt-4 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="loc-name" className="text-sm font-semibold">
              Name *
            </Label>
            <Input id="loc-name" placeholder="Zone A - Shelf 1" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Type *</Label>
            <Select
              value={currentType}
              onValueChange={(value: LocationFormValues["type"]) => setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={locationMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
            >
              {locationMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Location"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
