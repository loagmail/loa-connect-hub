import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncPendingAppointments } from "@/lib/services/teamsSync"

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const result = await syncPendingAppointments()
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}
