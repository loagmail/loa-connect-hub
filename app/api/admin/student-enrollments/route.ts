import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/route-guard"
import { createEnrollment, EnrollmentError } from "@/features/admin-data/student-enrollment.service"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const session = await auth()
  const currentUserId = (session!.user as Record<string, unknown>).id as string

  try {
    const body = await request.json()
    const result = await createEnrollment(body, currentUserId)
    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (err) {
    if (err instanceof EnrollmentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
