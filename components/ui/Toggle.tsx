"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface ToggleProps {
  paramName: string
  label: string
  basePath?: string
  className?: string
}

export default function Toggle({ paramName, label, basePath, className = "" }: ToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOn = searchParams.get(paramName) === "1"

  const handleToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (isOn) {
      params.delete(paramName)
    } else {
      params.set(paramName, "1")
    }
    const qs = params.toString()
    router.push(`${basePath || ""}?${qs}`)
  }, [router, searchParams, paramName, basePath, isOn])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 text-xs font-semibold transition-colors ${isOn ? "text-gold-500" : "text-tertiary hover:text-secondary"} ${className}`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${isOn ? "bg-gold-500" : "bg-surface-muted"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isOn ? "translate-x-4" : "translate-x-0"}`}
        />
      </span>
      {label}
    </button>
  )
}
