"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Skeleton from "@/components/Skeleton"
import SubmitButton from "@/components/SubmitButton"

interface GroupAccess {
  groupName: string
  pages: string[]
}

interface CatalogItem {
  path: string
  label: string
  description: string
}

interface Catalog {
  pages: Record<string, CatalogItem[]>
}

interface UserRow {
  id: string
  email: string
  name?: string
}

interface Permission {
  resource_path: string
  grants: string[]
  denies: string[]
}

const badgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  DEAN: "bg-amber-100 text-amber-700",
  FACULTY: "bg-emerald-100 text-emerald-700",
  STUDENT: "bg-blue-100 text-blue-700",
  GUEST: "bg-surface text-secondary",
}

const TABS = [
  { key: "rbac", label: "RBAC" },
  { key: "grants", label: "Grants" },
]

function AdminAccessConfigPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "rbac"

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary">Access Configuration</h1>
        <p className="text-xs text-tertiary mt-1">
          Manage role-based access and user-specific permission grants.
        </p>
      </div>

      <div className="flex gap-1 border-b border-default">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              router.push(tab.key === "rbac" ? "/admin/access-config" : "/admin/access-config?tab=grants")
            }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-gold-600 text-gold-600"
                : "border-transparent text-tertiary hover:text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "rbac" ? <RBACTab /> : <GrantsTab />}
    </div>
  )
}

function RBACTab() {
  const [groups, setGroups] = useState<GroupAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const loadGroups = () => {
    fetch("/api/admin/access-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.groups) setGroups(data.groups)
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadGroups()
    Promise.resolve().then(() => setLoading(false))
  }, [])

  const handleAddGroup = async () => {
    const name = newGroupName.trim()
    if (!name) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/access-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: name }),
      })
      if (res.ok) {
        setNewGroupName("")
        loadGroups()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to create group")
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg border border-default bg-surface">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddGroup()
            }
          }}
          placeholder="New group name (e.g. COORDINATOR)"
          className="input text-xs flex-1 min-w-0 px-3 py-2 rounded-lg border border-strong"
        />
        <button
          onClick={handleAddGroup}
          disabled={creating || !newGroupName.trim()}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {creating ? "Adding\u2026" : "Add Group"}
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-tertiary text-center py-8">No access groups found. Create one above.</p>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const badgeColor = badgeColors[group.groupName] || "bg-surface text-secondary"
          return (
            <Link
              key={group.groupName}
              href={`/admin/access-config/${group.groupName}`}
              className="block card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                    {group.groupName}
                  </span>
                  <span className="text-xs text-tertiary">Access Group</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-tertiary">
                  <span>{group.pages.length} pages</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function GrantsTab() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/access-config").then((r) => r.json()),
    ])
      .then(([usersData, configData]) => {
        setUsers(usersData)
        if (configData.catalog) setCatalog(configData.catalog)
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

  const loadPermissions = async (userId: string) => {
    const perms = await fetch(`/api/admin/user-permissions/${userId}`).then((r) => r.json())
    setPermissions(Array.isArray(perms) ? perms : [])
  }

  const handleSelectUser = (user: UserRow) => {
    setSelectedUser(user)
    loadPermissions(user.id)
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

  if (loading) {
    return <Skeleton variant="card" />
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-default bg-surface">
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
          placeholder="Search users by name or email..."
          className="input text-xs w-full px-3 py-2 rounded-lg border border-strong"
        />
      </div>

      {!selectedUser && !search.trim() && (
        <p className="text-sm text-tertiary text-center py-8">
          Search for a user above to configure their permission grants.
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
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <label className="block text-xs font-semibold text-secondary mb-2">Permission Overrides</label>
            {catalog && (
              <div className="space-y-1">
                {Object.entries(catalog.pages).map(([category, items]) => {
                  if (items.length === 0) return null
                  return (
                    <div key={category}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-1 mt-2 first:mt-0">
                        {category}
                      </p>
                      {items.map((item) => {
                        const perm = permissions.find((p) => p.resource_path === item.path)
                        const granted = perm?.grants.includes("access") ?? false
                        return (
                          <label
                            key={item.path}
                            className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface-hover cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={granted}
                              onChange={() => togglePermission(item.path)}
                              className="mt-0.5 rounded border-strong text-gold-600 focus:ring-gold-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span>{item.label}</span>
                                <span className="text-[10px] text-tertiary font-mono">{item.path}</span>
                              </div>
                              <p className="text-[10px] text-tertiary truncate">{item.description}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-tertiary mt-2">
              Checked = explicitly granted. Unchecked = no override (follows role-based access).
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
  )
}

export default function AdminAccessConfigPage() {
  return (
    <Suspense fallback={<Skeleton variant="card" />}>
      <AdminAccessConfigPageInner />
    </Suspense>
  )
}
