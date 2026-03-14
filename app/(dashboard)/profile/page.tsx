import { Mail, ShieldCheck, Warehouse } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getServerSession } from "@/lib/auth/session"
import { getInventoryReferenceData } from "@/lib/db/queries/inventory"

export const metadata: Metadata = {
  title: "My Profile | Core Inventory",
}

export default async function ProfilePage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  const referenceData = await getInventoryReferenceData()
  const activeWarehouse = referenceData.warehouses.find(
    (warehouse) => warehouse.id === session.warehouseId
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="text-gradient">My Profile</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Session identity and warehouse context for the current user.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">{session.name}</CardTitle>
            <CardDescription>{session.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm">{session.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <Badge variant="secondary" className="capitalize">
                {session.role}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Warehouse className="size-4 text-muted-foreground" />
              <span className="text-sm">
                {activeWarehouse?.name ?? "No active warehouse selected"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Access Context</CardTitle>
            <CardDescription>
              This session is authorized for inventory reads and ledger operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Ledger entries remain immutable after validation, so operational changes
              always create new stock moves instead of editing history.
            </p>
            <p>
              Warehouse-level configuration remains available from Settings, while your
              personal session identity lives here in the profile menu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
