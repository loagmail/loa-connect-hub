"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void>
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter()

  const defaultRefresh = useCallback(async () => {
    router.refresh()
  }, [router])

  const { state, pullDistance, pullHandlers } = usePullToRefresh(
    onRefresh || defaultRefresh,
  )

  const indicatorHeight = state === "refreshing" ? 60 : Math.min(pullDistance, 60)

  return (
    <div
      {...pullHandlers}
      className="relative"
      style={{ touchAction: "pan-x" }}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
      >
        {state === "refreshing" ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <svg className="animate-spin ios-spinner w-5 h-5 text-brand-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-semibold text-tertiary">Refreshing...</span>
          </div>
        ) : state === "pulling" && pullDistance > 10 ? (
          <span className="text-xs font-semibold text-tertiary animate-fade-in">
            Pull to refresh
          </span>
        ) : state === "threshold" ? (
          <span className="text-xs font-semibold text-brand-600 animate-fade-in">
            Release to refresh
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}
