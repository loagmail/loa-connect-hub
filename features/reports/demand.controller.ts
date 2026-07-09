import { reportsRepository, departmentRepository } from "@/lib/repositories/factory"
import type { DailyFrequencyData, WeeklyFrequencyData, DepartmentFrequencyEntry } from "@/lib/types"
import { mergeDaily, mergeWeekly, mergeMonthly } from "./demand.service"
import type { DemandReportResult } from "./demand.service"

export async function getDemandReportData(
  departmentId: string | null,
  filters?: { startDate?: string; endDate?: string; status?: string }
): Promise<DemandReportResult> {
  if (departmentId) {
    const dept = await departmentRepository.findById(departmentId)
    const deptName = dept?.name || "Unknown Department"

    const [daily, weekly, monthly] = await Promise.all([
      reportsRepository.getDepartmentDailyFrequency(departmentId, filters),
      reportsRepository.getDepartmentWeeklyFrequency(departmentId, filters),
      reportsRepository.getDepartmentFrequency(departmentId, filters),
    ])

    return { daily, weekly, monthly, departmentName: deptName }
  }

  const departments = await departmentRepository.listAll()

  const demandResults = await Promise.all(
    departments.map((dept) =>
      Promise.all([
        reportsRepository.getDepartmentDailyFrequency(dept.id, filters),
        reportsRepository.getDepartmentWeeklyFrequency(dept.id, filters),
        reportsRepository.getDepartmentFrequency(dept.id, filters),
      ])
    )
  )

  const allDaily = demandResults.map((r) => r[0])
  const allWeekly = demandResults.map((r) => r[1])
  const allMonthly = demandResults.map((r) => r[2])

  const daily = mergeDaily(allDaily)
  const weekly = mergeWeekly(allWeekly)
  const monthly = mergeMonthly(allMonthly)

  return { daily, weekly, monthly, departmentName: "All Departments" }
}
