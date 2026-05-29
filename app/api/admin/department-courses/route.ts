import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { hasRole } from "@/lib/utils/roles"

export async function GET() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!role || (!hasRole(role, "ADMIN") && !hasRole(role, "DEAN"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("department_courses")
    .select("*, department:departments(name, code)")
    .order("departmentId", { ascending: true })
    .order("code", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!role || (!hasRole(role, "ADMIN") && !hasRole(role, "DEAN"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await request.json()
  const { departmentId, name, code } = body

  if (!departmentId || !name || !code) {
    return NextResponse.json({ error: "departmentId, name, and code are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("department_courses")
    .insert({ departmentId, name, code })
    .select("*, department:departments(name, code)")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Course code already exists for this department" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
