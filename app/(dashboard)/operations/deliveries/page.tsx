import type { Metadata } from "next"

import { MoveWorkspace } from "@/components/operations/move-workspace"

export const metadata: Metadata = {
  title: "Deliveries | Core Inventory",
}

export default function DeliveriesPage() {
  return <MoveWorkspace moveType="delivery" />
}
