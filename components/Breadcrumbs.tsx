"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

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

export default function Breadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()
  if (!pathname || pathname === "/login" || pathname === "/register" || pathname === "/activate" || pathname === "/forgot-password" || pathname.startsWith("/change-password") || pathname.startsWith("/setup-password")) return null

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  const items = segments.map((seg, i) => ({
    label: LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }))

  const currentLabel = items[items.length - 1]?.label || ""

  // Check if we're at the root of a role section
  const isRoleRoot = segments.length === 1 && ["admin", "faculty", "student", "dean"].includes(segments[0])

  return (
    <>
      {/* Mobile: iOS-style large title nav */}
      <div className="lg:hidden ios-blur-light bg-nav-bar border-b border-default sticky top-0 z-30">
        <div className="flex items-center px-4 pt-1 pb-2 min-h-[48px]">
          {items.length > 1 && (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center -ml-1.5 mr-2 min-h-[44px] min-w-[44px] text-gold-600 active:opacity-60 transition-opacity"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className={`font-bold text-primary flex-1 min-w-0 ${isRoleRoot ? "text-[28px] leading-tight tracking-tight" : "text-lg leading-tight"}`}>
            {currentLabel}
          </h1>
        </div>
      </div>

      {/* Desktop: compact breadcrumb nav bar */}
      <nav className="hidden lg:flex items-center gap-1 text-xs text-tertiary px-6 py-3 border-b border-default bg-surface shrink-0">
        {items.map((item, index) => (
          <span key={item.href} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.href === pathname ? (
              <span className="text-secondary font-semibold truncate">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-secondary transition-colors truncate">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
