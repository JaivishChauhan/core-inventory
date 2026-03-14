import { Plus, PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Receipts | Core Inventory",
}

export default function ReceiptsPage() {
  // Mock data representing the ledger format
  const mockReceipts = [
    {
      id: "REC-1001",
      supplier: "Global Steel Inc.",
      status: "done",
      date: "2026-03-14",
      items: 4,
    },
    {
      id: "REC-1002",
      supplier: "Lumber & Co.",
      status: "waiting",
      date: "2026-03-14",
      items: 2,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">Receipts </span>
            <span className="text-muted-foreground text-xl">(Incoming Goods)</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage incoming inventory from vendors.
          </p>
        </div>

        {/* Action Button & Slide Over */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="group bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all rounded-full">
              <Plus className="mr-2 size-4" />
              New Receipt
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xl">
            <SheetHeader>
              <div className="flex flex-row items-center gap-3">
                <div className="rounded-xl p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <PackagePlus className="size-5" />
                </div>
                <div>
                  <SheetTitle>Create Receipt</SheetTitle>
                  <SheetDescription>
                    Process incoming vendor stock. Validation adjusts ledger immediately.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            {/* Form Placeholder */}
            <div className="py-6 flex flex-col gap-4">
              <div className="h-32 rounded-lg border border-dashed border-border/50 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-sm text-muted-foreground">
                Slide-over form integrated via Server Actions & PG
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border/50 bg-white dark:bg-slate-950 shadow-soft overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Reference</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Supplier/Source</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Total Items</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReceipts.map((receipt) => (
              <TableRow key={receipt.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <TableCell className="font-mono font-medium">{receipt.id}</TableCell>
                <TableCell>{receipt.supplier}</TableCell>
                <TableCell>{receipt.items} SKUs</TableCell>
                <TableCell>
                  <Badge
                    variant={receipt.status === "done" ? "success" : "secondary"}
                    className={
                      receipt.status === "done"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200"
                    }
                  >
                    {receipt.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{receipt.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
