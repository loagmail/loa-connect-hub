"use client"

import { useState } from "react"
import { StatusBadge } from "./StatusBadge"
import { TeamsLinkInput } from "./TeamsLinkInput"

interface AppointmentCardProps {
  appointment: {
    id: string
    status: string
    teamsLink: string | null
    requestedAt: string
    student?: { name: string; email: string }
    faculty?: { name: string; email: string }
    schedule?: { date: string; startTime: string; endTime: string }
  }
  role: "STUDENT" | "FACULTY"
}

export function AppointmentCard({ appointment, role }: AppointmentCardProps) {
  const [loading, setLoading] = useState("")
  const [message, setMessage] = useState("")

  const handleAction = async (action: string) => {
    setLoading(action)
    setMessage("")

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/${action}`, {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Appointment ${action}d successfully!`)
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage(data.error || "Action failed")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={appointment.status} />
            {appointment.teamsLink && (
              <a
                href={appointment.teamsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Join Teams Meeting
              </a>
            )}
          </div>

          {role === "STUDENT" && appointment.faculty && (
            <p className="text-sm font-medium text-gray-700">
              With: {appointment.faculty.name}
            </p>
          )}
          {role === "FACULTY" && appointment.student && (
            <p className="text-sm font-medium text-gray-700">
              Student: {appointment.student.name} ({appointment.student.email})
            </p>
          )}

          {appointment.schedule && (
            <p className="text-sm text-gray-600">
              {appointment.schedule.date} at {appointment.schedule.startTime} - {appointment.schedule.endTime}
            </p>
          )}

          <p className="text-xs text-gray-400">
            Requested: {new Date(appointment.requestedAt).toLocaleString()}
          </p>
        </div>

        {role === "FACULTY" && appointment.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("approve")}
              disabled={loading !== ""}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading !== ""}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        )}

        {role === "FACULTY" && appointment.status === "APPROVED" && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleAction("complete")}
              disabled={loading !== ""}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading === "complete" ? "Completing..." : "Mark Complete"}
            </button>
            <TeamsLinkInput appointmentId={appointment.id} />
          </div>
        )}
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
