"use client"

import Link from "next/link"

interface UpcomingScheduleCardProps {
  appointment: {
    id: string
    date: string
    startTime: string
    endTime: string
    title?: string | null
    description?: string | null
    teamsLink: string | null
    faculty?: { name: string }
  }
}

export function UpcomingScheduleCard({ appointment }: UpcomingScheduleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition">
      <div className="flex gap-4 items-start">

        {/* Time Block */}
        <div className="flex flex-col items-center justify-center min-w-[70px] rounded-xl bg-slate-50 border border-slate-200 px-2 py-3">
          <span className="text-xs text-slate-400 font-medium">
            {appointment.date}
          </span>
          <span className="text-sm font-bold text-slate-800">
            {appointment.startTime}
          </span>
          <span className="text-[11px] text-slate-400">–</span>
          <span className="text-sm font-bold text-slate-800">
            {appointment.endTime}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">

          {/* Title (Most Important) */}
          <p className="text-base font-bold text-slate-900 leading-snug">
            {appointment.title || "Consultation Session"}
          </p>

          {/* Faculty */}
          {appointment.faculty && (
            <p className="text-xs text-slate-500">
              Faculty:{" "}
              <span className="font-medium text-slate-700">
                {appointment.faculty.name}
              </span>
            </p>
          )}

          {/* Description */}
          {appointment.description && (
            <p className="text-xs text-slate-400 line-clamp-2">
              {appointment.description}
            </p>
          )}

          {/* Teams Link */}
          {appointment.teamsLink && (
            <a
              href={appointment.teamsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Join Meeting →
            </a>
          )}
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
            Upcoming
          </span>

          <Link
            href={`/appointments/${appointment.id}`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}