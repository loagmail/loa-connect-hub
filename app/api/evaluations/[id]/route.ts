import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { getEvaluation } from "@/features/evaluations/evaluations.service"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params
  try {
    const evaluation = await getEvaluation(id)
    if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (evaluation.evaluatorId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { data: facultyUser } = await supabase
      .from("users")
      .select("name")
      .eq("id", evaluation.evaluateeId)
      .single()
    const evaluateeName = (facultyUser as { name: string } | null)?.name || "Unknown"
    return NextResponse.json({ evaluation: { ...evaluation, evaluateeName } })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 })
  }
}
