import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string
  if (!role || !hasRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { faculty_id, subject_id, section_id, semesterId } = await request.json()
    if (!faculty_id || !subject_id || !section_id) {
      return NextResponse.json({ error: "faculty_id, subject_id, and section_id are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("faculty_subjects")
      .insert({ faculty_id, subject_id, section_id, semesterId: semesterId || null })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This mapping already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
