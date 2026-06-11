import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/route-guard"
import { getSemester  , updateSemester, deleteSemester } from "@/features/admin-data/semesters.service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const { id } = await params
  try {
    const period = await getSemester(id)
    if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ period })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation period" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const { id } = await params
  try {
    const body = await request.json()
    const period = await updateSemester(id, body)
    return NextResponse.json({ period })
  } catch {
    return NextResponse.json({ error: "Failed to update evaluation period" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const { id } = await params
  try {
    await deleteSemester(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete evaluation period" }, { status: 500 })
  }
}
