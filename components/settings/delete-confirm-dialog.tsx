"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type EntityType = "warehouse" | "location"

/**
 * DeleteConfirmDialog — reusable confirmation dialog for settings entities.
 * Handles both warehouse and location deletion with appropriate warnings.
 * @client Required for dialog state and mutation.
 */
export function DeleteConfirmDialog({
  entityType,
  entityId,
  entityName,
  trigger,
}: {
  entityType: EntityType
  entityId: string
  entityName: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const endpoint =
    entityType === "warehouse"
      ? `/api/warehouses/${entityId}`
      : `/api/locations/${entityId}`

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(endpoint, { method: "DELETE" })
      const data = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) throw new Error(data.error ?? `Failed to delete ${entityType}`)
      return data
    },
    onSuccess: () => {
      toast.success(`${entityType === "warehouse" ? "Warehouse" : "Location"} "${entityName}" deleted.`)
      queryClient.invalidateQueries({ queryKey: ["inventory-reference-data"] })
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle>
                Delete {entityType === "warehouse" ? "Warehouse" : "Location"}
              </DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{entityName}</span>?
          </p>
          <p className="text-xs text-muted-foreground/80">
            {entityType === "warehouse"
              ? "Warehouses with locations that have stock moves cannot be deleted. All child locations will also be removed."
              : "Locations with stock moves cannot be deleted. Remove associated moves first."}
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting
              </>
            ) : (
              `Delete ${entityType === "warehouse" ? "Warehouse" : "Location"}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
