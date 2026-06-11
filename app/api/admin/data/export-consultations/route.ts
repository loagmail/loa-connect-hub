import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/route-guard"
import { exportAndClearConsultations } from "@/features/admin-data/admin-data.service"
import { logAuditEvent } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const session = await auth()

  const currentUserId = (session!.user as Record<string, unknown>).id as string

  try {
    const data = await exportAndClearConsultations()
    const count = data.appointments.length

    await logAuditEvent({
      userId: currentUserId,
      action: "CLEAR_CONSULTATIONS",
      details: `Exported and cleared ${count} consultation records with ${data.files.length} file(s), ${data.attendees.length} attendee(s), and ${data.timeSlots.length} time slot(s)`,
    })

    const json = JSON.stringify(data, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="consultations-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
