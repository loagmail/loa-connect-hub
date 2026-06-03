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
    <div className="bg-surface rounded-2xl border border-default p-4 hover:shadow-sm transition">
      <div className="flex gap-4 items-start">

        {/* Time Block */}
        <div className="flex flex-col items-center justify-center min-w-[70px] rounded-xl bg-surface border border-default px-2 py-3">
          <span className="text-xs text-tertiary font-medium">
            {appointment.date}
          </span>
          <span className="text-sm font-bold text-primary">
            {appointment.startTime}
          </span>
          <span className="text-[11px] text-tertiary">–</span>
          <span className="text-sm font-bold text-primary">
            {appointment.endTime}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">

          {/* Title (Most Important) */}
          <p className="text-base font-bold text-primary leading-snug">
            {appointment.title || "Consultation Session"}
          </p>

          {/* Faculty */}
          {appointment.faculty && (
            <p className="text-xs text-tertiary">
              Faculty:{" "}
              <span className="font-medium text-secondary">
                {appointment.faculty.name}
              </span>
            </p>
          )}

          {/* Description */}
          {appointment.description && (
            <p className="text-xs text-tertiary line-clamp-2">
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
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
            Upcoming
          </span>

          <Link
            href={`/appointments/${appointment.id}`}
            className="text-xs font-semibold text-tertiary hover:text-secondary"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}