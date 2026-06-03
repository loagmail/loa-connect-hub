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
        {children}
      </div>
    </NavigationContext.Provider>
  )
}
