"use client"

import { useEffect, useState } from "react"
import SubmitButton from "@/components/SubmitButton"

interface DepartmentCourse {
  id: string
  departmentId: string
  name: string
  code: string
  createdAt: string
  department: { name: string; code: string }
}

interface Department {
  id: string
  name: string
  code: string
  deanId: string | null
}

export default function AdminDepartmentsPage() {
  const [courses, setCourses] = useState<DepartmentCourse[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newDeptId, setNewDeptId] = useState("")
  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [coursesRes, usersRes] = await Promise.all([
        fetch("/api/admin/department-courses"),
        fetch("/api/admin/users"),
      ])
      if (!coursesRes.ok) throw new Error("Failed to load courses")
      if (!usersRes.ok) throw new Error("Failed to load departments")
      const usersData = await usersRes.json()
      setCourses(await coursesRes.json())
      setDepartments(usersData.departments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const grouped = departments.map((dept) => ({
    ...dept,
    courses: courses.filter((c) => c.departmentId === dept.id),
  }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeptId || !newName || !newCode) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/department-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: newDeptId, name: newName, code: newCode }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add course")
      }
      setNewDeptId("")
      setNewName("")
      setNewCode("")
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this course?")) return
    try {
      const res = await fetch(`/api/admin/department-courses/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500 p-8">Loading departments...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Course Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage which courses are available per department for student imports and reporting.</p>
      </div>

      {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* Add Course Form */}
      <form onSubmit={handleAdd} className="card p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-slate-700">Add Course to Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400"
              required
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Course Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="e.g. Bachelor of Science in IT"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Course Code</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="e.g. BSIT"
              required
            />
          </div>
        </div>
        <div>
          <SubmitButton type="submit" loading={saving} variant="primary">Add Course</SubmitButton>
        </div>
      </form>

      {/* Department Courses List */}
      <div className="space-y-6">
        {grouped.map((dept) => (
          <div key={dept.id} className="card bg-white">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">{dept.name} ({dept.code})</h3>
            </div>
            {dept.courses.length === 0 ? (
              <p className="text-xs text-slate-400 px-6 py-4">No courses configured.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.courses.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-700">{c.code}</td>
                      <td className="px-6 py-3 text-slate-600">{c.name}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
