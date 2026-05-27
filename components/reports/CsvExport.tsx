"use client"

import type { FacultyStatsData, RawAppointmentData } from "@/lib/repositories/interfaces"
import { useCallback } from "react"

interface CsvExportProps {
  departmentName: string
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
}

export function CsvExport({ departmentName, stats, rawAppointments }: CsvExportProps) {
  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `${departmentName.replace(/\s+/g, "_")}_Report_${dateStr}.csv`

    // Escape CSV field: wrap in quotes and double any existing quotes
    const esc = (val: unknown): string => {
      const str = String(val ?? "")
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const lines: string[] = []

    // ── Section 1: Summary Stats ──
    lines.push("Faculty Consultation Summary")
    lines.push("Faculty,Total,Completed,Pending,Cancelled,Completion Rate")

    for (const s of stats) {
      lines.push([
        esc(s.facultyName),
        s.total,
        s.completed,
        s.pending,
        s.cancelled,
        `${s.completionRate}%`,
      ].join(","))
    }

    lines.push("") // blank row separator

    // ── Section 2: Raw Appointments ──
    lines.push("Individual Appointments")
    lines.push("Faculty,Student,Date,Start Time,End Time,Status,Title")

    for (const apt of rawAppointments) {
      lines.push([
        esc(apt.facultyName),
        esc(apt.studentName),
        apt.date,
        apt.startTime,
        apt.endTime,
        apt.status,
        esc(apt.title),
      ].join(","))
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
  }, [departmentName, stats, rawAppointments])

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/70 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export CSV
    </button>
  )
}
