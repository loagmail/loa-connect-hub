import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseCsv } from "@/lib/services/csvParser"
import { importUsers } from "@/lib/services/userImport"
import { departmentRepository } from "@/lib/repositories/factory"

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!role || (role !== "DEAN" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized — Dean or Admin only" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
  }

  const text = await file.text()
  const { rows, errors: parseErrors } = parseCsv(text)
  if (parseErrors.length > 0 && rows.length === 0) {
    return NextResponse.json({ error: "CSV parsing failed", details: parseErrors }, { status: 400 })
  }

  const userId = (session!.user as any).id
  let departmentId: string | null = null
  if (role === "DEAN") {
    const dept = await departmentRepository.findByDeanId(userId)
    departmentId = dept?.id ?? null
  }

  const result = await importUsers(rows, "DEAN", departmentId)

  return NextResponse.json({ ...result, parseErrors })
}
