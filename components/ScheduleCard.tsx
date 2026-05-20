"use client"

import { useState } from "react"

interface ScheduleCardProps {
  schedule: {
    id: string
    date: string
    startTime: string
    endTime: string
    isAvailable: boolean
    faculty?: { name: string }
  }
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleBook = async () => {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Appointment requested successfully!")
      } else {
        setMessage(data.error || "Failed to book appointment")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
      <div className="space-y-2">
        {schedule.faculty && (
          <p className="text-sm font-medium text-gray-700">
            {schedule.faculty.name}
          </p>
        )}
        <p className="text-lg font-semibold text-gray-900">{schedule.date}</p>
        <p className="text-gray-600">
          {schedule.startTime} - {schedule.endTime}
        </p>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          schedule.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {schedule.isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      {schedule.isAvailable && (
        <button
          onClick={handleBook}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      )}

      {message && (
        <p className={`mt-2 text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
