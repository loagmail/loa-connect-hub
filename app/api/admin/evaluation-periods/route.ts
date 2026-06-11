import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { getSemesters, createSemester } from "@/features/admin-data/semesters.service"

export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  try {
    const periods = await getSemesters()
    return NextResponse.json({ periods })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation periods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const period = await createSemester(body)
    return NextResponse.json({ period }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create evaluation period" }, { status: 500 })
  }
}
