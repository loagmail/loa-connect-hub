import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/route-guard"
import { userRepository } from "@/lib/repositories/factory"
import { logAuditEvent } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const session = await auth()
  const currentUserId = (session!.user as Record<string, unknown>).id as string

  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 })
    }

    await userRepository.bulkSoftDelete(ids)

    await logAuditEvent({
      userId: currentUserId,
      action: "BULK_DISABLE_USERS",
      details: `Bulk soft-deleted ${ids.length} users`,
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
