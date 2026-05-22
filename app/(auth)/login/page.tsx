"use client"

import { Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, FormEvent } from "react"
import Link from "next/link"

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const error = searchParams.get("error")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn("credentials", { email, password, callbackUrl: "/" })
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img
            src="https://lyceumalabang.edu.ph/wp-content/uploads/2025/08/logo-blk.png"
            alt="Lyceum of Alabang"
            className="h-10 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-[#5a1010] font-display tracking-tight">Student Portal Sign In</h1>
        <p className="text-[#b02b2c]/50 mt-1 text-xs font-semibold uppercase tracking-wider">Academic e-Consultations</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Invalid email or password
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#b02b2c]/70 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#edae44]/40 bg-white text-sm text-[#5a1010] placeholder-[#edae44]/50 focus:outline-none focus:ring-2 focus:ring-[#edae44]/30 focus:border-[#edae44] transition-all"
            placeholder="you@itmlyceumalabang.onmicrosoft.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-[#b02b2c]/70 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#edae44]/40 bg-white text-sm text-[#5a1010] placeholder-[#edae44]/50 focus:outline-none focus:ring-2 focus:ring-[#edae44]/30 focus:border-[#edae44] transition-all"
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#b02b2c] hover:bg-[#8a1f1f] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-[#b02b2c]/50 font-medium">
        First time here?{" "}
        <Link href="/activate" className="text-[#edae44] hover:text-[#d4952e] font-semibold transition-colors">
          Activate your account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm flex items-center justify-center py-12">
        <svg className="animate-spin w-6 h-6 text-[#b02b2c]" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
