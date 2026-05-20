import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateSchedule, deleteSchedule } from "@/lib/controllers/schedules"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const schedule = await updateSchedule(id, body)
    return NextResponse.json({ schedule })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update schedule" },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteSchedule(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 400 }
    )
  }
}
