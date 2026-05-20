"use client"

import { useState, useEffect } from "react"

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  faculty?: { name: string }
}

export function BookingForm() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<string>("")
  const [booking, setBooking] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/schedules")
      const data = await res.json()
      setSchedules(data.schedules || [])
    } catch {
      setMessage("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async () => {
    if (!selectedSchedule) {
      setMessage("Please select a time slot")
      return
    }

    setBooking(true)
    setMessage("")

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: selectedSchedule }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Appointment requested successfully!")
        fetchSchedules()
        setSelectedSchedule("")
      } else {
        setMessage(data.error || "Failed to book appointment")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading available slots...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
          Select a time slot
        </label>
        <select
          id="schedule"
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Choose a slot --</option>
          {schedules
            .filter((s) => s.isAvailable)
            .map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.faculty?.name} - {schedule.date} {schedule.startTime}-{schedule.endTime}
              </option>
            ))}
        </select>
      </div>

      <button
        onClick={handleBook}
        disabled={booking || !selectedSchedule}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {booking ? "Booking..." : "Book Appointment"}
      </button>

      {message && (
        <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
