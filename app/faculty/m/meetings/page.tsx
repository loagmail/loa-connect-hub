import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getMeetingsForUser } from "@/lib/controllers/appointments"
import { hasRole } from "@/lib/utils/roles"

interface Meeting {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  status: string
  organizerId: string
  organizer: Record<string, unknown> | null
  participants: Array<{
    id: string
    userId: string
    status: string
    user?: Record<string, unknown>
  }>
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-violet-100 text-violet-700",
  CANCELLED: "bg-slate-200 text-secondary",
}

const statusLabels: Record<string, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default async function MobileFacultyMeetings(props: {
  searchParams?: Promise<{ filter?: string; sort?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as Record<string, unknown>).role as string
  if (!hasRole(role, "FACULTY") && !hasRole(role, "DEAN")) redirect("/login")

  const searchParams = await props.searchParams
  const activeFilter = (searchParams?.filter || "all").toLowerCase()
  const activeSort = searchParams?.sort === "asc" ? "asc" : "desc"

  const facultyId = (session.user as Record<string, unknown>).id as string
  const meetings = (await getMeetingsForUser(facultyId)) as unknown as Meeting[]

  const statusFiltered =
    activeFilter === "all"
      ? meetings
      : meetings.filter((m) => m.status.toLowerCase() === activeFilter)

  const sorted = [...statusFiltered].sort((a, b) => {
    const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCmp !== 0) return activeSort === "asc" ? dateCmp : -dateCmp
    const timeA = a.startTime || ""
    const timeB = b.startTime || ""
    return activeSort === "asc" ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA)
  })

  const getStudentName = (m: Meeting): string => {
    const stu = m.organizer
    if (stu && (stu.name as string)) return stu.name as string
    const participant = m.participants?.find((p) => p.user)
    if (participant?.user?.name) return participant.user.name as string
    return "Student"
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Meetings</h1>
        <Link
          href="/faculty/m/meetings/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gold-600 text-white hover:bg-gold-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(statusLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`/faculty/m/meetings?filter=${key}&sort=${activeSort}`}
              className={`px-3 py-2 text-xs font-semibold rounded-full transition-colors border min-h-[36px] flex items-center ${
                activeFilter === key
                  ? "border-gold-500 bg-gold-500 text-white"
                  : "border-default bg-surface text-secondary hover:bg-slate-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <Link
          href={`/faculty/m/meetings?filter=${activeFilter}&sort=${activeSort === "asc" ? "desc" : "asc"}`}
          className="text-xs font-semibold text-tertiary hover:text-secondary transition-colors flex items-center gap-1 shrink-0 min-h-[36px]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {activeSort === "asc" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            )}
          </svg>
          {activeSort === "asc" ? "Oldest" : "Newest"}
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 bg-surface text-center">
          <div className="w-12 h-12 bg-surface border border-default rounded-xl flex items-center justify-center mx-auto mb-4 text-tertiary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-secondary font-semibold text-sm">
            {activeFilter === "all" ? "No meetings" : `No ${activeFilter} meetings`}
          </p>
          <p className="text-tertiary text-xs mt-1">Schedule a meeting to get started.</p>
        </div>
      ) : (
        <div className="ios-table-section">
          {sorted.map((m) => (
            <Link
              key={m.id}
              href={`/faculty/m/meetings/${m.id}`}
              className="ios-table-row"
            >
              <div className="ios-table-row-label">
                <p className="text-sm font-semibold text-primary leading-tight truncate">
                  {getStudentName(m)}
                </p>
                <p className="text-xs text-tertiary mt-0.5">
                  {m.date} &bull; {m.startTime} &ndash; {m.endTime}
                </p>
                {m.title && (
                  <p className="text-xs text-tertiary mt-0.5 truncate">{m.title}</p>
                )}
              </div>
              <span
                className={`ios-table-row-detail text-[10px] font-bold uppercase tracking-wider ${statusStyles[m.status] || ""}`}
              >
                {m.status}
              </span>
              <svg className="ios-table-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          href="/faculty/meetings?desktop=1"
          className="text-xs text-tertiary hover:text-secondary underline underline-offset-2"
        >
          Desktop view
        </Link>
      </div>
    </div>
  )
}
