import { scheduleRepository } from "@/lib/repositories/factory"

export async function createSchedule(input: {
  facultyId: string
  date: string
  startTime: string
  endTime: string
}) {
  const schedule = await scheduleRepository.create(input)
  return schedule
}

export async function listAvailableSchedules() {
  return scheduleRepository.listAvailable()
}

export async function listFacultySchedules(facultyId: string) {
  return scheduleRepository.listByFaculty(facultyId)
}

export async function updateSchedule(id: string, data: { date?: string; startTime?: string; endTime?: string; isAvailable?: boolean }) {
  return scheduleRepository.update(id, data)
}

export async function deleteSchedule(id: string) {
  await scheduleRepository.delete(id)
}
