import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { departmentRepository } from "@/lib/repositories/factory"
import { getStudentBreakdownsForFaculty } from "@/features/evaluation-results/evaluation-results.repository"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || !hasRole((session.user as Record<string, unknown>).role as string, "DEAN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get("periodId")
    const facultyId = searchParams.get("facultyId")
    const userId = (session.user as Record<string, unknown>).id as string
    if (!periodId || !facultyId) {
      return NextResponse.json({ error: "periodId and facultyId are required" }, { status: 400 })
    }

    const dept = await departmentRepository.findByDeanId(userId)
    if (!dept) return NextResponse.json({ students: [] })

    const students = await getStudentBreakdownsForFaculty(periodId, facultyId)
    const anonymized = students.map((s, i) => ({
      id: `S${i + 1}`,
      ...s,
    }))
    return NextResponse.json({ students: anonymized })
  } catch {
    return NextResponse.json({ error: "Failed to fetch student breakdown" }, { status: 500 })
  }
}
