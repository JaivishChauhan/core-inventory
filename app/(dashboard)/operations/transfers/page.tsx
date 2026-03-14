import type { Metadata } from "next"

import { MoveWorkspace } from "@/components/operations/move-workspace"

export const metadata: Metadata = {
  title: "Internal Transfers | Core Inventory",
}

export default function TransfersPage() {
  return <MoveWorkspace moveType="internal_transfer" />
}
