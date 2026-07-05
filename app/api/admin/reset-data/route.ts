import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { supabase } from "@/lib/supabase"

export async function POST(_request: NextRequest) {
  const session = await auth()
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined

  if (!session?.user || !hasRole(role ?? "", "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tables = ["audit_logs", "appointments", "availability_rules", "evaluation_results", "evaluations", "user_permissions", "users"]

  for (const table of tables) {
    const query = supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    const { error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
