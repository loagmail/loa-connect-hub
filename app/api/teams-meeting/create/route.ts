import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTeamsMeetingForAppointment } from "@/lib/controllers/teamsMeeting"

export async function POST(request: Request) {
  if (process.env.FEATURE_CREATE_TEAMS_MEETING !== "true") {
    return NextResponse.json({ error: "Teams meeting creation is disabled" }, { status: 404 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const facultyId = (session.user as any).id
  const accessToken = (session as any).accessToken

  if (!accessToken) {
    return NextResponse.json(
      { error: "Microsoft account not linked. Sign in with Microsoft to create Teams meetings." },
      { status: 400 }
    )
  }

  try {
    const { appointmentId } = await request.json()
    const joinUrl = await createTeamsMeetingForAppointment(appointmentId, facultyId, accessToken)
    return NextResponse.json({ joinUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
}
