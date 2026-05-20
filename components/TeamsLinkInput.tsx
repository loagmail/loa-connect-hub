"use client"

import { useState } from "react"

interface TeamsLinkInputProps {
  appointmentId: string
}

export function TeamsLinkInput({ appointmentId }: TeamsLinkInputProps) {
  const [teamsLink, setTeamsLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamsLink.trim()) return

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/teams-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamsLink }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Teams link added successfully!")
        setTeamsLink("")
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage(data.error || "Failed to add Teams link")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        value={teamsLink}
        onChange={(e) => setTeamsLink(e.target.value)}
        placeholder="https://teams.microsoft.com/l/meetup-join/..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      <button
        type="submit"
        disabled={loading || !teamsLink.trim()}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
      >
        {loading ? "Adding..." : "Add Link"}
      </button>
      {message && (
        <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  )
}
