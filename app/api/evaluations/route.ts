import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { supabase } from "@/lib/supabase"
import { getMyEvaluations } from "@/features/evaluations/evaluations.service"
import { getActiveSemester } from "@/features/admin-data/semesters.service"
import { getOrCreateEvaluation } from "@/features/evaluations/evaluations.service"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as Record<string, unknown>).role as string
  const userId = (session.user as Record<string, unknown>).id as string

  if (!hasRole(role, "STUDENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const evaluations = await getMyEvaluations(userId)
    const facultyIds = [...new Set(evaluations.map((e) => e.evaluateeId))]
    const { data: facultyUsers } = await supabase
      .from("users")
      .select("id, name")
      .in("id", facultyIds)
    const nameMap = new Map((facultyUsers || []).map((u) => [u.id, u.name]))
    const result = evaluations.map((e) => ({
      ...e,
      evaluateeName: nameMap.get(e.evaluateeId) || "Unknown",
    }))
    return NextResponse.json({ evaluations: result })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as Record<string, unknown>).role as string
  const userId = (session.user as Record<string, unknown>).id as string

  if (!hasRole(role, "STUDENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { periodId, evaluateeId } = await request.json()
    const activeSemesterId = periodId || (await getActiveSemester())?.id
    if (!activeSemesterId) {
      return NextResponse.json({ error: "No active evaluation period" }, { status: 400 })
    }
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("section_id")
      .eq("student_id", userId)
      .eq("semesterId", activeSemesterId)
      .limit(1)
      .single()
    if (enrollment) {
      const { data: facultyLink } = await supabase
        .from("faculty_subjects")
        .select("faculty_id")
        .eq("section_id", enrollment.section_id)
        .eq("faculty_id", evaluateeId)
        .eq("semesterId", activeSemesterId)
        .maybeSingle()
      if (!facultyLink) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const evaluation = await getOrCreateEvaluation(activeSemesterId, userId, evaluateeId)

    const { data: facultyUser } = await supabase
      .from("users")
      .select("name")
      .eq("id", evaluateeId)
      .single()
    const evaluateeName = (facultyUser as { name: string } | null)?.name || "Unknown"

    return NextResponse.json({ evaluation: { ...evaluation, evaluateeName } }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Failed to create evaluation" }, { status: 500 })
  }
}
