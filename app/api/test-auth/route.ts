import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await auth()
    return NextResponse.json({ 
      hasSession: !!session,
      session: session,
      authSecretExists: !!process.env.AUTH_SECRET,
      authSecretLength: process.env.AUTH_SECRET?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
