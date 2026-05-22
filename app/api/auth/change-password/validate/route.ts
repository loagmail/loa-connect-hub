import { NextRequest, NextResponse } from "next/server"
import { passwordResetTokenRepository } from "@/lib/repositories/factory"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const resetToken = await passwordResetTokenRepository.findByToken(token)

  if (!resetToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "This link has already been used." }, { status: 400 })
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 400 })
  }

  return NextResponse.json({ valid: true })
}
