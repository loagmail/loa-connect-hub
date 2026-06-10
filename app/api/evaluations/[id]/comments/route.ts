import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { addEvaluationComment, getEvaluationComment } from "@/features/evaluations/evaluations.service"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const comment = await getEvaluationComment(id)
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !hasRole((session.user as Record<string, unknown>).role as string, "STUDENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  try {
    const { comment } = await request.json()
    const created = await addEvaluationComment(id, comment)
    return NextResponse.json({ comment: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
