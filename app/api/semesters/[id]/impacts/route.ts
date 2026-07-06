import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { supabase } from "@/lib/supabase"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string
  if (!role || !hasRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  try {
    const [facultySubjects, enrollments, evaluations, results, sections] = await Promise.all([
      supabase.from("faculty_subjects").select("id", { count: "exact", head: true }).eq("semesterId", id),
      supabase.from("student_enrollments").select("id", { count: "exact", head: true }).eq("semesterId", id),
      supabase.from("evaluations").select("id", { count: "exact", head: true }).eq("semesterId", id),
      supabase.from("evaluation_results").select("id", { count: "exact", head: true }).eq("semesterId", id),
      supabase.from("sections").select("id", { count: "exact", head: true }).eq("semesterId", id),
    ])

    return NextResponse.json({
      facultySubjects: facultySubjects.count ?? 0,
      enrollments: enrollments.count ?? 0,
      evaluations: evaluations.count ?? 0,
      results: results.count ?? 0,
      sections: sections.count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch impacts" }, { status: 500 })
  }
}
