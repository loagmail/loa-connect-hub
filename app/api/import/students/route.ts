import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseCsv } from "@/lib/services/csvParser"
import { importUsers } from "@/lib/services/userImport"

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!role || (role !== "FACULTY" && role !== "DEAN")) {
    return NextResponse.json({ error: "Unauthorized — Faculty or Dean only" }, { status: 403 })
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

  const result = await importUsers(rows, "FACULTY", null)

  return NextResponse.json({ ...result, parseErrors })
}
