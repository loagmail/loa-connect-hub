"use client"

import { useEffect, useState, useCallback } from "react"
import Skeleton from "@/components/Skeleton"
import SubmitButton from "@/components/SubmitButton"

interface UserRow {
  id: string
  email: string
  name?: string
  role?: string
}

interface Permission {
  resource_path: string
  grants: string[]
  denies: string[]
}

interface CatalogItem {
  path: string
  label: string
  description: string
}

interface Catalog {
  pages: Record<string, CatalogItem[]>
}

const PAGE_ACCESS: Record<string, string[]> = {
  ADMIN: [
    "/", "/admin", "/admin/data-management", "/admin/users", "/admin/users/deleted",
    "/admin/access-config", "/admin/user-permissions", "/admin/departments", "/admin/reports",
    "/admin/reports/health", "/admin/reports/demand", "/admin/reports/responsiveness",
    "/admin/reports/backlog", "/admin/reports/evaluation-results",
    "/admin/etl-hub", "/admin/evaluations",
    "/admin/evaluations/periods", "/admin/evaluations/periods/new",
    "/admin/data/users", "/admin/data/subjects", "/admin/data/sections",
    "/admin/data/faculty-mappings", "/admin/data/student-enrollments",
    "/admin/data/departments", "/admin/semesters",
    "/faq",
  ],
  DEAN: [
    "/", "/dean", "/dean/upload", "/dean/departments",
    "/dean/reports", "/dean/reports/evaluation-results",
    "/faculty/meetings", "/faculty/availability", "/faculty/reports", "/faq",
  ],
  FACULTY: [
    "/", "/faculty", "/faculty/meetings", "/faculty/availability", "/faculty/upload",
    "/faculty/evaluations/results", "/faq",
  ],
  STUDENT: [
    "/", "/student", "/student/book", "/student/meetings", "/student/history",
    "/student/evaluations", "/faq",
  ],
  GUEST: [],
}

function pageCategory(p: string): string {
  if (p === "/") return "General"
  if (p.startsWith("/api/")) return "API"
  if (p.startsWith("/admin")) return "Admin"
  if (p.startsWith("/student")) return "Student"
  if (p.startsWith("/faculty")) return "Faculty"
  if (p.startsWith("/dean")) return "Dean"
  if (p.startsWith("/faq")) return "Information"
  return "Other"
}

function pageLabel(p: string): string {
  const map: Record<string, string> = {
    "/": "Dashboard (root)",
    "/admin": "Admin Dashboard",
    "/admin/users": "Manage Users",
    "/admin/access-config": "Access Configuration",
    "/admin/user-permissions": "User Permissions",
    "/admin/data-management": "Data Management",
    "/admin/semesters": "Semesters",
    "/admin/reports/health": "Health Report",
    "/admin/reports/demand": "Demand Report",
    "/admin/reports/responsiveness": "Responsiveness Report",
    "/admin/reports/backlog": "Backlog Report",
    "/admin/reports/evaluation-results": "Evaluation Results",
    "/admin/etl-hub": "ETL Hub",
    "/admin/evaluations": "Evaluations",
    "/admin/evaluations/periods": "Evaluation Periods",
    "/admin/evaluations/periods/new": "New Period",
    "/admin/data/users": "Data Users",
    "/admin/data/subjects": "Data Subjects",
    "/admin/data/sections": "Data Sections",
    "/admin/data/faculty-mappings": "Faculty Mappings",
    "/admin/data/student-enrollments": "Student Enrollments",
    "/admin/data/departments": "Data Departments",
    "/student": "Student Dashboard",
    "/student/book": "Book Consultation",
    "/student/meetings": "Student Consultations",
    "/student/history": "Consultation History",
    "/faculty": "Faculty Dashboard",
    "/faculty/meetings": "Faculty Meetings",
    "/faculty/availability": "Availability Settings",
    "/faculty/upload": "Import Students",
    "/faculty/reports": "Department Reports",
    "/faculty/evaluations/results": "Evaluation Results",
    "/dean": "Dean Dashboard",
    "/dean/upload": "Import Users",
    "/dean/departments": "Departments",
    "/dean/reports": "Reports",
    "/dean/reports/evaluation-results": "Evaluation Results",
    "/faq": "FAQ",
    "/403": "Forbidden",
    "/api/import/students": "Import Students (API)",
    "/api/import/faculties": "Import Faculties (API)",
    "/api/import/preview": "Import Preview (API)",
  }
  return map[p] || p.split("/").filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ") || p
}

export default function UserPermissionsPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [allPaths, setAllPaths] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sidebarFilter, setSidebarFilter] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/access-config").then((r) => r.json()),
    ])
      .then(([usersData, configData]) => {
        setUsers(usersData)
        if (configData.catalog) setCatalog(configData.catalog)
        const groupedPages: string[] = []
        if (configData.catalog?.pages) {
          for (const items of Object.values(configData.catalog.pages) as CatalogItem[][]) {
            for (const item of items) {
              groupedPages.push(item.path)
            }
          }
        }
        const allRolePages = new Set<string>(groupedPages)
        for (const pages of Object.values(PAGE_ACCESS)) {
          for (const p of pages) allRolePages.add(p)
        }
        setAllPaths(Array.from(allRolePages).sort())
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const loadPermissions = useCallback(async (userId: string) => {
    const perms = await fetch(`/api/admin/user-permissions/${userId}`).then((r) => r.json())
    setPermissions(Array.isArray(perms) ? perms : [])
  }, [])

  const handleSelectUser = (user: UserRow) => {
    setSelectedUser(user)
    loadPermissions(user.id)
    setSaved(false)
  }

  const togglePermission = (path: string) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.resource_path === path)
      if (existing && existing.grants.includes("access")) {
        return prev.filter((p) => p.resource_path !== path)
      }
      const filtered = prev.filter((p) => p.resource_path !== path)
      return [...filtered, { resource_path: path, grants: ["access"], denies: [] }]
    })
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/user-permissions/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to save")
      }
    } finally {
      setSaving(false)
    }
  }

  const getEffectiveAccess = (path: string): "granted" | "denied" | "none" => {
    const perm = permissions.find((p) => p.resource_path === path)
    if (perm?.denies.includes("access")) return "denied"
    if (perm?.grants.includes("access")) return "granted"
    if (selectedUser?.role) {
      const role = getPrimaryRole(selectedUser.role)
      const rolePages = PAGE_ACCESS[role]
      if (rolePages?.some((p) => path === p || path.startsWith(p + "/"))) return "granted"
    }
    return "none"
  }

  const groupedPaths = allPaths.reduce<Record<string, string[]>>((acc, p) => {
    const cat = pageCategory(p)
    if (!acc[cat]) acc[cat] = []
    if (
      !sidebarFilter ||
      p.toLowerCase().includes(sidebarFilter.toLowerCase()) ||
      pageLabel(p).toLowerCase().includes(sidebarFilter.toLowerCase())
    ) {
      acc[cat].push(p)
    }
    return acc
  }, {})

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-primary">User Permissions</h1>
          <p className="text-xs text-tertiary mt-1">Manage per-user permission overrides.</p>
        </div>
        <Skeleton variant="card" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary">User Permissions</h1>
        <p className="text-xs text-tertiary mt-1">
          Grant or restrict access to specific paths for individual users.
          User-level overrides take highest priority, followed by role-based access config, then defaults.
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-72 shrink-0">
          <div className="card p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-secondary">Filter paths</label>
              <input
                type="text"
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Search paths..."
                className="input text-xs w-full mt-1 px-3 py-2 rounded-lg border border-strong"
              />
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-3">
              {Object.entries(groupedPaths).map(([category, paths]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1">{category}</p>
                  <div className="space-y-0.5">
                    {paths.map((path) => {
                      const perm = permissions.find((p) => p.resource_path === path)
                      const granted = perm?.grants.includes("access") ?? false
                      const effective = getEffectiveAccess(path)
                      return (
                        <label
                          key={path}
                          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs hover:bg-surface-hover ${
                            granted ? "bg-amber-50 dark:bg-amber-900/10" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={granted}
                            onChange={() => togglePermission(path)}
                            disabled={!selectedUser}
                            className="rounded border-strong text-gold-600 focus:ring-gold-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block truncate">{pageLabel(path)}</span>
                            <span className="block text-[10px] text-tertiary font-mono truncate">{path}</span>
                          </div>
                          {selectedUser && (
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-1.5 py-px rounded-full ${
                                effective === "granted"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : effective === "denied"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-surface text-tertiary"
                              }`}
                            >
                              {effective === "granted" ? "ON" : effective === "denied" ? "OFF" : "—"}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          <div className="card p-4">
            <label className="text-xs font-semibold text-secondary">Search user</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (selectedUser) {
                  setSelectedUser(null)
                  setPermissions([])
                  setSaved(false)
                }
              }}
              placeholder="Search by name or email..."
              className="input text-xs w-full mt-1 px-3 py-2 rounded-lg border border-strong"
            />
          </div>

          {!selectedUser && !search.trim() && (
            <p className="text-sm text-tertiary text-center py-8">
              Search for a user above, then toggle paths in the sidebar to grant or restrict access.
            </p>
          )}

          {!selectedUser && search.trim() && filteredUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-tertiary font-semibold">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
              </p>
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left card p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-xs text-tertiary ml-2">{user.email}</span>}
                      </div>
                      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedUser && search.trim() && filteredUsers.length === 0 && (
            <p className="text-sm text-tertiary text-center py-8">No users found matching &ldquo;{search}&rdquo;</p>
          )}

          {selectedUser && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setPermissions([])
                      setSaved(false)
                    }}
                    className="text-xs text-gold-600 hover:underline"
                  >
                    &larr; Back to search
                  </button>
                  <h3 className="text-sm font-semibold mt-2">{selectedUser.name || selectedUser.email}</h3>
                  {selectedUser.name && <p className="text-xs text-tertiary">{selectedUser.email}</p>}
                </div>
              </div>

              <div>
                <p className="text-xs text-tertiary">
                  <strong>Priority:</strong> Checked paths are explicitly granted to this user (Layer&nbsp;1),
                  overriding role-based access config (Layer&nbsp;2) and defaults (Layer&nbsp;3).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1 border-t border-default">
                {saved && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
                <SubmitButton
                  onClick={handleSave}
                  variant="primary"
                  className="text-xs font-semibold px-4 py-2 rounded-lg"
                  disabled={saving}
                >
                  {saving ? "Saving\u2026" : "Save Changes"}
                </SubmitButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getPrimaryRole(roles: string): string {
  if (!roles) return "GUEST"
  const ROLE_PRIORITY = ["ADMIN", "DEAN", "FACULTY", "STUDENT", "GUEST"]
  const userRoles = roles.split("|")
  for (const p of ROLE_PRIORITY) {
    if (userRoles.includes(p)) return p
  }
  return "GUEST"
}
