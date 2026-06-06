"use client"

import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

type NavDirection = "push" | "pop" | "none"

interface NavigationValue {
  direction: NavDirection
  goBack: () => void
  push: (href: string) => void
  canGoBack: boolean
}

const NavigationContext = createContext<NavigationValue | null>(null)

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error("useNavigation must be used within NavigationStack")
  return ctx
}

export function AnimatedPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { direction } = useNavigation()
  return (
    <div
      className={`flex-1 flex flex-col ${className} ${
        direction === "push"
          ? "animate-ios-slide-in"
          : direction === "pop"
          ? "animate-ios-pop-in"
          : ""
      }`}
    >
      {children}
    </div>
  )
}

export function SwipeBackHandler({ children }: { children: React.ReactNode }) {
  const { canGoBack, goBack } = useNavigation()
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const isSwipingRef = useRef(false)
  const offsetRef = useRef(0)
  const SWIPE_THRESHOLD = 0.35
  const EDGE_THRESHOLD = 25

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canGoBack) return
    const touch = e.touches[0]
    if (touch.clientX > EDGE_THRESHOLD) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isSwipingRef.current = true
    setIsSwiping(true)
  }, [canGoBack])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwipingRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    if (dy > dx + 20 && dx < 20) {
      isSwipingRef.current = false
      setIsSwiping(false)
      offsetRef.current = 0
      setSwipeOffset(0)
      return
    }
    const newOffset = Math.max(0, dx * 0.5)
    offsetRef.current = newOffset
    setSwipeOffset(newOffset)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) return
    isSwipingRef.current = false
    setIsSwiping(false)
    const screenWidth = window.innerWidth
    if (offsetRef.current > screenWidth * SWIPE_THRESHOLD) {
      goBack()
    }
    offsetRef.current = 0
    setSwipeOffset(0)
  }, [goBack])

  useEffect(() => {
    if (!canGoBack) return
    const el = document.querySelector("main")
    if (!el) return
    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
    }
  }, [canGoBack, handleTouchStart, handleTouchMove, handleTouchEnd])

  if (!isSwiping && swipeOffset === 0) return <>{children}</>

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-surface-muted" />
      <div
        className="absolute inset-y-0 left-0 w-1 bg-black/10 shadow-2xl -ml-1 z-10"
        style={{ opacity: Math.min(swipeOffset / 80, 0.8) }}
      />
      <div
        className="flex-1 flex flex-col bg-surface-muted relative z-20"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: swipeOffset > 0 ? "rgba(0,0,0,0.15) 0 0 24px" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function NavigationStack({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [direction, setDirection] = useState<NavDirection>("none")
  const [canGoBack, setCanGoBack] = useState(false)
  const stackRef = useRef<string[]>([])
  const prevPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return

    const prev = prevPathnameRef.current
    prevPathnameRef.current = pathname

    if (prev === null) {
      stackRef.current = [pathname]
      setCanGoBack(false)
      return
    }

    if (prev === pathname) return

    const stack = stackRef.current
    const prevIndex = stack.indexOf(pathname)

    if (prevIndex >= 0 && prevIndex < stack.length - 1) {
      stack.splice(prevIndex + 1)
      setDirection("pop")
    } else {
      stack.push(pathname)
      setDirection("push")
    }

    setCanGoBack(stack.length > 1)

    const timer = setTimeout(() => setDirection("none"), 400)
    return () => clearTimeout(timer)
  }, [pathname])

  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) {
      router.back()
    }
  }, [router])

  const push = useCallback((href: string) => {
    router.push(href)
  }, [router])

  return (
    <NavigationContext.Provider
      value={{
        direction,
        goBack,
        push,
        canGoBack,
      }}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <SwipeBackHandler>
          {children}
        </SwipeBackHandler>
      </div>
    </NavigationContext.Provider>
  )
}
