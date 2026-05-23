import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getMeetingById } from "@/lib/controllers/meetings"
import { userRepository } from "@/lib/repositories/factory"
import { generateInviteToken } from "@/lib/services/invite-token"
import { sendMeetingInviteWithICS } from "@/lib/services/email"
import { generateICal } from "@/lib/services/ical"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = await params

  try {
    const meeting = await getMeetingById(id)

    if (meeting.organizerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const participants = (meeting.participants || []).filter((participant: any) => participant.userId !== userId)
    if (participants.length === 0) {
      return NextResponse.json({ message: "No participants to resend." }, { status: 200 })
    }

    const organizerName = meeting.organizer?.name || "Organizer"
    const organizerEmail = meeting.organizer?.email || ""
    const participantNames = participants.map((participant: any) => participant.user?.name || "")

    const allParticipants = [
      { name: organizerName, email: organizerEmail },
      ...participants.map((participant: any) => ({
        name: participant.user?.name || "",
        email: participant.user?.email || "",
      })),
    ]

    const icalString = generateICal({
      uid: `meet-${meeting.id}@e-consultation`,
      summary: `Consultation: ${meeting.title}`,
      description: [
        "Consultation",
        `— ${meeting.title}`,
        `Organized by: ${organizerName}`,
        `Participants: ${participantNames.join(", ")}`,
        meeting.description || "",
      ]
        .filter(Boolean)
        .join("\n"),
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: "Microsoft Teams",
      organizer: { name: organizerName, email: organizerEmail },
      attendees: allParticipants,
    })

    const origin = new URL(request.url).origin

    for (const participant of participants) {
      const p = participant.user
      if (!p?.email || !p?.name) continue

      const token = generateInviteToken(meeting.id, participant.userId)
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

    return NextResponse.json({ message: "Invites resent successfully." })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend invites" },
      { status: 400 }
    )
  }
}
