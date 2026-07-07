import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { supabase } from "@/lib/supabase"
import { clearAccessConfigCache } from "@/lib/access"

interface GroupRow {
  groupName: string
  pages: string[]
  api_overrides?: Record<string, Record<string, boolean>>
  updatedAt?: string
}

interface UserPermRow {
  user_id: string
  resource_path: string
  grants: string[]
  denies: string[]
}

interface ImportPayload {
  version?: number
  groups: GroupRow[]
  userPermissions: UserPermRow[]
}

const BUILT_IN = new Set(["ADMIN", "DEAN", "FACULTY", "STUDENT", "GUEST"])

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  let body: ImportPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!Array.isArray(body.groups)) {
    return NextResponse.json({ error: "groups must be an array" }, { status: 400 })
  }
  if (!Array.isArray(body.userPermissions)) {
    return NextResponse.json({ error: "userPermissions must be an array" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const groupsToUpsert = body.groups.map((g) => ({
    groupName: g.groupName.toUpperCase(),
    pages: g.pages ?? [],
    api_overrides: g.api_overrides ?? {},
    updatedAt: g.updatedAt ?? now,
  }))

  // Validate: built-in groups are required
  const groupNames = new Set(groupsToUpsert.map((g) => g.groupName))
  for (const name of BUILT_IN) {
    if (!groupNames.has(name)) {
      return NextResponse.json({
        error: `Missing required built-in group: ${name}`,
      }, { status: 400 })
    }
  }

  // 1. Replace all group_access records
  const { error: delGroupsErr } = await supabase.from("group_access").delete().neq("groupName", "__nonexistent__")
  if (delGroupsErr) {
    return NextResponse.json({ error: `Failed to clear groups: ${delGroupsErr.message}` }, { status: 500 })
  }

  const { error: insertGroupsErr } = await supabase.from("group_access").insert(groupsToUpsert)
  if (insertGroupsErr) {
    return NextResponse.json({ error: `Failed to insert groups: ${insertGroupsErr.message}` }, { status: 500 })
  }

  // 2. Replace all user_permissions records
  const { error: delPermsErr } = await supabase.from("user_permissions").delete().neq("id", 0)
  if (delPermsErr) {
    return NextResponse.json({ error: `Failed to clear user permissions: ${delPermsErr.message}` }, { status: 500 })
  }

  if (body.userPermissions.length > 0) {
    const permsToInsert = body.userPermissions.map((p) => ({
      user_id: p.user_id,
      resource_path: p.resource_path,
      grants: p.grants ?? [],
      denies: p.denies ?? [],
    }))

    const { error: insertPermsErr } = await supabase.from("user_permissions").insert(permsToInsert)
    if (insertPermsErr) {
      return NextResponse.json({ error: `Failed to insert user permissions: ${insertPermsErr.message}` }, { status: 500 })
    }
  }

  clearAccessConfigCache()

  return NextResponse.json({ success: true, importedGroups: groupsToUpsert.length, importedPermissions: body.userPermissions.length })
}
