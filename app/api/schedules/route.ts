import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createSchedule, listAvailableSchedules } from "@/lib/controllers/schedules"

export async function GET() {
  try {
    const schedules = await listAvailableSchedules()
    return NextResponse.json({ schedules })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const schedule = await createSchedule({
      facultyId: (session.user as any).id,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    })
    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create schedule" },
      { status: 400 }
    )
  }
}
