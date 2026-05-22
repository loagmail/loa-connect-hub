import { createHmac } from "crypto"

const SECRET = (process.env.INVITE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "fallback-dev-secret") as string

export function generateInviteToken(meetingId: string, userId: string): string {
  const payload = `${meetingId}:${userId}:${Date.now() + 7 * 24 * 60 * 60 * 1000}`
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url")
  const encoded = Buffer.from(payload).toString("base64url")
  return `${encoded}.${sig}`
}

export function verifyInviteToken(token: string): { meetingId: string; userId: string } | null {
  const [encoded, sig] = token.split(".")
  if (!encoded || !sig) return null
  const payload = Buffer.from(encoded, "base64url").toString()
  const expectedSig = createHmac("sha256", SECRET).update(payload).digest("base64url")
  if (sig !== expectedSig) return null
  const [meetingId, userId, expiresAtStr] = payload.split(":")
  const expiresAt = parseInt(expiresAtStr, 10)
  if (Date.now() > expiresAt) return null
  return { meetingId, userId }
}
