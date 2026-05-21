import { meetingRepository } from "@/lib/repositories/factory"
import { getCalendarView } from "@/lib/services/graph"
import { prisma } from "@/lib/prisma"
import type { AppointmentData, MeetingData } from "@/lib/repositories/interfaces"

export interface Conflict {
  type: "appointment" | "meeting" | "teams"
  userId: string
  userName: string
  date: string
  startTime: string
  endTime: string
  title: string
}

export async function checkConflicts(
  facultyIds: string[],
  date: string,
  startTime: string,
  endTime: string
): Promise<Conflict[]> {
  const conflicts: Conflict[] = []

  for (const userId of facultyIds) {
    // Check existing appointments (PENDING or APPROVED) on the same date/time
    const appointments = await meetingRepository.listConflictingAppointments(userId, date, startTime, endTime)
    for (const apt of appointments as any[]) {
      conflicts.push({
        type: "appointment",
        userId,
        userName: apt.student?.name || apt.faculty?.name || "Unknown",
        date,
        startTime: apt.startTime || startTime,
        endTime: apt.endTime || endTime,
        title: `Appointment with ${apt.student?.name || apt.faculty?.name || "Unknown"}`,
      })
    }

    // Check existing internal meetings (CONFIRMED)
    const meetings = await meetingRepository.listConflictingMeetings(userId, date, startTime, endTime)
    for (const mtg of meetings as any[]) {
      conflicts.push({
        type: "meeting",
        userId,
        userName: mtg.organizer?.name || "Unknown",
        date,
        startTime: mtg.startTime,
        endTime: mtg.endTime,
        title: mtg.title,
      })
    }

    // Check Teams calendar if faculty has a Microsoft token (best-effort)
    if (process.env.FEATURE_CREATE_TEAMS_MEETING === "true") {
      try {
        const account = await prisma.account.findFirst({
          where: { userId, provider: "azure-ad" },
        })

        if (account?.access_token) {
          const startDateTime = `${date}T${startTime}:00`
          const endDateTime = `${date}T${endTime}:00`

          const events = await getCalendarView(account.access_token, startDateTime, endDateTime)
          for (const event of events) {
            const eventStart = event.start?.dateTime || ""
            const eventEnd = event.end?.dateTime || ""
            // Extract time portion from ISO datetime
            const eventStartTime = eventStart.includes("T") ? eventStart.split("T")[1].substring(0, 5) : startTime
            const eventEndTime = eventEnd.includes("T") ? eventEnd.split("T")[1].substring(0, 5) : endTime

            conflicts.push({
              type: "teams",
              userId,
              userName: "Teams Calendar",
              date,
              startTime: eventStartTime,
              endTime: eventEndTime,
              title: event.subject || "Teams Calendar Event",
            })
          }
        }
      } catch (error) {
        // Best-effort: if Teams calendar check fails, just skip it
        console.warn(`Failed to check Teams calendar for user ${userId}:`, error)
      }
    }
  }

  return conflicts
}
