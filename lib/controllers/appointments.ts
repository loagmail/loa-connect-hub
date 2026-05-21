import { appointmentRepository, scheduleRepository } from "@/lib/repositories/factory"

export async function requestAppointment(input: {
  studentId: string
  scheduleId: string
}) {
  const schedule = await scheduleRepository.findById(input.scheduleId)
  if (!schedule) throw new Error("Schedule not found")
  if (!schedule.isAvailable) throw new Error("Schedule is not available")

  const existingAppts = await appointmentRepository.listByStudent(input.studentId)
  const conflicting = existingAppts.find(
    (a) => a.scheduleId === input.scheduleId && a.status !== "REJECTED"
  )
  if (conflicting) throw new Error("You already have an appointment for this schedule")

  const appointment = await appointmentRepository.create({
    studentId: input.studentId,
    facultyId: schedule.facultyId,
    scheduleId: input.scheduleId,
  })

  await scheduleRepository.update(input.scheduleId, { isAvailable: false })

  return appointment
}

export async function approveAppointment(id: string, facultyId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")
  if (appointment.status !== "PENDING") throw new Error("Appointment is not pending")

  // Set status + mark for Teams sync (orchestrator picks up UNWRITTEN records)
  return appointmentRepository.update(id, { status: "APPROVED", teamsSyncStatus: "UNWRITTEN" })
}

export async function rejectAppointment(id: string, facultyId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")
  if (appointment.status !== "PENDING") throw new Error("Appointment is not pending")

  await scheduleRepository.update(appointment.scheduleId, { isAvailable: true })

  return appointmentRepository.update(id, { status: "REJECTED" })
}

export async function completeAppointment(id: string, facultyId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")
  if (appointment.status !== "APPROVED") throw new Error("Appointment is not approved")

  return appointmentRepository.update(id, { status: "COMPLETED" })
}

export async function cancelAppointment(id: string, facultyId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")
  if (appointment.status !== "APPROVED") throw new Error("Only approved appointments can be cancelled")

  // If synced to Teams, attempt cleanup (best-effort, does not block cancellation)
  if (appointment.teamsSyncStatus === "WRITTEN") {
    // TODO: Phase 7 — attempt Teams meeting deletion
    // If deletion fails, log error but proceed with cancellation
  }

  // Restore the schedule slot so others can book it
  await scheduleRepository.update(appointment.scheduleId, { isAvailable: true })

  return appointmentRepository.update(id, { status: "CANCELLED" })
}

export async function studentCancelAppointment(id: string, studentId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.studentId !== studentId) throw new Error("Unauthorized")
  if (appointment.status !== "PENDING") throw new Error("Only pending appointments can be cancelled")

  // Restore the schedule slot so others can book it
  await scheduleRepository.update(appointment.scheduleId, { isAvailable: true })

  return appointmentRepository.update(id, { status: "CANCELLED" })
}

export async function updateTeamsLink(id: string, facultyId: string, teamsLink: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")

  return appointmentRepository.update(id, { teamsLink })
}

export async function retryTeamsSync(id: string, facultyId: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.facultyId !== facultyId) throw new Error("Unauthorized")
  if (appointment.status !== "APPROVED") throw new Error("Only approved appointments can be synced")

  return appointmentRepository.update(id, { teamsSyncStatus: "UNWRITTEN", teamsSyncRetries: 0, teamsSyncError: null, teamsSyncLastAttempt: null })
}

export async function listStudentAppointments(studentId: string) {
  return appointmentRepository.listByStudent(studentId)
}

export async function listFacultyAppointments(facultyId: string) {
  return appointmentRepository.listByFaculty(facultyId)
}

export async function getAllAppointments() {
  return appointmentRepository.listAll()
}

export async function getAppointmentById(id: string) {
  const appointment = await appointmentRepository.findById(id)
  if (!appointment) throw new Error("Appointment not found")
  return appointment
}
