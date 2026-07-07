import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { supabase } from "@/lib/supabase"
import { DEFAULT_CONFIG } from "@/lib/access"
import { DEFAULT_ROLE_PREFIXES } from "@/lib/default-access"

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const fetch = supabase.from("group_access").select("*").order("groupName")
  const [groupsRes, permsRes] = await Promise.all([
    fetch,
    supabase.from("user_permissions").select("*").order("user_id").order("resource_path"),
  ])

  if (groupsRes.error) {
    return NextResponse.json({ error: groupsRes.error.message }, { status: 500 })
  }
  if (permsRes.error) {
    return NextResponse.json({ error: permsRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    hardcodedDefaults: {
      rolePrefixes: DEFAULT_ROLE_PREFIXES,
      defaultConfig: DEFAULT_CONFIG,
    },
    groups: groupsRes.data || [],
    userPermissions: permsRes.data || [],
  })
}
