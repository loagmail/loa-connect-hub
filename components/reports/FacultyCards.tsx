"use client"

import { useCallback } from "react"
import type { FacultyStatsData, FacultyFrequencyData } from "@/lib/types"

interface FacultyCardsProps {
  stats: FacultyStatsData[]
  facultyFrequency: FacultyFrequencyData[]
  deanId: string
}

export function FacultyCards({ stats, facultyFrequency, deanId }: FacultyCardsProps) {
  const sorted = [...stats].sort((a, b) => b.total - a.total)

  const allMonths = Array.from(
    new Set(facultyFrequency.flatMap((f) => f.monthlyCounts.map((m) => m.month)))
  ).sort()

  const maxMonthCount = Math.max(
    ...facultyFrequency.flatMap((f) => f.monthlyCounts.map((m) => m.count)),
    1
  )

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `Faculty_Cards_${dateStr}.csv`

    const esc = (val: unknown): string => {
      const str = String(val ?? "")
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const lines: string[] = []
    lines.push("Faculty Consultation Summary")
    lines.push("Faculty,Total,Completed,Pending,Completion Rate,Actions Taken")
    for (const s of sorted) {
      lines.push([
        esc(s.facultyName),
        s.total,
        s.completed,
        s.pending,
        `${s.completionRate}%`,
        s.completed,
      ].join(","))
    }

    lines.push("")
    lines.push("Per-Faculty Monthly Breakdown")
    lines.push("Faculty,Month,Count")
    for (const f of facultyFrequency) {
      for (const mc of f.monthlyCounts) {
        lines.push([esc(f.facultyName), mc.monthName, mc.count].join(","))
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [sorted, facultyFrequency])

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-400 text-sm">No faculty data available.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Per-Faculty Cards</h3>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((stat) => {
          const freq = facultyFrequency.find((f) => f.facultyId === stat.facultyId)
          const completionPercent = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0
          const isDean = stat.facultyId === deanId

          return (
            <div
              key={stat.facultyId}
              className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-slate-800 text-sm truncate">{stat.facultyName}</span>
                {isDean && (
                  <span className="shrink-0 bg-gold-100 text-gold-800 rounded-full px-2 py-0.5 text-xs font-semibold">
                    Dean
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-bold text-slate-800">{stat.total}</span>
                <span className="text-xs text-slate-400 font-medium">Total Consultations</span>
              </div>

              <div className="mb-3">
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(completionPercent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold text-slate-600">{Math.round(completionPercent)}%</span>
                  <span className="text-[10px] text-slate-400">
                    {stat.completed} completed &middot; {stat.pending} pending
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3 text-sm text-emerald-600">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Actions taken: {stat.completed}</span>
              </div>

              {freq && freq.monthlyCounts.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Monthly trend
                  </p>
                  <div className="flex items-end gap-1">
                    {allMonths.map((month) => {
                      const mc = freq.monthlyCounts.find((m) => m.month === month)
                      const count = mc ? mc.count : 0
                      const barW = count > 0 ? Math.max(4, (count / maxMonthCount) * 20) : 2

                      return (
                        <div key={month} className="flex flex-col items-center gap-0.5">
                          <div
                            className="rounded-sm transition-all duration-200"
                            style={{
                              width: `${barW}px`,
                              height: "20px",
                              backgroundColor: count > 0 ? "#d4a047" : "#e2e8f0",
                            }}
                            title={`${mc ? mc.monthName : month}: ${count}`}
                          />
                          <span className="text-[8px] text-slate-400 font-medium leading-none">
                            {mc ? mc.monthName[0] : ""}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
