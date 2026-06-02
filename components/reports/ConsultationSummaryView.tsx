"use client"

import { useState, useCallback, Fragment } from "react"
import type { ConsultationSummaryData } from "@/lib/types"

interface ConsultationSummaryViewProps {
  summaries: ConsultationSummaryData[]
}

export function ConsultationSummaryView({ summaries }: ConsultationSummaryViewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (summaries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-400 text-sm">No consultation data available for the selected period.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="w-8 px-2 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Faculty
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Time
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Student
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Concern
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action Taken
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((item) => {
              const isExpanded = expandedRows.has(item.id)

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => toggleRow(item.id)}
                    className="cursor-pointer transition-colors duration-150 hover:bg-slate-50/80"
                  >
                    <td className="px-2 py-4">
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800 whitespace-nowrap">
                      {item.facultyName}
                    </td>
                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-slate-700 whitespace-nowrap">
                      {item.startTime} &ndash; {item.endTime}
                    </td>
                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      {item.studentName}
                    </td>
                    <td className="px-4 py-4 text-slate-600 max-w-[200px] truncate">
                      {item.description || item.title || "\u2014"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 max-w-[180px] truncate">
                      {renderActionTaken(item)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Concern / Description
                            </h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                              {item.description || "No description provided."}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Action Taken
                            </h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                              {renderActionTakenFull(item)}
                            </p>
                          </div>

                          {item.additionalRemarks && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Additional Remarks
                              </h4>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                {item.additionalRemarks}
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Proof Files
                            </h4>
                            {item.hasFiles ? (
                              <p className="text-sm text-slate-600">
                                Files attached (view in appointment details)
                              </p>
                            ) : (
                              <p className="text-sm text-slate-400">No files attached</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const dateObj = new Date(dateStr + "T00:00:00")
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function renderActionTaken(item: ConsultationSummaryData): string {
  if (item.actionTaken) return item.actionTaken
  if (item.status !== "COMPLETED") return "Not yet completed"
  return "—"
}

function renderActionTakenFull(item: ConsultationSummaryData): string {
  if (item.actionTaken) return item.actionTaken
  if (item.status !== "COMPLETED") return "Not yet completed"
  return "No action recorded."
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
