import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { loadAccessConfig } from "@/lib/access"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ pages: [] })
  }

  const su = session.user as Record<string, unknown>
  const role = su.role as string
  const userId = su.id as string

  const config = await loadAccessConfig()

  // Collect pages from ALL user roles, not just the primary one
  const pages = new Set<string>()
  const roleList = role.split("|")
  for (const r of roleList) {
    if (config[r]?.pages) {
      for (const p of config[r].pages) pages.add(p)
    }
  }

  // Merge in user-level grants (Layer 1 overrides)
  try {
    const { data: perms } = await supabase
      .from('user_permissions')
      .select('resource_path')
      .eq('user_id', userId)

    if (perms) {
      for (const p of perms) {
        pages.add(p.resource_path)
      }
    }
  } catch {
    // Non-fatal — show role-based pages at minimum
  }

  return NextResponse.json({ pages: Array.from(pages) })
}
