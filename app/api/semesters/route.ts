import { NextResponse } from "next/server"
import { getSemesters } from "@/features/admin-data/semesters.service"

export async function GET() {
  try {
    const semesters = await getSemesters({ isActive: true })
    return NextResponse.json({ data: semesters })
  } catch (error) {
    console.error("Error fetching semesters", error)
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 })
  }
}
