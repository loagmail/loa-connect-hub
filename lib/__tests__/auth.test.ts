import { describe, it, expect } from "vitest"

describe("Auth", () => {
  it("should hash and compare passwords", async () => {
    const { hash, compare } = await import("bcryptjs")
    const password = "test123"
    const hashed = await hash(password, 12)
    const isValid = await compare(password, hashed)
    expect(isValid).toBe(true)
  })

  it("should reject wrong password", async () => {
    const { hash, compare } = await import("bcryptjs")
    const hashed = await hash("correct", 12)
    const isValid = await compare("wrong", hashed)
    expect(isValid).toBe(false)
  })
})
