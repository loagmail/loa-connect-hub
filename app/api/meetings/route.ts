import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createMeeting, getMeetingsForUser } from "@/lib/controllers/meetings"
import { userRepository } from "@/lib/repositories/factory"
import { generateInviteToken } from "@/lib/services/invite-token"
import { sendMeetingInviteEmail } from "@/lib/services/email"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const meetings = await getMeetingsForUser(userId)
  return NextResponse.json({ meetings })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const body = await request.json()

  try {
    const meeting = await createMeeting({
      title: body.title,
      description: body.description,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      organizerId: userId,
      participantIds: body.participantIds || [],
    })

    // Send email invites to participants (excluding organizer)
    const origin = new URL(request.url).origin
    const organizer = (session.user as any)
    const participantIds = (body.participantIds || []).filter((id: string) => id !== userId)

    if (participantIds.length > 0 && meeting) {
      const participants = await userRepository.listByIds(participantIds)
      for (const p of participants) {
        const token = generateInviteToken(meeting.id, p.id)
        const inviteUrl = `${origin}/invites/${token}`
        await sendMeetingInviteEmail(
          p.email,
          p.name,
          meeting.title,
          organizer.name,
          meeting.date,
          meeting.startTime,
          meeting.endTime,
          inviteUrl
        )
      }
    }

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create meeting" },
      { status: 400 }
    )
  }
}
