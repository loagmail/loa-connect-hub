"use client"

import { useState, useRef, useCallback } from "react"

export type PullState = "idle" | "pulling" | "threshold" | "refreshing"

const THRESHOLD = 60

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [state, setState] = useState<PullState>("idle")
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const refreshingRef = useRef(false)
  const stateRef = useRef<PullState>("idle")

  const setStateProxy = useCallback((newState: PullState) => {
    stateRef.current = newState
    setState(newState)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshingRef.current) return
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshingRef.current) return
    if (stateRef.current === "idle" && window.scrollY > 0) return
    const delta = e.touches[0].clientY - startY.current
    if (delta < 5 && stateRef.current === "idle") return
    if (delta <= 0) {
      setPullDistance(0)
      setStateProxy("idle")
      return
    }
    const distance = Math.min(delta * 0.5, 120)
    setPullDistance(distance)
    setStateProxy(distance >= THRESHOLD ? "threshold" : "pulling")
  }, [setStateProxy])

  const handleTouchEnd = useCallback(async () => {
    if (refreshingRef.current) return
    const distance = pullDistance
    if (distance >= THRESHOLD) {
      setStateProxy("refreshing")
      refreshingRef.current = true
      await onRefresh()
      refreshingRef.current = false
      setStateProxy("idle")
      setPullDistance(0)
    } else {
      setStateProxy("idle")
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh, setStateProxy])

  return {
    state,
    pullDistance,
    pullHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
