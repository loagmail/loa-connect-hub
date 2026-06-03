"use client"

import { usePathname } from "next/navigation"
import { useNavigation } from "./NavigationStack"
import { useEffect, useState } from "react"

const LABELS: Record<string, string> = {
  admin: "Admin",
  dean: "Dean",
  faculty: "Faculty",
  student: "Student",
  login: "Login",
  register: "Register",
  availability: "Availability",
  meetings: "Meetings",
  upload: "Import Users",
  "graph-users": "Entra ID Users",
  users: "Users",
  new: "New",
  responsiveness: "TAT Report",
  distribution: "Faculty Consultation Load",
  coverage: "Consultation Reach",
  backlog: "Faculty Response Monitor",
  health: "General Report",
  demand: "Demand Trend",
}

interface NavBarItem {
  label: string
  onClick: () => void
  icon: React.ReactNode
}

interface NavigationBarProps {
  title?: string
  rightItems?: NavBarItem[]
}

export default function NavigationBar({ title, rightItems }: NavigationBarProps) {
  const pathname = usePathname()
  const { goBack } = useNavigation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.querySelector("main")
    if (!el) return

    const handleScroll = () => {
      setScrolled(el.scrollTop > 20)
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [])

  if (!pathname) return null

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/activate" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/change-password") ||
    pathname.startsWith("/setup-password")

  if (isAuthPage) return null

  const segments = pathname.split("/").filter(Boolean)
  const currentLabel =
    title ||
    (segments.length > 0
      ? LABELS[segments[segments.length - 1]] ||
        segments[segments.length - 1].charAt(0).toUpperCase() +
          segments[segments.length - 1].slice(1)
      : "")

  const isRootScreen =
    segments.length === 1 &&
    ["admin", "faculty", "student", "dean", "faq"].includes(segments[0])

  const showBackButton = segments.length > 1
  const showLargeTitle = isRootScreen

  return (
    <>
      <div className="lg:hidden ios-blur bg-nav-bar border-b border-default sticky top-0 z-30">
        <div className="flex items-center px-4 pt-safe">
          {showBackButton && (
            <button
              onClick={goBack}
              className="flex items-center justify-center -ml-1.5 mr-1 min-h-[44px] min-w-[44px] text-gold-600 active:opacity-60 transition-opacity shrink-0"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1
            className={`font-bold text-primary flex-1 min-w-0 transition-all duration-200 ${
              showLargeTitle && !scrolled
                ? "text-[32px] leading-tight tracking-tight py-3"
                : "text-lg leading-tight py-2"
            }`}
          >
            {currentLabel}
          </h1>
          {rightItems && rightItems.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {rightItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gold-600 active:opacity-60 transition-opacity"
                  aria-label={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-1 text-xs text-tertiary px-6 py-3 border-b border-default bg-surface shrink-0">
        {segments.map((seg, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const label = LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
          return (
            <span key={href} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              <span
                className={
                  href === pathname
                    ? "text-secondary font-semibold truncate"
                    : "truncate"
                }
              >
                {label}
              </span>
            </span>
          )
        })}
      </nav>
    </>
  )
}
