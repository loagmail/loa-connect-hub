"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export interface Segment {
  key: string
  label: string
}

interface SegmentedControlProps {
  segments: Segment[]
  activeKey: string
  paramName?: string
  basePath?: string
  className?: string
}

export default function SegmentedControl({
  segments,
  activeKey,
  paramName = "filter",
  basePath,
  className = "",
}: SegmentedControlProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeIndex = segments.findIndex((s) => s.key === activeKey)

  const handleSelect = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramName, key)
      const qs = params.toString()
      router.push(`${basePath || ""}?${qs}`)
    },
    [router, searchParams, paramName, basePath],
  )

  return (
    <div
      className={`relative flex bg-surface-muted rounded-xl p-0.5 ${className}`}
      role="radiogroup"
    >
      <div
        className="absolute top-0.5 bottom-0.5 rounded-lg bg-surface shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          left: `${(activeIndex / segments.length) * 100}%`,
          width: `${(1 / segments.length) * 100}%`,
        }}
      />
      {segments.map((segment) => {
        const isActive = activeKey === segment.key
        return (
          <button
            key={segment.key}
            onClick={() => handleSelect(segment.key)}
            role="radio"
            aria-checked={isActive}
            className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 min-h-[36px] flex items-center justify-center ${isActive ? "text-primary" : "text-tertiary hover:text-secondary"}`}
          >
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}
