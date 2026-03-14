import { Settings, MapPin, Building2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
}

/**
 * Settings page — warehouse and location management.
 * Multi-warehouse support with granular location hierarchy
 * (zones, aisles, racks) nested within warehouses.
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure warehouses, locations, and system preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Warehouses</CardTitle>
            </div>
            <CardDescription>
              Manage multiple warehouse entities and their configurations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <Badge variant="outline" className="text-xs">
                Phase 3 — Local DB Integration
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Locations</CardTitle>
            </div>
            <CardDescription>
              Define zones, aisles, and racks within each warehouse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <Badge variant="outline" className="text-xs">
                Phase 3 — Local DB Integration
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
