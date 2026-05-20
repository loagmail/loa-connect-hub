import { NextResponse } from "next/server"
import { registerUser } from "@/lib/controllers/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await registerUser(body)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    )
  }
}
