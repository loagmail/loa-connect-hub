"use client"

import Link from "next/link"

export default function AuthErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-slate-300">500</h1>
        <p className="text-lg font-semibold text-primary mt-4">Something went wrong</p>
        <p className="text-sm text-tertiary mt-2">
          An authentication error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="text-sm font-semibold text-white bg-gold-600 hover:bg-gold-700 px-4 py-2 rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="text-sm font-semibold text-gold-600 hover:text-gold-700 underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
