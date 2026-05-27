"use client"

import type { FacultyStatsData } from "@/lib/repositories/interfaces"

interface ReportChartsProps {
  stats: FacultyStatsData[]
}

export function ReportCharts({ stats }: ReportChartsProps) {
  if (stats.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmptyChartCard title="Consultations by Faculty" />
        <EmptyChartCard title="Department-wide Status Breakdown" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BarChartCard stats={stats} />
      <DonutChartCard stats={stats} />
    </div>
  )
}

// ─── Empty State ─────────────────────────────

function EmptyChartCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No data available
      </div>
    </div>
  )
}

// ─── Bar Chart ───────────────────────────────

function BarChartCard({ stats }: { stats: FacultyStatsData[] }) {
  const maxValue = Math.max(...stats.map((s) => s.total), 1)
  const barHeight = 180

  // Sorted by total descending
  const sorted = [...stats].sort((a, b) => b.total - a.total)

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <h3 className="text-sm font-bold text-slate-800 mb-1">Consultations by Faculty</h3>
      <p className="text-xs text-slate-400 mb-5">Total vs Completed</p>

      <div className="flex items-end gap-3" style={{ height: barHeight }}>
        {sorted.map((stat) => {
          const totalHeight = (stat.total / maxValue) * (barHeight - 20)
          const completedHeight = stat.total > 0
            ? (stat.completed / stat.total) * totalHeight
            : 0

          return (
            <div
              key={stat.facultyId}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Bar stack */}
              <div className="relative w-full flex flex-col-reverse" style={{ height: `${totalHeight}px` }}>
                {/* Completed portion (green) */}
                <div
                  className="w-full rounded-t-sm bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                  style={{ height: `${completedHeight}px` }}
                  title={`${stat.facultyName}: ${stat.completed} completed`}
                />
                {/* Remaining portion (slate, representing pending + cancelled) */}
                {stat.total > stat.completed && (
                  <div
                    className="w-full rounded-t-sm bg-slate-200 transition-all duration-300 group-hover:bg-slate-300"
                    style={{ height: `${totalHeight - completedHeight}px` }}
                    title={`${stat.facultyName}: ${stat.total - stat.completed} remaining`}
                  />
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-slate-500 text-center truncate w-full px-0.5 leading-tight">
                {stat.facultyName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{stat.total}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-slate-500">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200" />
          <span className="text-xs text-slate-500">Pending / Cancelled</span>
        </div>
      </div>
    </div>
  )
}

// ─── Donut Chart ─────────────────────────────

function DonutChartCard({ stats }: { stats: FacultyStatsData[] }) {
  const totalCompleted = stats.reduce((sum, s) => sum + s.completed, 0)
  const totalPending = stats.reduce((sum, s) => sum + s.pending, 0)
  const totalCancelled = stats.reduce((sum, s) => sum + s.cancelled, 0)
  const total = totalCompleted + totalPending + totalCancelled

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Department-wide Status Breakdown
        </h3>
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data available
        </div>
      </div>
    )
  }

  const segments = [
    { label: "Completed", value: totalCompleted, color: "#34d399" },   // emerald-400
    { label: "Pending", value: totalPending, color: "#fbbf24" },       // amber-400
    { label: "Cancelled", value: totalCancelled, color: "#94a3b8" },   // slate-400
  ].filter((s) => s.value > 0)

  const size = 180
  const cx = size / 2
  const cy = size / 2
  const radius = 72
  const strokeWidth = 28

  // Calculate arc paths
  let cumulativePercent = 0
  const arcs: ({ label: string; value: number; color: string; percent: number; path: string })[] = segments.map((segment) => {
    const percent = segment.value / total
    const startPercent = cumulativePercent
    const endPercent = cumulativePercent + percent
    cumulativePercent = endPercent

    const startAngle = startPercent * 360 - 90
    const endAngle = endPercent * 360 - 90

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const largeArc = percent > 0.5 ? 1 : 0

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`

    return { ...segment, percent, path }
  })

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <h3 className="text-sm font-bold text-slate-800 mb-1">
        Department-wide Status Breakdown
      </h3>
      <p className="text-xs text-slate-400 mb-5">{total} total consultations</p>

      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />

          {/* Segments */}
          {arcs.map((seg) => (
            <path
              key={seg.label}
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out hover:opacity-80"
            />
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {arcs.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-500">
                {seg.label} ({Math.round(seg.percent * 100)}%)
              </span>
            </div>
          ))}
        </div>

        {/* Segment counts */}
        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-xs">
          {segments.map((seg) => (
            <div key={seg.label} className="text-center">
              <p className="text-lg font-bold text-slate-800">{seg.value}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {seg.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
