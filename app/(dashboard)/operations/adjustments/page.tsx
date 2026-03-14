import type { Metadata } from "next"

import { AdjustmentWorkspace } from "@/components/operations/adjustment-workspace"

export const metadata: Metadata = {
  title: "Inventory Adjustments | Core Inventory",
}

export default function AdjustmentsPage() {
  return <AdjustmentWorkspace />
}
