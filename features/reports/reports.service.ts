import { departmentRepository, reportsRepository } from "@/lib/repositories/factory"
import type { FacultyStatsData, RawAppointmentData, ConsultationSummaryData, DepartmentFrequencyEntry, FacultyFrequencyData, DepartmentYearlyEntry, FacultyYearlyData } from "@/lib/types"

export interface DeanDepartmentStatsResult {
  departmentName: string
  departmentId: string
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
  summaries: ConsultationSummaryData[]
  departmentFrequency: DepartmentFrequencyEntry[]
  facultyFrequency: FacultyFrequencyData[]
  departmentYearlyFrequency: DepartmentYearlyEntry[]
  facultyYearlyFrequency: FacultyYearlyData[]
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

  const [stats, rawAppointments, summaries, departmentFrequency, facultyFrequency, departmentYearlyFrequency, facultyYearlyFrequency] = await Promise.all([
    reportsRepository.getDepartmentConsultationStats(department.id, filters),
    reportsRepository.getDepartmentConsultationAppointments(department.id, filters),
    reportsRepository.getConsultationSummaries(department.id, filters),
    reportsRepository.getDepartmentFrequency(department.id, filters),
    reportsRepository.getFacultyFrequency(department.id, filters),
    reportsRepository.getDepartmentYearlyFrequency(department.id, filters),
    reportsRepository.getFacultyYearlyFrequency(department.id, filters),
  ])

  return {
    departmentName: department.name,
    departmentId: department.id,
    stats,
    rawAppointments,
    summaries,
    departmentFrequency,
    facultyFrequency,
    departmentYearlyFrequency,
    facultyYearlyFrequency,
  }
}
