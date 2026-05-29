"use client"

import type { FacultyStatsData, RawAppointmentData, ConsultationSummaryData, DepartmentFrequencyEntry, FacultyFrequencyData, DepartmentYearlyEntry, FacultyYearlyData } from "@/lib/repositories/interfaces"
import { useCallback } from "react"

interface CsvExportProps {
  departmentName: string
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
  summaries?: ConsultationSummaryData[]
  departmentFrequency?: DepartmentFrequencyEntry[]
  facultyFrequency?: FacultyFrequencyData[]
  departmentYearlyFrequency?: DepartmentYearlyEntry[]
  facultyYearlyFrequency?: FacultyYearlyData[]
}

export function CsvExport({ departmentName, stats, rawAppointments, summaries, departmentFrequency, facultyFrequency, departmentYearlyFrequency, facultyYearlyFrequency }: CsvExportProps) {
  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `${departmentName.replace(/\s+/g, "_")}_Full_Data_Report_${dateStr}.csv`

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

    // ── Section 2: Raw Appointments (Schedule) ──
    lines.push("Individual Appointments (Schedule)")
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

    lines.push("") // blank row separator

    // ── Section 3: Consultation Summary ──
    if (summaries && summaries.length > 0) {
      lines.push("Consultation Summary")
      lines.push("Faculty,Date,Start Time,End Time,Student,Concern,Action Taken,Additional Remarks,Has Files,Status")

      for (const s of summaries) {
        lines.push([
          esc(s.facultyName),
          s.date,
          s.startTime,
          s.endTime,
          esc(s.studentName),
          esc(s.description || s.title || ""),
          esc(s.actionTaken || (s.status !== "COMPLETED" ? "Not yet completed" : "")),
          esc(s.additionalRemarks || ""),
          s.hasFiles ? "Yes" : "No",
          s.status,
        ].join(","))
      }

      lines.push("")
    }

    // ── Section 4: Department Monthly Frequency ──
    if (departmentFrequency && departmentFrequency.length > 0) {
      lines.push("Department-wide Monthly Consultation Frequency")
      lines.push("Month,Year,Count")

      for (const f of departmentFrequency) {
        lines.push([f.monthName, f.year, f.count].join(","))
      }

      lines.push("")
    }

    // ── Section 5: Department Yearly Frequency ──
    if (departmentYearlyFrequency && departmentYearlyFrequency.length > 0) {
      lines.push("Department-wide Yearly Consultation Frequency")
      lines.push("Year,Count")

      for (const f of departmentYearlyFrequency) {
        lines.push([f.year, f.count].join(","))
      }

      lines.push("")
    }

    // ── Section 6: Per-Faculty Monthly Breakdown ──
    if (facultyFrequency && facultyFrequency.length > 0) {
      lines.push("Per-Faculty Frequency Breakdown")
      lines.push("Faculty,Total,Average per Month")

      for (const f of facultyFrequency) {
        lines.push([
          esc(f.facultyName),
          f.total,
          f.averagePerMonth.toFixed(1),
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

      lines.push("")
    }

    // ── Section 7: Per-Faculty Yearly Breakdown ──
    if (facultyYearlyFrequency && facultyYearlyFrequency.length > 0) {
      lines.push("Per-Faculty Yearly Breakdown")
      lines.push("Faculty,Total,Average per Year")

      for (const f of facultyYearlyFrequency) {
        lines.push([
          esc(f.facultyName),
          f.total,
          f.averagePerYear.toFixed(1),
        ].join(","))
      }

      lines.push("")

      lines.push("Per-Faculty Yearly Breakdown Details")
      lines.push("Faculty,Year,Count")

      for (const f of facultyYearlyFrequency) {
        for (const yc of f.yearlyCounts) {
          lines.push([esc(f.facultyName), yc.year, yc.count].join(","))
        }
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
  }, [departmentName, stats, rawAppointments, summaries, departmentFrequency, facultyFrequency, departmentYearlyFrequency, facultyYearlyFrequency])

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-600 text-white text-sm font-semibold hover:bg-gold-700 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download All Data
    </button>
  )
}
