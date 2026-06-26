import { getPrimaryRole } from "@/lib/utils/roles"

interface GroupAccessEntry {
  pages: string[]
}

export const DEFAULT_CONFIG: Record<string, GroupAccessEntry> = {
  ADMIN: {
    pages: ["/", "/admin", "/admin/data-management", "/admin/users", "/admin/users/deleted", "/admin/access-config", "/admin/user-permissions", "/admin/departments", "/admin/data/users", "/admin/data/academic-infrastructure", "/admin/reports", "/admin/reports/health", "/admin/reports/demand", "/admin/reports/responsiveness", "/admin/reports/backlog", "/admin/evaluations", "/admin/evaluations/results", "/admin/audit-trail"],
  },
  DEAN: {
    pages: ["/", "/dean", "/dean/upload", "/dean/departments", "/dean/reports", "/dean/evaluations", "/dean/evaluations/results", "/dean/data/users", "/dean/data/academic-infrastructure", "/dean/etl-hub", "/faculty/meetings", "/faculty/availability", "/faculty/reports"],
  },
  FACULTY: {
    pages: ["/", "/faculty", "/faculty/meetings", "/faculty/availability", "/faculty/upload", "/faculty/evaluations", "/faculty/evaluations/results"],
  },
  STUDENT: {
    pages: ["/", "/student", "/student/book", "/student/meetings", "/student/history", "/student/evaluations", "/evaluate"],
  },
  GUEST: {
    pages: [],
  },
}

export function clearAccessConfigCache() {}

export async function loadAccessConfig(): Promise<Record<string, GroupAccessEntry>> {
  try {
    const { supabase } = await import("@/lib/supabase")
    const { data, error } = await supabase.from("group_access").select("*")
    if (error) throw error

    const map: Record<string, GroupAccessEntry> = { ...DEFAULT_CONFIG }
    for (const row of data || []) {
      if (row.groupName === "ADMIN") {
        // ADMIN access is hardcoded — only persist additional non-admin pages
        const nonAdminPages = (row.pages || []).filter((p: string) => !p.startsWith("/admin") && p !== "/")
        map.ADMIN = { pages: [...DEFAULT_CONFIG.ADMIN.pages, ...nonAdminPages] }
      } else {
        map[row.groupName] = { pages: row.pages || [] }
      }
    }

    return map
  } catch (err) {
    console.error("[access] Failed to load from DB, using defaults:", (err as { message?: string })?.message)
    return DEFAULT_CONFIG
  }
}

export function userGroup(role: string): string {
  return getPrimaryRole(role)
}

export async function hasPageAccess(role: string, path: string): Promise<boolean> {
  const config = await loadAccessConfig()
  const entry = config[userGroup(role)]
  if (!entry) return false
  return entry.pages.some((p: string) => path === p || path.startsWith(p + "/"))
}
