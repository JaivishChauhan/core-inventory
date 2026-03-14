import { History, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Move History",
}

/**
 * Move History page — the immutable audit trail.
 * A dense, read-only data table of every confirmed ledger entry.
 * This is the ultimate source of truth for all stock movements.
 */
export default function MoveHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Move History</h1>
        <p className="text-sm text-muted-foreground">
          Immutable audit trail of every stock movement. The ultimate source of
          truth.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[100px]">Ref</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Mock Row 1 */}
              <TableRow>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  Today, 09:41
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  REC-1042
                </TableCell>
                <TableCell className="font-medium">
                  Industrial Widget Alpha
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Supplier</span>
                    <ArrowRight className="size-3" />
                    <span>Main Warehouse</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                  +500
                </TableCell>
                <TableCell className="text-right text-xs">J. Doe</TableCell>
              </TableRow>

              {/* Mock Row 2 */}
              <TableRow>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  Today, 08:15
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  DEL-2099
                </TableCell>
                <TableCell className="font-medium">Thermal Sensor V2</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Main Warehouse</span>
                    <ArrowRight className="size-3" />
                    <span>Customer X</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                  -120
                </TableCell>
                <TableCell className="text-right text-xs">A. Smith</TableCell>
              </TableRow>

              {/* Mock Row 3 */}
              <TableRow>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  Yesterday
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  TRF-0041
                </TableCell>
                <TableCell className="font-medium">
                  Titanium Bearings 8mm
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Main Warehouse</span>
                    <ArrowRight className="size-3" />
                    <span>Zone B</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">0</TableCell>
                <TableCell className="text-right text-xs">System</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
