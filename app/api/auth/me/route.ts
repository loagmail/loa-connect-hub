import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const su = session.user as Record<string, unknown>
  const userId = su.id as string

  const { data: user } = await supabase
    .from("users")
    .select('id, name, email, "departmentId", "isDisabled"')
    .eq("id", userId)
    .single()

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { data: roles } = await supabase
    .from("userrole")
    .select('"roleName"')
    .eq("userId", userId)

  const role = (roles ?? []).map((r: Record<string, unknown>) => r.roleName).join("|")

  const { data: perms } = await supabase
    .from("user_permissions")
    .select('resource_path, grants')
    .eq("user_id", userId)

  return NextResponse.json({
    user: { ...user, role },
    permissions: perms ?? [],
  })
}
