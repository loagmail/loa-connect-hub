"use client"

import { useState, useCallback, Fragment } from "react"
import type { ConsultationSummaryData } from "@/lib/types"
import { usePagination, Paginator } from "@/components/ui/Paginator"

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

  const { page, totalPages, pageSize, paginatedItems, setPage, setPageSize } = usePagination(summaries, 25)

  if (summaries.length === 0) {
    return (
      <div className="rounded-2xl border border-default/70 bg-surface p-8 shadow-sm text-center">
        <p className="text-tertiary text-sm">No consultation data available for the selected period.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-default/70 bg-surface shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-surface/50">
              <th className="w-8 px-2 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Faculty
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Time
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Student
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Concern
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Action Taken
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.map((item) => {
              const isExpanded = expandedRows.has(item.id)

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => toggleRow(item.id)}
                    className="cursor-pointer transition-colors duration-150 hover:bg-surface-hover/80"
                  >
                    <td className="px-2 py-4">
                      <svg
                        className={`w-4 h-4 text-tertiary transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-4 py-4 font-medium text-primary whitespace-nowrap">
                      {item.facultyName}
                    </td>
                    <td className="px-4 py-4 text-secondary whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-secondary whitespace-nowrap">
                      {item.startTime} &ndash; {item.endTime}
                    </td>
                    <td className="px-4 py-4 text-secondary whitespace-nowrap">
                      {item.studentName}
                    </td>
                    <td className="px-4 py-4 text-secondary max-w-[200px] truncate">
                      {item.description || item.title || "\u2014"}
                    </td>
                    <td className="px-4 py-4 text-secondary max-w-[180px] truncate">
                      {renderActionTaken(item)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-surface">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-1">
                              Concern / Description
                            </h4>
                            <p className="text-sm text-secondary whitespace-pre-wrap">
                              {item.description || "No description provided."}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-1">
                              Action Taken
                            </h4>
                            <p className="text-sm text-secondary whitespace-pre-wrap">
                              {renderActionTakenFull(item)}
                            </p>
                          </div>

                          {item.additionalRemarks && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-1">
                                Additional Remarks
                              </h4>
                              <p className="text-sm text-secondary whitespace-pre-wrap">
                                {item.additionalRemarks}
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-1">
                              Proof Files
                            </h4>
                            {item.hasFiles ? (
                              <p className="text-sm text-secondary">
                                Files attached (view in appointment details)
                              </p>
                            ) : (
                              <p className="text-sm text-tertiary">No files attached</p>
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
      <Paginator {...{ page, totalPages, pageSize, setPage, setPageSize }} totalItems={summaries.length} />
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
