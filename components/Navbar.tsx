"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export function Navbar() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              E-Consultation
            </Link>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </nav>
    )
  }

  if (!session) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              E-Consultation
            </Link>
            <div className="space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const role = (session.user as any)?.role

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            E-Consultation
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {session.user?.name}{" "}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                role === "FACULTY" ? "bg-blue-100 text-blue-800" :
                "bg-green-100 text-green-800"
              }`}>
                {role}
              </span>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
