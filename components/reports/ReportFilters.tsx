"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useState, useTransition } from "react"
import { getDefaultDateRange } from "@/lib/utils/date"

export function ReportFilters() {
  const { defaultStartDate, defaultEndDate } = getDefaultDateRange()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [startDate, setStartDate] = useState(searchParams.get("startDate") || defaultStartDate)
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || defaultEndDate)
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [isPending, startTransition] = useTransition()

  const applyFilters = useCallback(
    (overrides?: { startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams()
      const sd = overrides?.startDate ?? startDate
      const ed = overrides?.endDate ?? endDate
      params.set("startDate", sd)
      params.set("endDate", ed)
      if (status) params.set("status", status)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [startDate, endDate, status, router, pathname]
  )

  const clearFilters = useCallback(() => {
    setStartDate(defaultStartDate)
    setEndDate(defaultEndDate)
    setStatus("")
    const params = new URLSearchParams()
    params.set("startDate", defaultStartDate)
    params.set("endDate", defaultEndDate)
    router.push(`${pathname}?${params.toString()}`)
  }, [defaultStartDate, defaultEndDate, router, pathname])

  const hasFilters = startDate !== defaultStartDate || endDate !== defaultEndDate || status

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg shadow-md border border-default">
            <svg className="animate-spin h-4 w-4 text-gold-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-secondary">Loading...</span>
          </div>
        </div>
      )}
      <div className="space-y-4">
      {/* ── Manual Date + Status Filters ── */}
      <div className="flex flex-wrap items-end gap-4 p-5 bg-surface rounded-2xl border border-default/70 shadow-sm transition-all duration-200 hover:shadow-md">
        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-tertiary">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-default text-sm text-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-tertiary">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-default text-sm text-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-tertiary">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-default text-sm text-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyFilters()}
            className="px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-semibold hover:bg-gold-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Apply Filters
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-default text-secondary text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}
