import { NextRequest, NextResponse } from "next/server"
import { userRepository, passwordResetTokenRepository } from "@/lib/repositories/factory"
import { randomBytes } from "crypto"
import { sendForgotPasswordEmail } from "@/lib/services/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await userRepository.findByEmail(email.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: "No account found with this email", code: "NOT_FOUND" }, { status: 404 })
    }

    if (!user.hasLoggedInBefore) {
      return NextResponse.json({ error: "Account not yet activated. Please activate first.", code: "NOT_ACTIVATED" }, { status: 400 })
    }

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await passwordResetTokenRepository.create(user.email, token, expiresAt)

    const resetUrl = `${process.env.NEXTAUTH_URL}/change-password?token=${token}`

    await sendForgotPasswordEmail(user.email, user.name, resetUrl)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message, code: "SERVER_ERROR" }, { status: 500 })
  }
}
