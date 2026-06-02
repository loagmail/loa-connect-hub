"use client"

import { useState } from "react"
import type { FacultyStatsData, RawAppointmentData } from "@/lib/types"
import { ReportTable } from "./ReportTable"

interface ReportsViewProps {
  stats: FacultyStatsData[]
  rawAppointments: RawAppointmentData[]
}

type ViewMode = "summary" | "timeline"

export function ReportsView({ stats, rawAppointments }: ReportsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("summary")

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit transition-all duration-200">
        <button
          onClick={() => setViewMode("summary")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === "summary"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          By Faculty
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === "timeline"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Timeline
        </button>
      </div>

      {viewMode === "summary" ? (
        <ReportTable stats={stats} />
      ) : (
        <TimelineView rawAppointments={rawAppointments} />
      )}
    </div>
  )
}

// ─── Timeline View ───────────────────────────

function TimelineView({ rawAppointments }: { rawAppointments: RawAppointmentData[] }) {
  if (rawAppointments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-400 text-sm">No appointment data available for the selected period.</p>
      </div>
    )
  }

  // Group by date
  const grouped = new Map<string, RawAppointmentData[]>()
  for (const apt of rawAppointments) {
    const existing = grouped.get(apt.date) || []
    existing.push(apt)
    grouped.set(apt.date, existing)
  }

  // Sort dates descending (most recent first)
  const sortedDates = Array.from(grouped.keys()).sort().reverse()

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Consultation Timeline</h3>
      </div>

      <div className="divide-y divide-slate-100">
        {sortedDates.map((date) => {
          const dayAppointments = grouped.get(date)!
          const dateObj = new Date(date + "T00:00:00")
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

          return (
            <div key={date} className="px-6 py-4">
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {dayName}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {formattedDate}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {dayAppointments.length} consultation{dayAppointments.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Appointments for this day */}
              <div className="space-y-2">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-100 transition-all duration-150 hover:bg-slate-100/70"
                  >
                    {/* Time */}
                    <div className="text-center min-w-[56px]">
                      <p className="text-xs font-semibold text-slate-700">{apt.startTime}</p>
                      <p className="text-[10px] text-slate-400">{apt.endTime}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-slate-200" />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {apt.title || "Consultation"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.facultyName} &middot; {apt.studentName}
                      </p>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-cyan-100 text-cyan-700",
    CANCELLED: "bg-slate-100 text-slate-500",
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
      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        styles[status] || "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
