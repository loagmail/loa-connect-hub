"use client"

import Link from "next/link"

export default function StudentErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-slate-300">500</h1>
        <p className="text-lg font-semibold text-slate-900 mt-4">Something went wrong</p>
        <p className="text-sm text-slate-500 mt-2">
          An error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="text-sm font-semibold text-white bg-gold-600 hover:bg-gold-700 hover:scale-[1.02] active:scale-[0.98] px-4 py-2 rounded-lg transition-all duration-200 shadow-sm"
          >
            Try again
          </button>
          <Link
            href="/student"
            className="text-sm font-semibold text-gold-600 hover:text-gold-700 underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
