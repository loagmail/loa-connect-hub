import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        *,
        evaluator:evaluatorId(id, name, email),
        evaluatee:evaluateeId(id, name, email),
        faculty_subject:facultySubjectId(
          id,
          faculty:faculty_id(id, name),
          subject:subject_id(id, code, name),
          section:section_id(id, name, program)
        )
      `)
      .eq("isDisabled", true)
      .order("updatedAt", { ascending: false })

    if (error) throw error

    return NextResponse.json({ evaluations: data })
  } catch {
    return NextResponse.json({ error: "Failed to fetch disabled evaluations" }, { status: 500 })
  }
}
