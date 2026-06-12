"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const TABS = [
  { key: "all", label: "All", countKey: null },
  { key: "pending", label: "Pending", countKey: "pending" as const },
  { key: "approved", label: "Accepted", countKey: "approved" as const },
  { key: "completed", label: "Completed", countKey: "completed" as const },
  { key: "cancelled", label: "Cancelled", countKey: "cancelled" as const },
]

interface Props {
  counts: {
    pending: number
    approved: number
    completed: number
    cancelled: number
  }
  basePath?: string
}

export function FacultyAppointmentTabs({
  counts,
  basePath = "/faculty",
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "all"

  const activeIndex = TABS.findIndex((t) => t.key === activeTab)

  const totalCount =
    counts.pending +
    counts.approved +
    counts.completed +
    counts.cancelled

  const getCount = (tab: (typeof TABS)[number]) =>
    tab.countKey === null ? totalCount : counts[tab.countKey]

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="relative flex bg-surface-muted rounded-xl p-0.5 min-w-max w-full" role="radiogroup">
        <div
          className="absolute top-0.5 bottom-0.5 rounded-lg bg-surface shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: `${(activeIndex / TABS.length) * 100}%`,
            width: `${(1 / TABS.length) * 100}%`,
          }}
        />
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = getCount(tab)

          return (
            <TabButton
              key={tab.key}
              tabKey={tab.key}
              label={tab.label}
              count={count}
              isActive={isActive}
              searchParams={searchParams}
              basePath={basePath}
              router={router}
            />
          )
        })}
      </div>
    </div>
  )
}

function TabButton({
  tabKey,
  label,
  count,
  isActive,
  searchParams,
  basePath,
  router,
}: {
  tabKey: string
  label: string
  count: number
  isActive: boolean
  searchParams: URLSearchParams
  basePath: string
  router: ReturnType<typeof useRouter>
}) {
  const handleSelect = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (tabKey === "all") {
      params.delete("tab")
    } else {
      params.set("tab", tabKey)
    }
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }, [tabKey, searchParams, basePath, router])

  return (
    <button
      onClick={handleSelect}
      role="radio"
      aria-checked={isActive}
      className="relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 min-h-[36px] flex items-center justify-center gap-1"
    >
      <span className={isActive ? "text-primary" : "text-tertiary hover:text-secondary"}>
        {label}
      </span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
          isActive
            ? "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300"
            : "bg-surface-muted text-tertiary"
        }`}
      >
        {count}
      </span>
    </button>
  )
}