"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useApiGet, invalidate } from "@/lib/api/client"
import SubmitButton from "@/components/ui/SubmitButton"
import { SkeletonTable } from "@/components/ui/Skeleton"

// ── Shared Types ───────────────────────────────────────────────────────────

type MainTab = "departments" | "subjects" | "sections" | "faculty" | "enrollments" | "semesters"
type InfraTab = "departments" | "courses"

interface Subject {
  id: string; code: string; name: string
}

interface Section {
  id: string; name: string; program: string
}

interface FacultyMapping {
  id: string
  faculty: { id: string; name: string; email: string }
  subject: { id: string; code: string; name: string }
  section: { id: string; name: string; program: string }
}

interface Enrollment {
  id: string
  student: { id: string; name: string; email: string }
  section: { id: string; name: string; program: string }
  faculty_subject_id: string | null
  faculty_subject: FacultyMapping | null
}

interface DepartmentCourse {
  id: string; departmentId: string; name: string; code: string; createdAt: string
  department: { name: string; code: string }
}

interface Department {
  id: string; name: string; code: string; deanId: string | null; isDisabled: boolean
}

interface User {
  id: string; name: string; email: string; role: string
}

interface SemesterData {
  id: string; title: string; evalStartDate: string; evalEndDate: string | null; isActive: boolean; createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const tabClass = (active: boolean) =>
  `px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
    active ? "border-amber-500 text-amber-600" : "border-transparent text-tertiary hover:text-secondary"
  }`

const mainTabs: { key: MainTab; label: string }[] = [
  { key: "departments", label: "Departments & Courses" },
  { key: "subjects", label: "Subjects" },
  { key: "sections", label: "Sections" },
  { key: "faculty", label: "Faculty-Subject" },
  { key: "enrollments", label: "Student Enrollments" },
  { key: "semesters", label: "Semesters" },
]

// ── Components ─────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs px-3 py-2 rounded-lg border border-default bg-surface-hover focus:border-gold-500 outline-none transition-colors"
    />
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AcademicInfrastructurePage() {
  const [mainTab, setMainTab] = useState<MainTab>("departments")
  const [infraTab, setInfraTab] = useState<InfraTab>("departments")

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Academic Infrastructure</h1>
        <p className="text-xs sm:text-sm text-tertiary mt-0.5 sm:mt-1">
          Manage departments, courses, subjects, sections, faculty mappings, student enrollments, and semesters.
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-default overflow-x-auto">
        {mainTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setMainTab(t.key); setInfraTab("departments") }}
            className={tabClass(mainTab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Departments & Courses ─────────────────────────────────── */}
      {mainTab === "departments" && <DepartmentsCoursesTab infraTab={infraTab} setInfraTab={setInfraTab} />}

      {/* ── TAB: Subjects ──────────────────────────────────────────────── */}
      {mainTab === "subjects" && <SubjectsTab />}

      {/* ── TAB: Sections ─────────────────────────────────────────────── */}
      {mainTab === "sections" && <SectionsTab />}

      {/* ── TAB: Faculty-Subject ──────────────────────────────────────── */}
      {mainTab === "faculty" && <FacultyTab />}

      {/* ── TAB: Student Enrollments ──────────────────────────────────── */}
      {mainTab === "enrollments" && <EnrollmentsTab />}

      {/* ── TAB: Semesters ────────────────────────────────────────────── */}
      {mainTab === "semesters" && <SemestersTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS & COURSES TAB
// ══════════════════════════════════════════════════════════════════════════════

function DepartmentsCoursesTab({ infraTab, setInfraTab }: {
  infraTab: InfraTab; setInfraTab: (t: InfraTab) => void
}) {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  const [newDeptName, setNewDeptName] = useState("")
  const [newDeptCode, setNewDeptCode] = useState("")
  const [newDeptDeanId, setNewDeptDeanId] = useState("")
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null)
  const [editDeptName, setEditDeptName] = useState("")
  const [editDeptCode, setEditDeptCode] = useState("")
  const [editDeptDeanId, setEditDeptDeanId] = useState("")
  const [newCourseDeptId, setNewCourseDeptId] = useState("")
  const [newCourseName, setNewCourseName] = useState("")
  const [newCourseCode, setNewCourseCode] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: coursesData, isLoading: coursesLoading, error: coursesErr } = useApiGet<DepartmentCourse[]>("/api/admin/department-courses")
  const { data: usersData, isLoading: usersLoading, error: usersErr } = useApiGet<{ users: User[] }>("/api/admin/users")
  const { data: deptsData, isLoading: deptsLoading, error: deptsErr } = useApiGet<Department[]>("/api/admin/departments")

  const courses = coursesData ?? []
  const departments = deptsData ?? []
  const users = usersData?.users ?? []
  const loading = coursesLoading || usersLoading || deptsLoading
  const fetchError = coursesErr || usersErr || deptsErr

  const refresh = () => {
    invalidate("/api/admin/department-courses", "/api/admin/users", "/api/admin/departments")
  }

  const deans = users.filter((u) => u.role.split("|").includes("DEAN"))

  const grouped = departments.map((dept) => ({
    ...dept,
    courses: courses.filter((c) => c.departmentId === dept.id),
  }))

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeptName || !newDeptCode) return
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName, code: newDeptCode, deanId: newDeptDeanId || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add department") }
      setNewDeptName(""); setNewDeptCode(""); setNewDeptDeanId("")
      showSuccessMessage("Department successfully created!")
      await refresh()
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  const handleEditDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDeptId || !editDeptName || !editDeptCode) return
    setSaving(true); setError("")
    try {
      const res = await fetch(`/api/admin/departments/${editingDeptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editDeptName, code: editDeptCode, deanId: editDeptDeanId || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update department") }
      setEditingDeptId(null)
      showSuccessMessage("Department successfully updated!")
      await refresh()
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  const handleToggleStatus = async (dept: Department) => {
    setError("")
    try {
      const res = await fetch(`/api/admin/departments/${dept.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: !dept.isDisabled }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update status") }
      showSuccessMessage(`Department is now ${!dept.isDisabled ? "disabled" : "enabled"}!`)
      await refresh()
    } catch (err) { setError((err as Error).message) }
  }

  const startEditing = (dept: Department) => {
    setEditingDeptId(dept.id)
    setEditDeptName(dept.name)
    setEditDeptCode(dept.code)
    setEditDeptDeanId(dept.deanId || "")
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseDeptId || !newCourseName || !newCourseCode) return
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/admin/department-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: newCourseDeptId, name: newCourseName, code: newCourseCode }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add course") }
      setNewCourseDeptId(""); setNewCourseName(""); setNewCourseCode("")
      showSuccessMessage("Course successfully added to department!")
      await refresh()
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Remove this course?")) return
    try {
      const res = await fetch(`/api/admin/department-courses/${id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete") }
      showSuccessMessage("Course successfully removed!")
      await refresh()
    } catch (err) { setError((err as Error).message) }
  }

  if (loading) {
    return <div className="text-sm text-tertiary p-8">Loading departments and courses...</div>
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {(fetchError?.message || error) && (
        <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg">{fetchError?.message || error}</p>
      )}
      {success && <p className="text-xs font-medium text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

      {/* Sub-tabs */}
      <div className="flex border-b border-default overflow-x-auto">
        <button onClick={() => { setInfraTab("departments"); setError("") }} className={tabClass(infraTab === "departments")}>
          Departments Management
        </button>
        <button onClick={() => { setInfraTab("courses"); setError("") }} className={tabClass(infraTab === "courses")}>
          Courses Mapping
        </button>
      </div>

      {/* ── Departments Sub-tab ──────────────────────────────────────────── */}
      {infraTab === "departments" && (
        <div className="space-y-8">
          {editingDeptId ? (
            <form onSubmit={handleEditDeptSubmit} className="card p-6 bg-surface space-y-4 border border-amber-300">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-amber-700">Edit Department Details</h2>
                <button type="button" onClick={() => setEditingDeptId(null)} className="text-xs text-tertiary hover:text-secondary font-semibold">Cancel Edit</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Department Name</label>
                  <input value={editDeptName} onChange={(e) => setEditDeptName(e.target.value)} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. College of Engineering" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Code</label>
                  <input value={editDeptCode} onChange={(e) => setEditDeptCode(e.target.value.toUpperCase())} maxLength={10} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. COE" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Assigned Dean</label>
                  <select value={editDeptDeanId} onChange={(e) => setEditDeptDeanId(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">Unassigned</option>
                    {deans.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.email})</option>))}
                  </select>
                </div>
              </div>
              <div><SubmitButton type="submit" loading={saving} variant="primary">Save Changes</SubmitButton></div>
            </form>
          ) : (
            <form onSubmit={handleAddDept} className="card p-6 bg-surface space-y-4">
              <h2 className="text-sm font-bold text-secondary">Add New Academic Department</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Department Name</label>
                  <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. College of Liberal Arts" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Code</label>
                  <input value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())} maxLength={10} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. CLA" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tertiary mb-1">Assigned Dean (Optional)</label>
                  <select value={newDeptDeanId} onChange={(e) => setNewDeptDeanId(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">Select Dean...</option>
                    {deans.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.email})</option>))}
                  </select>
                </div>
              </div>
              <div><SubmitButton type="submit" loading={saving} variant="primary">Create Department</SubmitButton></div>
            </form>
          )}

          <div className="card bg-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-default bg-surface"><h3 className="text-sm font-bold text-primary">Departments Directory</h3></div>
            {departments.length === 0 ? (
              <p className="text-xs text-tertiary p-6">No departments configured yet.</p>
            ) : (
              <>
                <div className="desktop-only">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default text-left text-xs font-semibold text-tertiary uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Department Name</th>
                        <th className="px-6 py-3">Dean Assigned</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) => {
                        const assignedDean = users.find((u) => u.id === dept.deanId)
                        return (
                          <tr key={dept.id} className="border-b border-slate-50 hover:bg-surface-hover/70">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-secondary">{dept.code}</td>
                            <td className="px-6 py-4 text-primary font-medium">{dept.name}</td>
                            <td className="px-6 py-4 text-secondary">
                              {assignedDean ? (
                                <div><p className="font-semibold text-primary">{assignedDean.name}</p><p className="text-xs text-tertiary">{assignedDean.email}</p></div>
                              ) : (<span className="text-xs italic text-tertiary">No dean assigned</span>)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${dept.isDisabled ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
                                {dept.isDisabled ? "Disabled" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 space-x-3">
                              <button onClick={() => startEditing(dept)} className="text-xs font-bold text-amber-500 hover:text-amber-700">Edit</button>
                              <button onClick={() => handleToggleStatus(dept)} className={`text-xs font-bold ${dept.isDisabled ? "text-green-600 hover:text-green-800" : "text-red-500 hover:text-red-700"}`}>
                                {dept.isDisabled ? "Enable" : "Disable"}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-only space-y-2 p-3">
                  {departments.map((dept) => {
                    const assignedDean = users.find((u) => u.id === dept.deanId)
                    return (
                      <div key={dept.id} className="p-4 rounded-xl bg-surface border border-default space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-sm font-bold text-primary">{dept.name}</p><p className="text-xs font-mono font-semibold text-tertiary">{dept.code}</p></div>
                          <span className={`shrink-0 inline-flex px-2 py-1 text-[10px] font-bold rounded-full ${dept.isDisabled ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
                            {dept.isDisabled ? "Disabled" : "Active"}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-tertiary">Dean: </span>
                          {assignedDean ? (<span className="text-secondary">{assignedDean.name} <span className="text-tertiary">({assignedDean.email})</span></span>) : (<span className="italic text-tertiary">Not assigned</span>)}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => startEditing(dept)} className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">Edit</button>
                          <button onClick={() => handleToggleStatus(dept)} className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${dept.isDisabled ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}>
                            {dept.isDisabled ? "Enable" : "Disable"}
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
      )}

      {/* ── Courses Sub-tab ──────────────────────────────────────────────── */}
      {infraTab === "courses" && (
        <div className="space-y-8">
          <form onSubmit={handleAddCourse} className="card p-6 bg-surface space-y-4">
            <h2 className="text-sm font-bold text-secondary">Add Course to Department</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Department</label>
                <select value={newCourseDeptId} onChange={(e) => setNewCourseDeptId(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
                  <option value="">Select department...</option>
                  {departments.filter((d) => !d.isDisabled).map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.code})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Course Name</label>
                <input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. Bachelor of Science in IT" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Course Code</label>
                <input value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())} maxLength={10} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. BSIT" required />
              </div>
            </div>
            <div><SubmitButton type="submit" loading={saving} variant="primary">Add Course</SubmitButton></div>
          </form>

          <div className="space-y-6">
            {grouped.map((dept) => (
              <div key={dept.id} className={`card bg-surface ${dept.isDisabled ? "opacity-60" : ""}`}>
                <div className="px-4 sm:px-6 py-4 border-b border-default flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-primary">{dept.name} ({dept.code})</h3>
                  {dept.isDisabled && (<span className="self-start sm:self-auto text-xs text-red-500 font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Dept Disabled</span>)}
                </div>
                {dept.courses.length === 0 ? (
                  <p className="text-xs text-tertiary px-6 py-4">No courses configured.</p>
                ) : (
                  <>
                    <div className="desktop-only">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-default text-left text-xs font-semibold text-tertiary uppercase tracking-wider">
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.courses.map((c) => (
                            <tr key={c.id} className="border-b border-slate-50 hover:bg-surface-hover">
                              <td className="px-6 py-3 font-mono text-xs font-semibold text-secondary">{c.code}</td>
                              <td className="px-6 py-3 text-secondary">{c.name}</td>
                              <td className="px-6 py-3">
                                <button onClick={() => handleDeleteCourse(c.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mobile-only space-y-2 p-3">
                      {dept.courses.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-default">
                          <div><p className="text-xs font-semibold text-secondary font-mono">{c.code}</p><p className="text-xs text-secondary">{c.name}</p></div>
                          <button onClick={() => handleDeleteCourse(c.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-2">Remove</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SUBJECTS TAB
// ══════════════════════════════════════════════════════════════════════════════

function SubjectsTab() {
  const [data, setData] = useState<Subject[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) { setLoading(true); setError("") }
    try {
      const res = await fetch("/api/data/evaluation-mappings?type=subjects")
      if (!res.ok) throw new Error("Failed to load subjects")
      const json = await res.json()
      setData(json.data)
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { Promise.resolve().then(() => fetchData()) }, [fetchData])

  const filtered = data?.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="card p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by code or name..." />
        <div className="overflow-x-auto border border-default rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-surface-dim text-left text-[10px] font-bold text-tertiary uppercase tracking-wider border-b border-default">
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={2} className="p-4 text-center text-xs text-tertiary">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={2} className="p-4 text-center text-xs text-tertiary">No subjects found.</td></tr>
              ) : (
                filtered?.map((s) => (
                  <tr key={s.id} className="border-b border-default hover:bg-surface-hover">
                    <td className="p-2 font-medium text-secondary">{s.code}</td>
                    <td className="p-2 text-tertiary">{s.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <p className="text-xs text-tertiary">{data.length} subject{data.length !== 1 ? "s" : ""}</p>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTIONS TAB
// ══════════════════════════════════════════════════════════════════════════════

function SectionsTab() {
  const [data, setData] = useState<Section[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) { setLoading(true); setError("") }
    try {
      const res = await fetch("/api/data/evaluation-mappings?type=sections")
      if (!res.ok) throw new Error("Failed to load sections")
      const json = await res.json()
      setData(json.data)
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { Promise.resolve().then(() => fetchData()) }, [fetchData])

  const filtered = data?.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.program.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="card p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by program or name..." />
        <div className="overflow-x-auto border border-default rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-surface-dim text-left text-[10px] font-bold text-tertiary uppercase tracking-wider border-b border-default">
                <th className="p-2">Program</th>
                <th className="p-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={2} className="p-4 text-center text-xs text-tertiary">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={2} className="p-4 text-center text-xs text-tertiary">No sections found.</td></tr>
              ) : (
                filtered?.map((s) => (
                  <tr key={s.id} className="border-b border-default hover:bg-surface-hover">
                    <td className="p-2 font-medium text-secondary">{s.program}</td>
                    <td className="p-2 text-secondary">{s.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <p className="text-xs text-tertiary">{data.length} section{data.length !== 1 ? "s" : ""}</p>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  FACULTY-SUBJECT TAB
// ══════════════════════════════════════════════════════════════════════════════

function FacultyTab() {
  const [data, setData] = useState<FacultyMapping[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [formFaculty, setFormFaculty] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formSection, setFormSection] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) { setLoading(true); setError("") }
    try {
      const res = await fetch("/api/data/evaluation-mappings?type=faculty")
      if (!res.ok) throw new Error("Failed to load faculty-subject mappings")
      const json = await res.json()
      setData(json.data)
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { Promise.resolve().then(() => fetchData()) }, [fetchData])

  const { data: allUsers } = useApiGet<{ users: { id: string; name: string; email: string; role: string }[] }>("/api/admin/users")
  const { data: subjectsData } = useApiGet<{ data: Subject[] }>("/api/data/evaluation-mappings?type=subjects")
  const { data: sectionsData } = useApiGet<{ data: Section[] }>("/api/data/evaluation-mappings?type=sections")

  const faculties = (allUsers?.users ?? []).filter((u) => u.role?.split("|").includes("FACULTY") && !u.role?.split("|").includes("ADMIN"))
  const subjects = subjectsData?.data ?? []
  const sections = sectionsData?.data ?? []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formFaculty || !formSubject || !formSection) return
    setFormSaving(true); setFormError(""); setFormSuccess("")
    try {
      const res = await fetch("/api/admin/faculty-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faculty_id: formFaculty, subject_id: formSubject, section_id: formSection }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add mapping") }
      setFormFaculty(""); setFormSubject(""); setFormSection("")
      setFormSuccess("Mapping added!")
      setTimeout(() => setFormSuccess(""), 3000)
      fetchData(true)
    } catch (err) { setFormError((err as Error).message) }
    finally { setFormSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this faculty-subject mapping?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/faculty-subjects/${id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete") }
      fetchData(true)
    } catch (err) { setError((err as Error).message) }
    finally { setDeleting(null) }
  }

  const filtered = data?.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.faculty.name.toLowerCase().includes(q) ||
      m.faculty.email.toLowerCase().includes(q) ||
      m.subject.code.toLowerCase().includes(q) ||
      m.subject.name.toLowerCase().includes(q) ||
      `${m.section.program}-${m.section.name}`.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {/* Add Form */}
      <form onSubmit={handleAdd} className="card p-4 sm:p-6 bg-surface space-y-4">
        <h2 className="text-sm font-bold text-secondary">Add Faculty-Subject Mapping</h2>
        {formError && <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
        {formSuccess && <p className="text-xs font-medium text-green-600 bg-green-50 p-2 rounded">{formSuccess}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Faculty</label>
            <select value={formFaculty} onChange={(e) => setFormFaculty(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
              <option value="">Select faculty...</option>
              {faculties.map((f) => (<option key={f.id} value={f.id}>{f.name} ({f.email})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Subject</label>
            <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
              <option value="">Select subject...</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.code} - {s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Section</label>
            <select value={formSection} onChange={(e) => setFormSection(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
              <option value="">Select section...</option>
              {sections.map((s) => (<option key={s.id} value={s.id}>{s.program} - {s.name}</option>))}
            </select>
          </div>
        </div>
        <div><SubmitButton type="submit" loading={formSaving} variant="primary">Add Mapping</SubmitButton></div>
      </form>

      <div className="card p-4 sm:p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by faculty name, email, subject code, or section..." />
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-default rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-surface-dim text-left text-[10px] font-bold text-tertiary uppercase tracking-wider border-b border-default sticky top-0">
                <th className="p-2">Faculty</th>
                <th className="p-2">Email</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Section</th>
                <th className="p-2 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={5} className="p-4"><SkeletonTable rows={4} cols={4} /></td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-xs text-tertiary">No mappings found.</td></tr>
              ) : (
                filtered?.map((m) => (
                  <tr key={m.id} className="border-b border-default hover:bg-surface-hover">
                    <td className="p-2 font-medium text-secondary">{m.faculty.name}</td>
                    <td className="p-2 text-tertiary">{m.faculty.email}</td>
                    <td className="p-2">
                      <span className="font-medium text-secondary">{m.subject.code}</span>
                      <span className="text-tertiary ml-1">{m.subject.name}</span>
                    </td>
                    <td className="p-2 text-secondary">{m.section.program}-{m.section.name}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        {deleting === m.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <p className="text-xs text-tertiary">{data.length} mapping{data.length !== 1 ? "s" : ""}</p>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  STUDENT ENROLLMENTS TAB
// ══════════════════════════════════════════════════════════════════════════════

function EnrollmentsTab() {
  const [data, setData] = useState<Enrollment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [deleting, setDeleting] = useState<string | null>(null)

  // ── CSV Import state ─────────────────────────────────────
  const [csvFsId, setCsvFsId] = useState("")
  const [csvRows, setCsvRows] = useState<{ name: string; email: string }[] | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvImportResult, setCsvImportResult] = useState<{ matched: number; created: number; errors: { row: number; email: string; message: string }[] } | null>(null)
  const [csvError, setCsvError] = useState("")

  // ── Quick Add state ──────────────────────────────────────
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formFsId, setFormFsId] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const fetchData = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) { setLoading(true); setError("") }
    try {
      const res = await fetch("/api/data/evaluation-mappings?type=student")
      if (!res.ok) throw new Error("Failed to load student enrollments")
      const json = await res.json()
      setData(json.data)
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { Promise.resolve().then(() => fetchData()) }, [fetchData])

  const { data: fsData } = useApiGet<{ data: FacultyMapping[] }>("/api/data/evaluation-mappings?type=faculty")
  const facultySubjects = fsData?.data ?? []

  // ── CSV handlers ─────────────────────────────────────────

  const handleCsvFile = (file: File) => {
    setCsvImportResult(null)
    setCsvError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
      if (lines.length < 2) {
        setCsvError("CSV must have a header row and at least one data row")
        return
      }
      const header = lines[0].toLowerCase().replace(/"/g, "")
      if (!header.includes("student name") || !header.includes("email")) {
        setCsvError('CSV must have columns: "student name", "email"')
        return
      }
      const nameIdx = header.split(",").findIndex((c) => c.trim() === "student name")
      const emailIdx = header.split(",").findIndex((c) => c.trim() === "email")
      if (nameIdx === -1 || emailIdx === -1) {
        setCsvError('CSV must have columns: "student name", "email"')
        return
      }
      const parsed: { name: string; email: string }[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",")
        const name = (cols[nameIdx] ?? "").trim()
        const email = (cols[emailIdx] ?? "").trim().toLowerCase()
        parsed.push({ name, email })
      }
      setCsvRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = async () => {
    if (!csvFsId || !csvRows || csvRows.length === 0) return
    setCsvImporting(true); setCsvImportResult(null); setCsvError("")
    try {
      const res = await fetch("/api/admin/student-enrollments/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faculty_subject_id: csvFsId, rows: csvRows }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Import failed") }
      const result = await res.json()
      setCsvImportResult(result)
      if (result.matched > 0 || result.created > 0) {
        setCsvRows(null)
        setCsvFsId("")
        fetchData(true)
      }
    } catch (err) { setCsvError((err as Error).message) }
    finally { setCsvImporting(false) }
  }

  // ── Quick Add handlers ───────────────────────────────────

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formEmail || !formFsId) return
    setFormSaving(true); setFormError(""); setFormSuccess("")
    try {
      const res = await fetch("/api/admin/student-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, faculty_subject_id: formFsId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add enrollment") }
      setFormName(""); setFormEmail(""); setFormFsId(""); setShowQuickAdd(false)
      setFormSuccess("Enrollment added!")
      setTimeout(() => setFormSuccess(""), 3000)
      fetchData(true)
    } catch (err) { setFormError((err as Error).message) }
    finally { setFormSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this enrollment?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/student-enrollments/${id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete") }
      fetchData(true)
    } catch (err) { setError((err as Error).message) }
    finally { setDeleting(null) }
  }

  const filtered = data?.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.student.name.toLowerCase().includes(q) ||
      m.student.email.toLowerCase().includes(q) ||
      `${m.section.program}-${m.section.name}`.toLowerCase().includes(q) ||
      (m.faculty_subject?.subject.code ?? "").toLowerCase().includes(q) ||
      (m.faculty_subject?.subject.name ?? "").toLowerCase().includes(q) ||
      (m.faculty_subject?.faculty.name ?? "").toLowerCase().includes(q)
    )
  })

  const domainOk = (email: string) => email.endsWith("@itmlyceumalabang.onmicrosoft.com")

  return (
    <div className="space-y-6">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {/* ═══════════════════════════════════════════════════
          CSV BULK IMPORT
         ═══════════════════════════════════════════════════ */}
      <div className="card p-4 sm:p-6 bg-surface space-y-4">
        <h2 className="text-sm font-bold text-secondary">Bulk Import via CSV</h2>
        <p className="text-xs text-tertiary">Upload a CSV file with student name and email columns. All rows will be enrolled in the selected faculty-subject-section.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-tertiary mb-1">Faculty Subject Section</label>
            <select value={csvFsId} onChange={(e) => setCsvFsId(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
              <option value="">Select faculty-subject-section...</option>
              {facultySubjects.map((fs) => (
                <option key={fs.id} value={fs.id}>
                  {fs.section.program} {fs.section.name} - {fs.subject.code} : {fs.subject.name} ({fs.faculty.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <a
              href="/api/admin/student-enrollments/csv"
              download="enrollment_template.csv"
              className="inline-block text-xs font-semibold text-amber-600 hover:text-amber-800 underline"
            >
              Download Template
            </a>
          </div>
        </div>

        {/* File upload */}
        <label className="block cursor-pointer border-2 border-dashed border-strong rounded-lg p-6 text-center hover:bg-surface-hover transition-colors">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f) }}
          />
          <span className="text-xs text-tertiary">
            {csvRows ? `${csvRows.length} row${csvRows.length !== 1 ? "s" : ""} parsed` : "Click to select a CSV file"}
          </span>
        </label>

        {csvError && <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded">{csvError}</p>}
        {csvImportResult && (
          <div className="text-xs space-y-1 p-2 rounded bg-surface-dim">
            <p className="text-green-700 font-semibold">{csvImportResult.matched} enrolled, {csvImportResult.created} new users created</p>
            {csvImportResult.errors.length > 0 && (
              <div className="mt-1">
                <p className="text-red-600 font-semibold">{csvImportResult.errors.length} error{csvImportResult.errors.length !== 1 ? "s" : ""}:</p>
                {csvImportResult.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-red-500 ml-2">Row {e.row}: {e.email} — {e.message}</p>
                ))}
                {csvImportResult.errors.length > 5 && <p className="text-tertiary ml-2">...and {csvImportResult.errors.length - 5} more</p>}
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {csvRows && csvRows.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto max-h-48 overflow-y-auto border border-default rounded-lg">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-surface-dim text-left text-[10px] font-bold text-tertiary uppercase tracking-wider border-b border-default sticky top-0">
                    <th className="p-2">#</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((row, i) => {
                    const valid = row.name && domainOk(row.email)
                    return (
                      <tr key={i} className="border-b border-default hover:bg-surface-hover">
                        <td className="p-2 text-tertiary">{i + 1}</td>
                        <td className={`p-2 text-secondary ${!row.name ? "text-red-500" : ""}`}>{row.name || <span className="italic">missing</span>}</td>
                        <td className={`p-2 ${domainOk(row.email) ? "text-secondary" : "text-red-500"}`}>{row.email || <span className="italic">missing</span>}</td>
                        <td className="p-2">{valid ? <span className="text-green-600 font-bold">&#10003;</span> : <span className="text-red-500">&#10007;</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3">
              <SubmitButton onClick={handleCsvImport} loading={csvImporting} variant="primary" disabled={!csvFsId}>Import {csvRows.length} Student{csvRows.length !== 1 ? "s" : ""}</SubmitButton>
              <button onClick={() => { setCsvRows(null); setCsvImportResult(null); setCsvError("") }} className="text-xs font-semibold text-tertiary hover:text-secondary">Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          QUICK ADD (single student)
         ═══════════════════════════════════════════════════ */}
      <div className="card p-4 sm:p-6 bg-surface space-y-3">
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-bold text-secondary">Quick Add Single Student</h2>
          <span className="text-xs text-tertiary">{showQuickAdd ? "▲" : "▼"}</span>
        </button>
        {showQuickAdd && (
          <form onSubmit={handleQuickAdd} className="space-y-4">
            {formError && <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded">{formError}</p>}
            {formSuccess && <p className="text-xs font-medium text-green-600 bg-green-50 p-2 rounded">{formSuccess}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Student Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Student Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. juan@example.com" className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-tertiary mb-1">Faculty Subject Section</label>
                <select value={formFsId} onChange={(e) => setFormFsId(e.target.value)} className="w-full text-sm bg-surface border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required>
                  <option value="">Select faculty-subject-section...</option>
                  {facultySubjects.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.section.program} {fs.section.name} - {fs.subject.code} : {fs.subject.name} ({fs.faculty.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <SubmitButton type="submit" loading={formSaving} variant="primary">Add Enrollment</SubmitButton>
          </form>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          ENROLLMENT TABLE
         ═══════════════════════════════════════════════════ */}
      <div className="card p-4 sm:p-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by student name, email, section, subject, or faculty..." />
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-default rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-surface-dim text-left text-[10px] font-bold text-tertiary uppercase tracking-wider border-b border-default sticky top-0">
                <th className="p-2">Student</th>
                <th className="p-2">Email</th>
                <th className="p-2">Section</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Faculty</th>
                <th className="p-2 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={6} className="p-4"><SkeletonTable rows={4} cols={5} /></td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-xs text-tertiary">No enrollments found.</td></tr>
              ) : (
                filtered?.map((m) => (
                  <tr key={m.id} className="border-b border-default hover:bg-surface-hover">
                    <td className="p-2 font-medium text-secondary">{m.student.name}</td>
                    <td className="p-2 text-tertiary">{m.student.email}</td>
                    <td className="p-2 text-secondary">{m.section.program}-{m.section.name}</td>
                    <td className="p-2">
                      {m.faculty_subject ? (
                        <><span className="font-medium text-secondary">{m.faculty_subject.subject.code}</span><span className="text-tertiary ml-1">{m.faculty_subject.subject.name}</span></>
                      ) : (
                        <span className="text-tertiary italic">—</span>
                      )}
                    </td>
                    <td className="p-2 text-secondary">{m.faculty_subject?.faculty.name ?? <span className="text-tertiary italic">—</span>}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        {deleting === m.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <p className="text-xs text-tertiary">{data.length} enrollment{data.length !== 1 ? "s" : ""}</p>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SEMESTERS TAB
// ══════════════════════════════════════════════════════════════════════════════

function SemestersTab() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 4000)
  }

  const [newTitle, setNewTitle] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editIsActive, setEditIsActive] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: semestersData, isLoading: semestersLoading, error: semestersErr } = useApiGet<{ data: SemesterData[] }>("/api/semesters")

  const semesters = semestersData?.data ?? []
  const loading = semestersLoading
  const fetchError = semestersErr

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle) return
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      setNewTitle("")
      showSuccessMessage("Semester created!")
      invalidate("/api/semesters")
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id: string) => {
    if (!editTitle) return
    setSaving(true); setError("")
    try {
      const res = await fetch(`/api/semesters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, isActive: editIsActive }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      setEditingId(null)
      showSuccessMessage("Semester updated!")
      invalidate("/api/semesters")
    } catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  const isEditing = editingId !== null
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEditing) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setEditingId(null) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setEditingId(null)
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [isEditing])

  if (loading) return <div className="text-sm text-tertiary p-8">Loading semesters...</div>

  return (
    <div className="space-y-6">
      {(fetchError || error) && <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg">{(fetchError || error)?.message || (fetchError || error)}</p>}
      {success && <p className="text-xs font-medium text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

      <form onSubmit={handleCreate} className="card p-6 bg-surface space-y-4">
        <h2 className="text-sm font-bold text-secondary">Add New Academic Semester</h2>
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">Semester Name</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. 1st Semester A.Y. 2025-2026"
            required
          />
        </div>
        <p className="text-[11px] text-tertiary">
          Dates and activation are configured on the <strong>Evaluation Periods</strong> page. New semesters start as inactive.
        </p>
        <div><SubmitButton type="submit" loading={saving} variant="primary">Create Semester</SubmitButton></div>
      </form>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-primary">Edit Semester</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tertiary mb-1">Semester Name</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-sm border border-strong rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm font-medium text-primary">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-secondary hover:bg-slate-50 transition-colors">Cancel</button>
              <SubmitButton type="button" loading={saving} variant="primary" onClick={() => handleUpdate(editingId!)}>Save Changes</SubmitButton>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-default bg-surface"><h3 className="text-sm font-bold text-primary">Semesters Directory</h3></div>
        {semesters.length === 0 ? (
          <p className="text-xs text-tertiary p-6">No semesters configured yet.</p>
        ) : (
          <>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${semester.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                          {semester.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <SubmitButton
                          onClick={() => { setEditTitle(semester.title); setEditIsActive(semester.isActive); setEditingId(semester.id) }}
                          variant="primary" className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                        >
                          Edit
                        </SubmitButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-only space-y-2 p-3">
              {semesters.map((semester) => (
                <div key={semester.id} className={`p-4 rounded-xl border ${semester.isActive ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div><p className="text-sm font-bold text-primary">{semester.title}</p><p className="text-xs font-mono font-semibold text-tertiary">{semester.id}</p></div>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${semester.isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                      {semester.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 mt-2">
                    <p className="text-tertiary">Period: {semester.evalStartDate} to {semester.evalEndDate || 'N/A'}</p>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => { setEditTitle(semester.title); setEditIsActive(semester.isActive); setEditingId(semester.id) }} className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
