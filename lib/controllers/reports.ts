import { departmentRepository, reportsRepository } from "@/lib/repositories/factory"
import type { FacultyStatsData, RawAppointmentData } from "@/lib/repositories/interfaces"

export interface DeanDepartmentStatsResult {
  departmentName: string
  departmentId: string
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
}

export async function getDeanDepartmentStats(
  deanId: string,
  filters?: { startDate?: string; endDate?: string; status?: string }
): Promise<DeanDepartmentStatsResult> {
  const department = await departmentRepository.findByDeanId(deanId)
  if (!department) {
    throw new Error(
      "Your account is not assigned to any department. " +
      "Ask an admin to create a department record with your user ID as deanId " +
      "in the departments table."
    )
  }

  const [stats, rawAppointments] = await Promise.all([
    reportsRepository.getDepartmentConsultationStats(department.id, filters),
    reportsRepository.getDepartmentConsultationAppointments(department.id, filters),
  ])

  return {
    departmentName: department.name,
    departmentId: department.id,
    stats,
    rawAppointments,
  }
}
