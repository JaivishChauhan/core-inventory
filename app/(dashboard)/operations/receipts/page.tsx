import type { Metadata } from "next"

import { MoveWorkspace } from "@/components/operations/move-workspace"

export const metadata: Metadata = {
  title: "Receipts | Core Inventory",
}

export default function ReceiptsPage() {
  return <MoveWorkspace moveType="receipt" />
}
