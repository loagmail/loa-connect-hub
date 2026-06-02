import { describe, it, expect } from "vitest"
import { hasRole, getPrimaryRole, getRoleList } from "@/lib/utils/roles"

describe("hasRole", () => {
  it("returns true when target role is present", () => {
    expect(hasRole("ADMIN", "ADMIN")).toBe(true)
    expect(hasRole("FACULTY|DEAN", "FACULTY")).toBe(true)
    expect(hasRole("FACULTY|DEAN", "DEAN")).toBe(true)
    expect(hasRole("STUDENT|FACULTY", "STUDENT")).toBe(true)
  })

  it("returns false when target role is absent", () => {
    expect(hasRole("ADMIN", "FACULTY")).toBe(false)
    expect(hasRole("FACULTY|DEAN", "STUDENT")).toBe(false)
    expect(hasRole("STUDENT", "DEAN")).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(hasRole("", "ADMIN")).toBe(false)
  })

  it("handles single role string", () => {
    expect(hasRole("ADMIN", "ADMIN")).toBe(true)
    expect(hasRole("STUDENT", "STUDENT")).toBe(true)
  })
})

describe("getPrimaryRole", () => {
  it("returns the highest-priority role", () => {
    expect(getPrimaryRole("STUDENT|FACULTY|DEAN|ADMIN")).toBe("ADMIN")
    expect(getPrimaryRole("STUDENT|DEAN")).toBe("DEAN")
    expect(getPrimaryRole("STUDENT|FACULTY")).toBe("FACULTY")
    expect(getPrimaryRole("FACULTY|DEAN")).toBe("DEAN")
  })

  it("returns GUEST for empty string", () => {
    expect(getPrimaryRole("")).toBe("GUEST")
  })

  it("returns the only role in single-role strings", () => {
    expect(getPrimaryRole("STUDENT")).toBe("STUDENT")
    expect(getPrimaryRole("FACULTY")).toBe("FACULTY")
    expect(getPrimaryRole("DEAN")).toBe("DEAN")
    expect(getPrimaryRole("ADMIN")).toBe("ADMIN")
  })

  it("returns GUEST for unknown roles", () => {
    expect(getPrimaryRole("SUPER_ADMIN")).toBe("GUEST")
  })
})

describe("getRoleList", () => {
  it("splits a pipe-delimited string into an array", () => {
    expect(getRoleList("FACULTY|DEAN")).toEqual(["FACULTY", "DEAN"])
    expect(getRoleList("ADMIN")).toEqual(["ADMIN"])
    expect(getRoleList("STUDENT|FACULTY|DEAN")).toEqual(["STUDENT", "FACULTY", "DEAN"])
  })

  it("returns an empty array for empty string", () => {
    expect(getRoleList("")).toEqual([])
  })
})
