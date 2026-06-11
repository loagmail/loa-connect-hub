import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/route-guard"
import { exportAndDeleteStudents } from "@/features/admin-data/admin-data.service"
import { logAuditEvent } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const session = await auth()

  const currentUserId = (session!.user as Record<string, unknown>).id as string

  try {
    const data = await exportAndDeleteStudents()
    const count = data.students.length

    await logAuditEvent({
      userId: currentUserId,
      action: "DELETE_STUDENTS",
      details: `Exported and deleted ${count} student records; ${data.orphanedAppointmentIds.length} appointments orphaned`,
    })

    const json = JSON.stringify(data, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="students-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
