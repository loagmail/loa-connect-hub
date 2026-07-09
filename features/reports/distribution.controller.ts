import { reportsRepository, departmentRepository } from "@/lib/repositories/factory"
import type { WorkloadDistributionEntry } from "@/lib/types"
import type { DistributionReportResult } from "./distribution.service"

export async function getWorkloadDistributionData(
  departmentId: string | null,
  filters?: { startDate?: string; endDate?: string; status?: string }
): Promise<DistributionReportResult> {
  if (departmentId) {
    const data = await reportsRepository.getWorkloadDistribution(departmentId, filters)
    return {
      ...data,
      totalConsultations: data.departmentTotal,
      completedConsultations: data.entries.reduce((s, e) => s + e.completed, 0),
      pendingConsultations: data.entries.reduce((s, e) => s + e.pending, 0),
    }
  }

  const departments = await departmentRepository.listAll()

  const distResults = await Promise.all(
    departments.map((dept) => reportsRepository.getWorkloadDistribution(dept.id, filters))
  )

  const allEntries: WorkloadDistributionEntry[] = distResults.flatMap((r) => r.entries)
  const overallTotal = distResults.reduce((s, r) => s + r.departmentTotal, 0)
  const overallCompleted = distResults.reduce((s, r) => s + r.entries.reduce((s2, e) => s2 + e.completed, 0), 0)
  const overallPending = distResults.reduce((s, r) => s + r.entries.reduce((s2, e) => s2 + e.pending, 0), 0)

  const recalculated = allEntries.map((e) => ({
    ...e,
    departmentShare: overallTotal > 0 ? Math.round((e.total / overallTotal) * 100) : 0,
  }))

  return {
    entries: recalculated,
    departmentTotal: overallTotal,
    departmentName: "All Departments",
    totalConsultations: overallTotal,
    completedConsultations: overallCompleted,
    pendingConsultations: overallPending,
  }
}
