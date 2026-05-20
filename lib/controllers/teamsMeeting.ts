import { createOnlineMeeting } from "@/lib/services/graph"
import { appointmentRepository } from "@/lib/repositories/factory"

export async function createTeamsMeetingForAppointment(
  appointmentId: string,
  facultyId: string,
  accessToken: string
): Promise<string> {
  if (process.env.FEATURE_CREATE_TEAMS_MEETING !== "true") {
    throw new Error("Teams meeting creation is disabled")
  }

  const appointment = await appointmentRepository.findById(appointmentId) as any
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")

  const joinUrl = await createOnlineMeeting(accessToken, {
    subject: `E-Consultation: ${appointment.student?.name || "Student"} & ${appointment.faculty?.name || "Faculty"}`,
    startDateTime: `${appointment.schedule?.date}T${appointment.schedule?.startTime}:00`,
    endDateTime: `${appointment.schedule?.date}T${appointment.schedule?.endTime}:00`,
  })

  await appointmentRepository.update(appointmentId, { teamsLink: joinUrl })
  return joinUrl
}
