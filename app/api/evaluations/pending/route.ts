import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { getActiveSemester } from "@/features/admin-data/semesters.service"
import { getPendingEvaluations } from "@/features/evaluations/evaluations.service"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as Record<string, unknown>).role as string
  const userId = (session.user as Record<string, unknown>).id as string

  if (!hasRole(role, "STUDENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const activeSemester = await getActiveSemester()
    if (!activeSemester) {
      return NextResponse.json({ error: "No active semester" }, { status: 400 })
    }
    const pending = await getPendingEvaluations(userId, activeSemester.id)
    const facultyIds = pending.map((p) => p.evaluateeId)
    return NextResponse.json({ pending: facultyIds })
  } catch {
    return NextResponse.json({ error: "Failed to fetch pending evaluations" }, { status: 500 })
  }
}
