import { NextRequest, NextResponse } from "next/server"
import { auditLogRepository } from "@/lib/repositories/factory"
import { requireAdmin } from "@/lib/route-guard"

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req)
  if (authErr) return authErr

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page")) || 1
  const pageSize = 25
  const offset = Math.max(0, (page - 1) * pageSize)

  const logs = await auditLogRepository.list(pageSize, offset)
  return NextResponse.json({ logs })
}
