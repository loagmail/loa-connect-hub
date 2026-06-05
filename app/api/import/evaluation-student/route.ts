import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { hasRole } from "@/lib/utils/roles"
import { parseStudentEnrollmentCsv, importStudentEnrollments } from "@/lib/services/etlEvaluation"
import { logAuditEvent } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string
  if (!role || !hasRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden — Admin only" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
  }

  const text = await file.text()
  const { rows, errors: parseErrors, headerError } = parseStudentEnrollmentCsv(text)
  if (headerError) {
    return NextResponse.json({ error: `Header mismatch: ${headerError}` }, { status: 400 })
  }
  if (parseErrors.length > 0 && rows.length === 0) {
    return NextResponse.json({ error: "CSV parsing failed", details: parseErrors }, { status: 400 })
  }

  const result = await importStudentEnrollments(rows)

  await logAuditEvent({
    userId: (session!.user as Record<string, unknown>).id as string,
    action: "ETL_STUDENT_ENROLLMENT",
    details: `Imported ${result.matched} student enrollments (${result.errors.length} errors)`,
  })

  return NextResponse.json({ ...result, parseErrors })
}
