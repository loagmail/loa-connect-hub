import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { appointmentRepository } from "@/lib/repositories/factory"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const timeSlots = await appointmentRepository.listTimeSlots(id)
    return NextResponse.json({ timeSlots })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch timeslots" },
      { status: 404 }
    )
  }
}
