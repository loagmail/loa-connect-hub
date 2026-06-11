import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { evaluationResultRepository } from "@/lib/repositories/factory"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  try {
    const { periodId } = await request.json()
    await evaluationResultRepository.computeAll(periodId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to recompute results" }, { status: 500 })
  }
}
