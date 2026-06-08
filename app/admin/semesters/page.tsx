"use client"

import { useState } from "react"
import SubmitButton from "@/components/SubmitButton"
import { useApiGet, invalidate } from "@/lib/api/client"

// Type definitions (inlined for local use)
interface SemesterData {
  id: string
  title: string
  evalStartDate: string
  evalEndDate: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminSemestersPage() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  // Form States
  const [newTitle, setNewTitle] = useState("")
  const [newEvalStartDate, setNewEvalStartDate] = useState("")
  const [newEvalEndDate, setNewEvalEndDate] = useState("")
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editEvalStartDate, setEditEvalStartDate] = useState("")
  const [editEvalEndDate, setEditEvalEndDate] = useState("")

  // Activation State
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Data fetching: Fetch semesters
  const { data: semestersData, isLoading: semestersLoading, error: semestersErr } = useApiGet<{ data: SemesterData[] }>("/api/semesters")
  
  const semesters = semestersData?.data ?? []
  const loading = semestersLoading
  const fetchError = semestersErr

  // --- Handlers ---

  // Create handler — POST to /api/semesters
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newEvalStartDate) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          evalStartDate: newEvalStartDate,
          evalEndDate: newEvalEndDate || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      setNewTitle(""); setNewEvalStartDate(""); setNewEvalEndDate("")
      showSuccessMessage("Semester created!")
      invalidate("/api/semesters")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Update handler — PATCH to /api/semesters/[id]
  const handleUpdate = async (id: string) => {
    if (!editTitle || !editEvalStartDate) return
    setSaving(true); setError("")
    try {
      const res = await fetch(`/api/semesters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, evalStartDate: editEvalStartDate, evalEndDate: editEvalEndDate || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      setEditingId(null)
      showSuccessMessage("Semester updated!")
      invalidate("/api/semesters")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Delete handler — DELETE to /api/semesters/[id]
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this semester? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/semesters/${id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      showSuccessMessage("Semester deleted.")
      invalidate("/api/semesters")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Activate handler — POST to /api/semesters/[id]/activate
  const handleActivate = async (id: string) => {
    setActivatingId(id)
    try {
      const res = await fetch(`/api/semesters/${id}/activate`, { method: "POST" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      showSuccessMessage("Semester activated!")
      invalidate("/api/semesters")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActivatingId(null)
    }
  }

  // State/UI helpers
  const isSemesterActive = (semester: SemesterData) => semester.isActive
  const isEditing = editingId !== null
  
  if (loading) {
    return <div className="text-sm text-tertiary p-8">Loading semesters...</div>
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Academic Semesters</h1>
          <p className="text-xs sm:text-sm text-tertiary mt-0.5 sm:mt-1">
            Manage academic semesters used for the consulting cycles.
          </p>
        </div>
      </div>

      {(fetchError || error) && <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg">{fetchError || error}</p>}
      {success && <p className="text-xs font-medium text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}
      
      {/* Form Card: Create or Edit */}
      {isEditing ? (
        <div className="card p-6 bg-surface space-y-4 border border-amber-300">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-amber-700">Edit Semester Details</h2>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs text-tertiary hover:text-secondary font-semibold"
            >
              Cancel Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">Title</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. Fall 2025"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">Start Date</label>
              <input
                type="date"
                value={editEvalStartDate}
                onChange={(e) => setEditEvalStartDate(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={editEvalEndDate}
                onChange={(e) => setEditEvalEndDate(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Evaluation End Date"
              />
            </div>
          </div>
          <div>
            <SubmitButton type="button" loading={saving} variant="primary" onClick={() => handleUpdate(editingId!)}>
              Save Changes
            </SubmitButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="card p-6 bg-surface space-y-4">
          <h2 className="text-sm font-bold text-secondary">Add New Academic Semester</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. Spring 2025"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">Start Date</label>
              <input
                type="date"
                value={newEvalStartDate}
                onChange={(e) => setNewEvalStartDate(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={newEvalEndDate}
                onChange={(e) => setNewEvalEndDate(e.target.value)}
                className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Evaluation End Date"
              />
            </div>
          </div>
          <div>
            <SubmitButton type="submit" loading={saving} variant="primary">
              Create Semester
            </SubmitButton>
          </div>
        </form>
      )}
      
      {/* Directory */}
      <div className="card bg-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-default bg-surface">
          <h3 className="text-sm font-bold text-primary">Semesters Directory</h3>
        </div>
        {semesters.length === 0 ? (
          <p className="text-xs text-tertiary p-6">No semesters configured yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="desktop-only">
              <table className="w-full text-sm">
                <thead className="border-b border-default text-left text-xs font-semibold text-tertiary uppercase tracking-wider bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((semester) => (
                    <tr key={semester.id} className="border-b border-slate-50 hover:bg-surface-hover/70">
                      <td className="px-6 py-4 font-medium">{semester.title}</td>
                      <td className="px-6 py-4">{semester.evalStartDate}</td>
                      <td className="px-6 py-4">{semester.evalEndDate || <span className='text-tertiary'>N/A</span>}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                            isSemesterActive(semester)
                              ? "bg-green-50 text-green-600 border border-green-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {semester.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-3">
                        <button
                          onClick={() => setEditingId(semester.id)}
                          className="text-xs font-bold text-amber-500 hover:text-amber-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (!isSemesterActive(semester)) {
                              handleActivate(semester.id)
                            } else {
                              // For simplicity on this page, we only guarantee activation. Deactivation logic should be handled by a dedicated endpoint if needed.
                            }
                          }}
                          className={`text-xs font-bold ${
                            !isSemesterActive(semester) ? "text-green-600 hover:text-green-800" : "text-gray-400 cursor-default"
                          }`}
                          disabled={isSemesterActive(semester) && activatingId !== semester.id}
                        >
                          {isSemesterActive(semester) ? "Active" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(semester.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
            
            {/* Mobile cards */}
            <div className="mobile-only space-y-2 p-3">
              {semesters.map((semester) => {
                const isActive = semester.isActive
                return (
                  <div key={semester.id} className={`p-4 rounded-xl border ${isActive ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-bold text-primary">{semester.title}</p>
                        <p className="text-xs font-mono font-semibold text-tertiary">{semester.id}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                      }`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 mt-2">
                      <p className="text-tertiary">Period: {semester.evalStartDate} to {semester.evalEndDate || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setEditingId(semester.id)}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (!isActive) {
                            handleActivate(semester.id)
                          }
                        }}
                        className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                          !isActive ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={isActive && activatingId !== semester.id}
                      >
                        {isActive ? "Active" : "Activate"}
                      </button>
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => handleDelete(semester.id)}
                        className="w-full text-xs font-semibold text-red-500 hover:text-red-700 flex items-center justify-center gap-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}