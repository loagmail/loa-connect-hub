import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { saveRatings, getEvaluationRatings, getEvaluationIfOwner } from "@/features/evaluations/evaluations.service"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params
  try {
    const evaluation = await getEvaluationIfOwner(id, userId)
    if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const ratings = await getEvaluationRatings(id)
    return NextResponse.json({ ratings })
  } catch {
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !hasRole((session.user as Record<string, unknown>).role as string, "STUDENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params
  try {
    const evaluation = await getEvaluationIfOwner(id, userId)
    if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { ratings } = await request.json()
    await saveRatings(id, ratings)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save ratings" }, { status: 500 })
  }
}
