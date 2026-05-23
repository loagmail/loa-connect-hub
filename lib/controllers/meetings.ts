import { appointmentRepository, meetingRepository, userRepository } from "@/lib/repositories/factory"
import { checkConflicts } from "@/lib/services/conflictDetection"

export async function createMeeting(data: {
  title: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  timeSlots?: { date: string; startTime: string; endTime: string }[]
  organizerId: string
  participantIds: string[]
}) {
  const allUsers = await userRepository.listByIds([data.organizerId, ...data.participantIds])
  const organizer = allUsers.find((u) => u.id === data.organizerId)
  if (!organizer) throw new Error("Organizer not found")

  const invitedUsers = allUsers.filter((u) => u.id !== data.organizerId)
  const studentParticipant = invitedUsers.find((u) => u.role === "STUDENT") ?? (organizer.role === "STUDENT" ? organizer : undefined)
  const facultyParticipant = invitedUsers.find((u) => u.role !== "STUDENT") ?? (organizer.role !== "STUDENT" ? organizer : undefined)

  const studentId = studentParticipant?.id ?? organizer.id
  const facultyId = facultyParticipant?.id ?? organizer.id
  const meetingType = invitedUsers.some((u) => u.role === "STUDENT" || organizer.role === "STUDENT") ? "CONSULTATION" : "INTERNAL"

  const firstSlot = (data.timeSlots?.[0] || {
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
  }) as { date: string | undefined; startTime: string | undefined; endTime: string | undefined }

  if (!firstSlot.date || !firstSlot.startTime || !firstSlot.endTime) {
    throw new Error("At least one timeslot (date, startTime, endTime) is required")
  }

  const appointment = await appointmentRepository.create({
    studentId,
    facultyId,
    createdByEmail: organizer.email,
    meetingType,
    date: firstSlot.date!,
    startTime: firstSlot.startTime!,
    endTime: firstSlot.endTime!,
    title: data.title,
    description: data.description ?? null,
  })

  const slots = data.timeSlots?.length
    ? data.timeSlots
    : [{ date: firstSlot.date, startTime: firstSlot.startTime, endTime: firstSlot.endTime }]

  for (const slot of slots) {
    await appointmentRepository.addTimeSlot(appointment.id, slot.date, slot.startTime, slot.endTime)
  }

  await meetingRepository.addParticipant(appointment.id, data.organizerId)
  await meetingRepository.updateParticipantStatus(appointment.id, data.organizerId, "ACCEPTED")

  for (const pid of data.participantIds) {
    if (pid !== data.organizerId) {
      await meetingRepository.addParticipant(appointment.id, pid)
    }
  }

  return meetingRepository.findById(appointment.id)
}

export async function getMeetingsForUser(userId: string) {
  const [organized, invited] = await Promise.all([
    meetingRepository.listByOrganizer(userId),
    meetingRepository.listByParticipant(userId),
  ])

  // Deduplicate by id
  const seen = new Set<string>()
  const all = [...organized, ...invited].filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  return all
}

export async function getMeetingById(id: string) {
  const meeting = await meetingRepository.findById(id)
  if (!meeting) throw new Error("Meeting not found")
  return meeting
}

export async function respondToMeeting(meetingId: string, userId: string, status: "ACCEPTED" | "DECLINED") {
  return meetingRepository.updateParticipantStatus(meetingId, userId, status)
}

export async function cancelMeeting(id: string, userId: string) {
  const meeting = await meetingRepository.findById(id)
  if (!meeting) throw new Error("Meeting not found")
  if (meeting.organizerId !== userId) throw new Error("Only the organizer can cancel the meeting")

  return meetingRepository.update(id, { status: "CANCELLED" })
}

export async function getConflicts(
  facultyIds: string[],
  date: string,
  startTime: string,
  endTime: string
) {
  return checkConflicts(facultyIds, date, startTime, endTime)
}
