import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { supabase } from "@/lib/db"
import { evaluationResultRepository } from "@/lib/repositories/factory"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || !hasRole((session.user as Record<string, unknown>).role as string, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get("periodId")
    const departmentId = searchParams.get("departmentId")
    if (!periodId) return NextResponse.json({ error: "periodId is required" }, { status: 400 })

    const filters: { departmentId?: string } = {}
    if (departmentId) filters.departmentId = departmentId

    const results = await evaluationResultRepository.list(periodId, filters)
    const facultyIds = [...new Set(results.map((r) => r.facultyId))]
    const { data: users } = await supabase.from("users").select("id, name").in("id", facultyIds)
    const facultyNames: Record<string, string> = {}
    if (users) {
      for (const u of users) facultyNames[u.id] = u.name
    }
    return NextResponse.json({ results, facultyNames })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation results" }, { status: 500 })
  }
}
