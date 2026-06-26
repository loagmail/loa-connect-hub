import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserAccess } from "@/lib/access"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ access: [] })
  }

  const su = session.user as Record<string, unknown>
  const role = su.role as string
  const userId = su.id as string

  const access = await getUserAccess(userId, role)
  return NextResponse.json({ access })
}
