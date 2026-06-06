"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type {
  DepartmentSummary,
  FacultyStatsData,
  RawAppointmentData,
  ConsultationSummaryData,
} from "@/lib/types"
import { DeanReportsTabs } from "@/features/reports/components/reports/DeanReportsTabs"

interface AdminReportsPageProps {
  departments: DepartmentSummary[]
  selectedDepartmentId: string | null
  departmentName: string
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
  summaries: ConsultationSummaryData[]
}

export function AdminReportsPage({
  departments,
  selectedDepartmentId,
  departmentName,
  stats,
  rawAppointments,
  summaries,
}: AdminReportsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const allDeptsRow = useMemo((): DepartmentSummary => {
    const total = departments.reduce((s, d) => s + d.total, 0)
    const completed = departments.reduce((s, d) => s + d.completed, 0)
    return {
      id: "",
      name: "All Departments",
      facultyCount: departments.reduce((s, d) => s + d.facultyCount, 0),
      total,
      completed,
      pending: departments.reduce((s, d) => s + d.pending, 0),
      approved: departments.reduce((s, d) => s + d.approved, 0),
      rejected: departments.reduce((s, d) => s + d.rejected, 0),
      cancelled: departments.reduce((s, d) => s + d.cancelled, 0),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      inactiveFaculty: departments.reduce((s, d) => s + d.inactiveFaculty, 0),
      unresponded: departments.reduce((s, d) => s + d.unresponded, 0),
      overdueCompletion: departments.reduce((s, d) => s + d.overdueCompletion, 0),
    }
  }, [departments])

  const navigate = useCallback(
    (deptId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (deptId) {
        params.set("departmentId", deptId)
      } else {
        params.delete("departmentId")
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  if (departments.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Department Reports</h1>
        </div>
        <div className="rounded-2xl border border-default/70 bg-surface p-8 shadow-sm text-center">
          <p className="text-tertiary text-sm">No departments found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Department Reports</h1>
        <p className="text-sm text-tertiary mt-1">
          {selectedDepartmentId ? departmentName : "All Departments"}
        </p>
      </div>

      {/* Department Summary Table */}
      <div className="rounded-2xl border border-default/70 bg-surface shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-default">
          <h3 className="text-sm font-bold text-primary">Department Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default bg-surface/50">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Department
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Faculty Count
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Total
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Completed
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Pending
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* All Departments Row */}
              <tr
                onClick={() => navigate(null)}
                className={`transition-colors duration-150 hover:bg-surface-hover cursor-pointer bg-surface/30 ${
                  selectedDepartmentId === null
                    ? "bg-gold-50/50 border-l-2 border-l-gold-500"
                    : ""
                }`}
              >
                <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">
                  {allDeptsRow.name}
                </td>
                <td className="px-4 py-4 text-center font-mono text-sm text-secondary">
                  {allDeptsRow.facultyCount}
                </td>
                <td className="px-4 py-4 text-center font-mono text-sm text-secondary">
                  {allDeptsRow.total}
                </td>
                <td className="px-4 py-4 text-center text-emerald-600 font-mono text-sm">
                  {allDeptsRow.completed}
                </td>
                <td className="px-4 py-4 text-center text-amber-600 font-mono text-sm">
                  {allDeptsRow.pending}
                </td>
                <td className="px-4 py-4 text-center">
                  <CompletionBadge rate={allDeptsRow.completionRate} />
                </td>
              </tr>

              {/* Department Rows */}
              {departments.map((dept) => (
                <tr
                  key={dept.id}
                  onClick={() => navigate(dept.id)}
                  className={`transition-colors duration-150 hover:bg-surface-hover cursor-pointer ${
                    selectedDepartmentId === dept.id
                      ? "bg-gold-50/50 border-l-2 border-l-gold-500"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">
                    {dept.name}
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-sm text-secondary">
                    {dept.facultyCount}
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-sm text-secondary">
                    {dept.total}
                  </td>
                  <td className="px-4 py-4 text-center text-emerald-600 font-mono text-sm">
                    {dept.completed}
                  </td>
                  <td className="px-4 py-4 text-center text-amber-600 font-mono text-sm">
                    {dept.pending}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CompletionBadge rate={dept.completionRate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <DeanReportsTabs
        stats={stats}
        rawAppointments={rawAppointments}
        summaries={summaries}
      />
    </div>
  )
}

function CompletionBadge({ rate }: { rate: number }) {
  let bg: string
  let text: string
  let dot: string

  if (rate >= 80) {
    bg = "bg-emerald-100"
    text = "text-emerald-800"
    dot = "bg-emerald-500"
  } else if (rate >= 50) {
    bg = "bg-amber-100"
    text = "text-amber-800"
    dot = "bg-amber-500"
  } else {
    bg = "bg-red-100"
    text = "text-red-800"
    dot = "bg-red-500"
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${bg} ${text} transition-all duration-200`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {rate}%
    </span>
  )
}
