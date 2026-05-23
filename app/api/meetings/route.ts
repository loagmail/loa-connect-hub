import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createMeeting, getMeetingsForUser } from "@/lib/controllers/meetings"
import { userRepository } from "@/lib/repositories/factory"
import { generateInviteToken } from "@/lib/services/invite-token"
import { sendMeetingInviteWithICS } from "@/lib/services/email"
import { generateICal } from "@/lib/services/ical"

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
      timeSlots: body.timeSlots,
      organizerId: userId,
      participantIds: body.participantIds || [],
    })

    // Send email invites with .ics attachment to participants (excluding organizer)
    const origin = new URL(request.url).origin
    const organizer = (session.user as any)
    const participantIds = (body.participantIds || []).filter((id: string) => id !== userId)

    if (participantIds.length > 0 && meeting) {
      // Resolve participant names for the .ics description
      const allParticipants = await userRepository.listByIds([
        userId,
        ...participantIds,
      ])
      const participantNames = allParticipants
        .filter((u) => u.id !== userId)
        .map((u) => u.name)
      const organizerName = allParticipants.find((u) => u.id === userId)?.name || organizer.name

      // Build .ics once (same event shared to all)
      const icalString = generateICal({
        uid: `meet-${meeting.id}@e-consultation`,
        summary: `Consultation: ${meeting.title}`,
        description: [
          "Consultation",
          `— ${meeting.title}`,
          `Organized by: ${organizerName}`,
          `Participants: ${participantNames.join(", ")}`,
          meeting.description || "",
        ].filter(Boolean).join("\n"),
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: "Microsoft Teams",
        organizer: { name: organizerName, email: organizer.email },
        attendees: allParticipants.map((u) => ({
          name: u.name,
          email: u.email,
        })),
      })

      const participants = allParticipants.filter((u) => u.id !== userId)
      for (const p of participants) {
        const token = generateInviteToken(meeting.id, p.id)
        const inviteUrl = `${origin}/invites/${token}`
        await sendMeetingInviteWithICS(
          { email: p.email, name: p.name },
          {
            organizerName,
            title: meeting.title,
            description: meeting.description,
            date: meeting.date,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            participantNames,
            viewUrl: inviteUrl,
          },
          icalString,
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
