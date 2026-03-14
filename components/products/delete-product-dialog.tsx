"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
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

/**
 * DeleteProductDialog — confirmation dialog for product deletion.
 * Shows a warning that deletion is blocked if the product has stock moves.
 * @client Required for dialog state and mutation.
 */
export function DeleteProductDialog({
  productId,
  productName,
  sku,
  trigger,
}: {
  productId: string
  productName: string
  sku: string
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      const data = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) throw new Error(data.error ?? "Failed to delete product")
      return data
    },
    onSuccess: () => {
      toast.success(`Product "${productName}" deleted.`)
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{productName}</span>{" "}
            <span className="font-mono text-xs">({sku})</span>?
          </p>
          <p className="text-xs text-muted-foreground/80">
            Products with existing stock moves cannot be deleted. If deletion
            fails, the product has ledger history and should be archived instead.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteProductMutation.isPending}
            onClick={() => deleteProductMutation.mutate()}
            id="btn-confirm-delete-product"
          >
            {deleteProductMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete Product"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
