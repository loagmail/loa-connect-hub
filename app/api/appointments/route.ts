import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requestAppointment, listStudentAppointments, listFacultyAppointments } from "@/lib/controllers/appointments"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const role = (session.user as any).role
    const userId = (session.user as any).id
    const appointments = role === "FACULTY"
      ? await listFacultyAppointments(userId)
      : await listStudentAppointments(userId)
    return NextResponse.json({ appointments })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
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
    const appointment = await requestAppointment({
      studentId: (session.user as any).id,
      scheduleId: body.scheduleId,
    })
    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create appointment" },
      { status: 400 }
    )
  }
}
