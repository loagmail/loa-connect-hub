"use client"

import { useState } from "react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { TeamsLinkInput } from "./TeamsLinkInput"
import Link from "next/link"
import SubmitButton from "@/components/ui/SubmitButton"
import SwipeableRow from "@/components/ui/SwipeableRow"
import { hasRole } from "@/lib/utils/roles"

interface TimeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  teamsLink?: string | null
}

interface AppointmentCardProps {
  appointment: {
    id: string
    status: string
    date: string
    startTime: string
    endTime: string
    title?: string | null
    description?: string | null
    meetingType?: string
    teamsLink: string | null
    teamsSyncStatus?: string
    teamsSyncRetries?: number
    teamsSyncError?: string | null
    requestedAt: string
    student?: { name: string; email: string }
    faculty?: { name: string; email: string }
    attendees?: Array<{ id: string; userId: string; status: string; isMandatory?: boolean; user?: { name: string; email: string } }>
    timeSlots?: TimeSlot[]
  }
  role: string
}

const avatarGradients: Record<string, string> = {
  A: "from-indigo-500 to-purple-500 text-white",
  B: "from-blue-500 to-indigo-500 text-white",
  C: "from-emerald-500 to-teal-500 text-white",
  D: "from-amber-500 to-orange-500 text-white",
  E: "from-rose-500 to-pink-500 text-white",
  F: "from-violet-500 to-fuchsia-500 text-white",
  G: "from-cyan-500 to-blue-500 text-white",
  H: "from-teal-500 to-emerald-500 text-white",
  I: "from-indigo-500 to-pink-500 text-white",
  J: "from-purple-500 to-indigo-500 text-white",
  K: "from-pink-500 to-rose-500 text-white",
  L: "from-orange-500 to-amber-500 text-white",
  M: "from-emerald-500 to-cyan-500 text-white",
  N: "from-blue-500 to-violet-500 text-white",
  O: "from-violet-500 to-purple-500 text-white",
  P: "from-fuchsia-500 to-pink-500 text-white",
  Q: "from-indigo-500 to-cyan-500 text-white",
  R: "from-teal-500 to-blue-500 text-white",
  S: "from-emerald-500 to-indigo-500 text-white",
  T: "from-rose-500 to-orange-500 text-white",
  U: "from-violet-500 to-indigo-500 text-white",
  V: "from-cyan-500 to-teal-500 text-white",
  W: "from-amber-500 to-rose-500 text-white",
  X: "from-indigo-500 to-purple-500 text-white",
  Y: "from-purple-500 to-pink-500 text-white",
  Z: "from-rose-500 to-violet-500 text-white",
}

function getAvatarClass(name: string) {
  const char = name?.charAt(0)?.toUpperCase() || "A"
  return avatarGradients[char] || "from-gold-500 to-gold-600 text-white"
}

export function AppointmentCard({ appointment, role }: AppointmentCardProps) {
  const [loading, setLoading] = useState("")
  const [message, setMessage] = useState("")
  const [localStatus, setLocalStatus] = useState<string | null>(null)
  const [localSyncStatus, setLocalSyncStatus] = useState<string | undefined>(appointment.teamsSyncStatus)

  const effectiveStatus = localStatus || appointment.status

  const handleAction = async (action: string) => {
    if (loading) return
    setLoading(action)
    setMessage("")

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/${action}`, {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        const statusMap: Record<string, string> = {
          accept: "APPROVED",
          approve: "APPROVED",
          decline: "REJECTED",
          reject: "REJECTED",
          complete: "COMPLETED",
          cancel: "CANCELLED",
        }
        setLocalStatus(statusMap[action] || null)
        setMessage(`Appointment ${action}d!`)
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(data.error || "Action failed")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setLoading("")
    }
  }

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?"

  const personName = hasRole(role, "STUDENT")
    ? appointment.faculty?.name || "Faculty"
    : appointment.student?.name || "Student"

  const detailHref = hasRole(role, "STUDENT")
    ? `/student/meetings/${appointment.id}`
    : `/faculty/meetings/${appointment.id}`

  const swipeActions: Array<{ label: string; onClick: () => void; bgColor: string }> = []

  if (hasRole(role, "STUDENT") && effectiveStatus === "PENDING") {
    swipeActions.push({
      label: "Cancel",
      onClick: async () => {
        setLoading("cancel")
        setMessage("")
        try {
          const res = await fetch(`/api/appointments/${appointment.id}/student-cancel`, { method: "POST" })
          const data = await res.json()
          if (res.ok) {
            setLocalStatus("CANCELLED")
            setMessage("Appointment cancelled!")
            setTimeout(() => setMessage(""), 3000)
          } else {
            setMessage(data.error || "Failed to cancel")
          }
        } catch {
          setMessage("An error occurred")
        } finally {
          setLoading("")
        }
      },
      bgColor: "bg-red-600",
    })
  }

  if (hasRole(role, "FACULTY") && effectiveStatus === "PENDING") {
    swipeActions.push(
      {
        label: "Accept",
        onClick: () => handleAction("accept"),
        bgColor: "bg-emerald-600",
      },
      {
        label: "Decline",
        onClick: () => handleAction("decline"),
        bgColor: "bg-red-600",
      },
    )
  }

  if (hasRole(role, "FACULTY") && effectiveStatus === "APPROVED") {
    swipeActions.push(
      {
        label: "Complete",
        onClick: () => handleAction("complete"),
        bgColor: "bg-brand-600",
      },
      {
        label: "Cancel",
        onClick: () => handleAction("cancel"),
        bgColor: "bg-red-600",
      },
    )
  }

  return (
    <div className="ios-table-section">
      <SwipeableRow actions={swipeActions}>
        <Link href={detailHref} className="ios-table-row !min-h-[60px]">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarClass(personName)} flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}>
          {getInitial(personName)}
        </div>
        <div className="ios-table-row-label">
          <p className="text-sm font-semibold text-primary leading-tight">{personName}</p>
          <p className="text-xs text-tertiary mt-0.5">
            {appointment.date} &bull; {appointment.startTime} &ndash; {appointment.endTime}
          </p>
        </div>
        <span className="ios-table-row-detail text-xs">
          <StatusBadge status={effectiveStatus} />
        </span>
        <svg className="ios-table-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      </SwipeableRow>

      {hasRole(role, "STUDENT") && effectiveStatus === "PENDING" && (
        <div className="px-4 py-3 border-t border-default">
          <SubmitButton
            onClick={async () => {
              setLoading("cancel")
              setMessage("")
              try {
                const res = await fetch(`/api/appointments/${appointment.id}/student-cancel`, { method: "POST" })
                const data = await res.json()
                if (res.ok) {
                  setLocalStatus("CANCELLED")
                  setMessage("Appointment cancelled!")
                  setTimeout(() => setMessage(""), 3000)
                } else {
                  setMessage(data.error || "Failed to cancel")
                }
              } catch {
                setMessage("An error occurred")
              } finally {
                setLoading("")
              }
            }}
            loading={loading === "cancel"}
            variant="ios-destructive"
            className="text-xs font-semibold px-4 py-3 w-full"
          >
            {loading === "cancel" ? "Cancelling..." : "Cancel Request"}
          </SubmitButton>
        </div>
      )}

      {hasRole(role, "FACULTY") && effectiveStatus === "PENDING" && (
        <div className="px-4 py-3 border-t border-default">
          <div className="flex gap-2">
            <SubmitButton
              onClick={() => handleAction("accept")}
              loading={loading === "accept"}
              variant="ios-primary"
              className="text-xs font-semibold py-2 flex-1"
            >
              {loading === "accept" ? "Processing" : "Accept"}
            </SubmitButton>
            <SubmitButton
              onClick={() => handleAction("decline")}
              loading={loading === "decline"}
              variant="ios-destructive"
              className="text-xs font-semibold py-2 flex-1"
            >
              {loading === "decline" ? "Declining..." : "Decline"}
            </SubmitButton>
          </div>
        </div>
      )}

      {hasRole(role, "FACULTY") && effectiveStatus === "APPROVED" && (
        <div className="px-4 py-3 border-t border-default space-y-3">
          <div className="flex gap-2">
            <SubmitButton
              onClick={() => handleAction("complete")}
              loading={loading === "complete"}
              variant="ios-primary"
              className="text-xs font-semibold py-2 flex-1"
            >
              {loading === "complete" ? "Completing" : "Mark Complete"}
            </SubmitButton>
            <SubmitButton
              onClick={() => handleAction("cancel")}
              loading={loading === "cancel"}
              variant="ios-destructive"
              className="text-xs font-semibold py-2 flex-1"
            >
              {loading === "cancel" ? "Cancelling..." : "Cancel"}
            </SubmitButton>
          </div>
          {localSyncStatus === "FAILED" && (
            <SubmitButton
              onClick={async () => {
                setLoading("retry-sync")
                try {
                  const res = await fetch(`/api/appointments/${appointment.id}/retry-sync`, { method: "POST" })
                  const data = await res.json()
                  if (res.ok) {
                    setLocalSyncStatus("UNWRITTEN")
                    setMessage("Sync retry queued!")
                    setTimeout(() => setMessage(""), 3000)
                  } else {
                    setMessage(data.error || "Retry failed")
                  }
                } catch {
                  setMessage("An error occurred")
                } finally {
                  setLoading("")
                }
              }}
              loading={loading === "retry-sync"}
              variant="primary"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              {loading === "retry-sync" ? "Retrying..." : "Retry Sync"}
            </SubmitButton>
          )}
          <div>
            <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1.5">Microsoft Teams Link</p>
            <TeamsLinkInput appointmentId={appointment.id} />
          </div>
        </div>
      )}

      {message && (
        <p className={`px-4 pb-3 text-sm font-semibold ${
          message.includes("successfully") || message.includes("queued") ? "text-emerald-600" : "text-rose-600"
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}
