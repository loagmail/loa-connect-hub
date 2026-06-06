"use client"

import { useState, useCallback } from "react"
import type { RawAppointmentData } from "@/lib/types"

interface ScheduleViewProps {
  rawAppointments: RawAppointmentData[]
}

export function ScheduleView({ rawAppointments }: ScheduleViewProps) {
  const [expandedFaculties, setExpandedFaculties] = useState<Set<string>>(() => {
    const faculties = new Set(rawAppointments.map((a) => a.facultyId))
    return faculties
  })

  const toggleFaculty = useCallback((facultyId: string) => {
    setExpandedFaculties((prev) => {
      const next = new Set(prev)
      if (next.has(facultyId)) {
        next.delete(facultyId)
      } else {
        next.add(facultyId)
      }
      return next
    })
  }, [])

  if (rawAppointments.length === 0) {
    return (
      <div className="rounded-2xl border border-default/70 bg-surface p-8 shadow-sm text-center">
        <p className="text-tertiary text-sm">No schedule data available for the selected period.</p>
      </div>
    )
  }

  const grouped = new Map<string, { facultyName: string; appointments: RawAppointmentData[] }>()
  for (const apt of rawAppointments) {
    const existing = grouped.get(apt.facultyId) || { facultyName: apt.facultyName, appointments: [] }
    existing.appointments.push(apt)
    grouped.set(apt.facultyId, existing)
  }

  const sortedFaculties = Array.from(grouped.entries()).sort(
    (a, b) => b[1].appointments.length - a[1].appointments.length
  )

  return (
    <div className="space-y-3">
      {sortedFaculties.map(([facultyId, { facultyName, appointments }]) => {
        const isExpanded = expandedFaculties.has(facultyId)

        return (
          <div
            key={facultyId}
            className="rounded-2xl border border-default/70 bg-surface shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <button
              onClick={() => toggleFaculty(facultyId)}
              className="w-full flex items-center gap-3 px-6 py-4 text-left transition-colors duration-150 hover:bg-surface-hover/80"
            >
              <svg
                className={`w-4 h-4 text-tertiary transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>

              <span className="text-sm font-bold text-primary">{facultyName}</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-800 text-xs">
                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
              </span>
            </button>

            {isExpanded && (
              <div className="overflow-x-auto border-t border-default">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface/50 border-b border-default">
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Day
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Start
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        End
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Student
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((apt) => {
                      const dateObj = new Date(apt.date + "T00:00:00")
                      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })
                      const formattedDate = dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })

                      return (
                        <tr
                          key={apt.id}
                          className="transition-colors duration-150 hover:bg-surface-hover/80"
                        >
                          <td className="px-6 py-3 font-medium text-secondary whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="px-4 py-3 text-tertiary whitespace-nowrap">
                            {dayName}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-secondary whitespace-nowrap">
                            {apt.startTime}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-secondary whitespace-nowrap">
                            {apt.endTime}
                          </td>
                          <td className="px-4 py-3 text-secondary whitespace-nowrap">
                            {apt.studentName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={apt.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-cyan-100 text-cyan-700",
    CANCELLED: "bg-surface text-tertiary",
    REJECTED: "bg-red-100 text-red-700",
  }

  const labels: Record<string, string> = {
    COMPLETED: "Completed",
    PENDING: "Pending",
    APPROVED: "Approved",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${
        styles[status] || "bg-surface text-tertiary"
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
