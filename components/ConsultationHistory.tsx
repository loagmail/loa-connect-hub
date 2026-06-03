"use client"

import { useMemo } from "react"
import Link from "next/link"

interface HistoryAppointment {
  id: string
  title: string | null
  description: string | null
  actionTaken: string | null
  date: string
  startTime: string
  endTime: string
  status: string
  faculty?: { name: string; email: string } | null
}

interface Props {
  studentName: string
  course: string | null
  appointments: HistoryAppointment[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00").getTime()
  const d2 = new Date(b + "T00:00:00").getTime()
  return Math.round((d2 - d1) / 86400000)
}

export default function ConsultationHistory({ studentName, course, appointments }: Props) {
  const sorted = useMemo(
    () => [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [appointments]
  )

  const completed = sorted.filter((a) => a.status === "COMPLETED")
  const uniqueFaculty = useMemo(
    () => [...new Set(sorted.map((a) => a.faculty?.name).filter(Boolean))],
    [sorted]
  )

  const firstDate = sorted.length > 0 ? sorted[0].date : null
  const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : null
  const timespan = firstDate && lastDate ? daysBetween(firstDate, lastDate) : 0

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {sorted.length === 0 ? (
        <div className="card p-12 sm:p-16 bg-surface text-center animate-fade-in mt-8">
          <div className="w-16 h-16 bg-surface border border-default rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">📖</span>
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">No history yet</h2>
          <p className="text-sm text-tertiary max-w-md mx-auto mb-6">
            Your consultation history will appear here once you start meeting with faculty.
          </p>
          <Link
            href="/student/book"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gold-600 text-white font-semibold text-sm hover:bg-gold-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Book Your First Consultation
          </Link>
        </div>
      ) : (
        <article className="space-y-0">
          {/* ── Title Page ────────────────────────────────── */}
          <div className="text-center py-12 sm:py-16 border-b border-default mb-10">
            <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-3">Narrative Report</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight leading-tight">
              {studentName}&apos;s Consultation Journey
            </h1>
            <p className="text-base text-tertiary mt-3">
              {studentName}{course ? ` · ${course}` : ""}
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-tertiary">
              <span>{sorted.length} entr{sorted.length === 1 ? "y" : "ies"}</span>
              <span className="text-slate-300">·</span>
              <span>{completed.length} completed</span>
              <span className="text-slate-300">·</span>
              <span>{uniqueFaculty.length} facult{uniqueFaculty.length === 1 ? "y" : "ies"}</span>
              {timespan > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{timespan} day{timespan !== 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          </div>

          {/* ── Foreword ──────────────────────────────────── */}
          <div className="prose prose-sm max-w-none text-secondary mb-12 px-1">
            <p>
              This report documents {studentName}&apos;s consultation history throughout {studentName.split(" ")[0]}&apos;s thesis journey.
              {firstDate && <> It begins on <strong>{formatDate(firstDate)}</strong></>}
              {lastDate && firstDate !== lastDate && <> and spans through <strong>{formatDate(lastDate)}</strong></>}
              {timespan > 0 && <>, covering a period of <strong>{timespan} day{timespan !== 1 ? "s" : ""}</strong>.</>}
              {completed.length > 0 && <> Of the <strong>{sorted.length}</strong> consultation{sorted.length === 1 ? "" : "s"} conducted, <strong>{completed.length}</strong> {completed.length === 1 ? "has" : "have"} been completed.</>}
              {uniqueFaculty.length > 0 && <> {studentName.split(" ")[0]} engaged with <strong>{uniqueFaculty.length}</strong> facult{uniqueFaculty.length === 1 ? "y" : "ies"} member{uniqueFaculty.length === 1 ? "" : "s"}.</>}
            </p>
          </div>

          {/* ── Narrative Entries ─────────────────────────── */}
          <div className="space-y-10">
            {sorted.map((apt, i) => {
              const prev = i > 0 ? sorted[i - 1] : null
              const gap = prev ? daysBetween(prev.date, apt.date) : 0
              const isCompleted = apt.status === "COMPLETED"
              const firstName = studentName.split(" ")[0]

              return (
                <section key={apt.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  {/* Time gap indicator */}
                  {gap > 1 && (
                    <div className="flex items-center gap-3 mb-5 text-xs text-tertiary">
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <span className="italic">{gap} day{gap !== 1 ? "s" : ""} later</span>
                      <span className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}

                  {/* Entry */}
                  <div className="group relative pl-8 sm:pl-10">
                    {/* Vertical line */}
                    <div className="absolute left-[11px] sm:left-[13px] top-0 bottom-0 w-px bg-slate-200" />

                    {/* Clock dot */}
                    <div className={`absolute left-0 sm:left-1 top-1 w-[23px] sm:w-[27px] h-[23px] sm:h-[27px] rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ring-4 ring-white z-10 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 text-white"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Content */}
                    <div className="pb-2">
                      <time className="text-xs font-semibold text-gold-700 uppercase tracking-wider">
                        {formatDate(apt.date)}
                      </time>

                      <p className="text-sm text-tertiary mt-0.5">
                        {apt.startTime} – {apt.endTime}
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : apt.status === "APPROVED"
                              ? "bg-gold-100 text-gold-700"
                              : apt.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-surface text-tertiary"
                        }`}>
                          {apt.status}
                        </span>
                      </p>

                      <div className="mt-4 space-y-4 text-sm text-secondary leading-relaxed">
                        <p>
                          {firstName} met with <strong>{apt.faculty?.name || "a faculty member"}</strong>
                          {apt.title ? <> to discuss &ldquo;<em>{apt.title}</em>&rdquo;.</> : "."}
                        </p>

                        {apt.description && (
                          <div className="pl-4 border-l-2 border-default text-secondary">
                            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">Topics discussed</p>
                            <p className="whitespace-pre-wrap">{apt.description}</p>
                          </div>
                        )}

                        {apt.actionTaken && (
                          <div className="pl-4 border-l-2 border-emerald-300 bg-emerald-50/50 -ml-0.5 p-3 rounded-r-lg">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Faculty notes</p>
                            <p className="text-emerald-800 whitespace-pre-wrap">{apt.actionTaken}</p>
                          </div>
                        )}

                        {!apt.description && !apt.actionTaken && (
                          <p className="text-tertiary italic text-xs">No details recorded for this session.</p>
                        )}
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/student/meetings/${apt.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors"
                        >
                          Read full entry →
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>

          {/* ── Closing ───────────────────────────────────── */}
          <div className="mt-16 pt-10 border-t border-default">
            <div className="text-center max-w-lg mx-auto">
              <span className="text-3xl block mb-4">📖</span>
              <p className="text-sm text-secondary leading-relaxed">
                This concludes {studentName.split(" ")[0]}&apos;s consultation narrative.
                {completed.length < sorted.length
                  ? ` ${sorted.length - completed.length} entr${sorted.length - completed.length === 1 ? "y" : "ies"} still pending.`
                  : " All entries have been completed."}
              </p>
              <p className="text-xs text-tertiary mt-2">
                {uniqueFaculty.length} facult{uniqueFaculty.length === 1 ? "y" : "ies"} · {sorted.length} consultation{sorted.length === 1 ? "" : "s"} · {timespan > 0 ? `${timespan} day${timespan !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
