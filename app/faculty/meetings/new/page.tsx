"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SubmitButton from "@/components/SubmitButton"
import Skeleton from "@/components/Skeleton"

interface FacultyUser {
  id: string
  name: string
  email: string
}

interface Conflict {
  type: "appointment" | "meeting" | "teams"
  userName: string
  title: string
  date: string
  startTime: string
  endTime: string
}

interface TimeSlot {
  date: string
  startTime: string
  endTime: string
}

interface Appointment {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  // Appointment slot selection mode
  const [timeSourceMode, setTimeSourceMode] = useState<"manual" | "appointment">("manual")
  const [appointmentQuery, setAppointmentQuery] = useState("")
  const [appointmentOptions, setAppointmentOptions] = useState<Appointment[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [appointmentTimeSlots, setAppointmentTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)

  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setFacultyList(data.users.filter((u: any) => u.role === "FACULTY"))
      })
      .catch(() => {})
  }, [])

  // Search for appointments when query changes (if in appointment mode)
  useEffect(() => {
    if (timeSourceMode !== "appointment" || !appointmentQuery.trim()) {
      setAppointmentOptions([])
      return
    }
    const timer = setTimeout(async () => {
      setLoadingAppointments(true)
      try {
        const res = await fetch(`/api/appointments?q=${encodeURIComponent(appointmentQuery)}`)
        const data = await res.json()
        setAppointmentOptions(data.appointments || [])
      } catch {
        setAppointmentOptions([])
      } finally {
        setLoadingAppointments(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [appointmentQuery, timeSourceMode])

  // Fetch timeslots when appointment is selected
  useEffect(() => {
    if (!selectedAppointmentId) {
      setAppointmentTimeSlots([])
      setSelectedSlotIndex(null)
      return
    }
    const fetchTimeSlots = async () => {
      setLoadingTimeSlots(true)
      try {
        const res = await fetch(`/api/appointments/${selectedAppointmentId}/timeslots`)
        const data = await res.json()
        setAppointmentTimeSlots(data.timeSlots || [])
        setSelectedSlotIndex(null)
      } catch {
        setAppointmentTimeSlots([])
      } finally {
        setLoadingTimeSlots(false)
      }
    }
    fetchTimeSlots()
  }, [selectedAppointmentId])

  // Update date/time when slot is selected
  useEffect(() => {
    if (selectedSlotIndex !== null && appointmentTimeSlots[selectedSlotIndex]) {
      const slot = appointmentTimeSlots[selectedSlotIndex]
      setDate(slot.date)
      setStartTime(slot.startTime)
      setEndTime(slot.endTime)
    }
  }, [selectedSlotIndex, appointmentTimeSlots])

  // Check conflicts when date/time/participants change
  useEffect(() => {
    if (!date || !startTime || !endTime || selectedIds.length === 0) {
      setConflicts([])
      return
    }
    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch("/api/meetings/conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facultyIds: selectedIds, date, startTime, endTime }),
        })
        const data = await res.json()
        setConflicts(data.conflicts || [])
      } catch {
        setConflicts([])
      } finally {
        setChecking(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [date, startTime, endTime, selectedIds])

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          date,
          startTime,
          endTime,
          participantIds: selectedIds,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/faculty/meetings/${data.meeting.id}`)
      } else {
        setError(data.error || "Failed to create meeting")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Internal Meeting</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule a meeting with other faculty members</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="input-label">Meeting Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="e.g. Thesis Review Sync"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="input-label">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Agenda, topics to discuss..."
          />
        </div>

        {/* Time Source Selection */}
        <div>
          <label className="input-label">When is this meeting?</label>
          <div className="flex gap-3 mt-2">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
              timeSourceMode === "manual"
                ? "border-gold-300 bg-gold-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}>
              <input
                type="radio"
                name="timeSource"
                value="manual"
                checked={timeSourceMode === "manual"}
                onChange={() => {
                  setTimeSourceMode("manual")
                  setSelectedAppointmentId(null)
                  setSelectedSlotIndex(null)
                  setAppointmentQuery("")
                }}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enter Manually</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
              timeSourceMode === "appointment"
                ? "border-gold-300 bg-gold-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}>
              <input
                type="radio"
                name="timeSource"
                value="appointment"
                checked={timeSourceMode === "appointment"}
                onChange={() => setTimeSourceMode("appointment")}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">From Appointment</span>
            </label>
          </div>
        </div>

        {/* Appointment Slot Selection */}
        {timeSourceMode === "appointment" && (
          <div className="space-y-3 p-4 rounded-lg border border-gold-200 bg-gold-50/30">
            <div>
              <label className="input-label">Search Consultation Appointments</label>
              <input
                type="text"
                value={appointmentQuery}
                onChange={(e) => setAppointmentQuery(e.target.value)}
                placeholder="Search by title or student name..."
                className="input text-sm mt-1"
              />
              {loadingAppointments && <p className="text-xs text-slate-400 mt-1">Searching...</p>}
            </div>

            {appointmentOptions.length > 0 && (
              <div>
                <label className="input-label">Select Appointment</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {appointmentOptions.map((appt) => (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAppointmentId === appt.id
                          ? "border-gold-300 bg-white"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-800">{appt.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{appt.date} · {appt.startTime}–{appt.endTime}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedAppointmentId && appointmentTimeSlots.length > 0 && (
              <div>
                <label className="input-label">Select Time Slot</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {appointmentTimeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSlotIndex === idx
                          ? "border-gold-300 bg-gold-50/50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-800">{slot.date} · {slot.startTime}–{slot.endTime}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingTimeSlots && <p className="text-xs text-slate-400">Loading time slots...</p>}

            {selectedSlotIndex !== null && (
              <div className="p-2 rounded bg-white border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium">✓ Time slot selected</p>
              </div>
            )}
          </div>
        )}

        {/* Date (Manual mode or from appointment) */}
        {(timeSourceMode === "manual" || selectedSlotIndex !== null) && (
          <div>
            <label className="input-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
              disabled={timeSourceMode === "appointment"}
            />
          </div>
        )}

        {/* Time */}
        {(timeSourceMode === "manual" || selectedSlotIndex !== null) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
                disabled={timeSourceMode === "appointment"}
                required
              />
            </div>
            <div>
              <label className="input-label">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input"
                disabled={timeSourceMode === "appointment"}
                required
              />
            </div>
          </div>
        )}

        {/* Participants */}
        <div>
          <label className="input-label">Invite Faculty</label>
          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
            {facultyList.length === 0 ? (
              <div className="space-y-2">
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-5/6" />
                <Skeleton variant="text" className="w-4/6" />
              </div>
            ) : (
              facultyList.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedIds.includes(f.id)
                      ? "border-gold-300 bg-gold-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(f.id)}
                    onChange={() => toggleParticipant(f.id)}
                    className="w-4 h-4 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-400">{f.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Conflict warnings */}
        {conflicts.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-semibold text-amber-800">Scheduling Conflicts Detected</p>
            </div>
            <ul className="space-y-1 ml-7">
              {conflicts.map((c, i) => (
                <li key={i} className="text-xs text-amber-700">
                  <span className="font-medium">{c.userName}</span> has a{c.type === "appointment" ? "n" : ""}{" "}
                  <span className="font-semibold">{c.type === "appointment" ? "appointment" : c.type === "teams" ? "Teams calendar event" : "meeting"}</span>:{" "}
                  &ldquo;{c.title}&rdquo; at {c.startTime}&ndash;{c.endTime}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 mt-2">Conflicts are advisory — you can still proceed.</p>
          </div>
        )}
        {checking && (
          <p className="text-xs text-slate-400 italic">Checking for conflicts...</p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton
            type="submit"
            loading={submitting}
            disabled={!title || !date || !startTime || !endTime}
            variant="primary"
          >
            Create Meeting
          </SubmitButton>
          <button
            type="button"
            onClick={() => router.push("/faculty/meetings")}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
