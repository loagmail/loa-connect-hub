import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt";
import { supabase } from "@/lib/supabase"
import { loadAccessConfig } from "@/lib/access"

const ROLE_PRIORITY = ["ADMIN", "DEAN", "FACULTY", "STUDENT", "GUEST"]

function getPrimaryRole(roles: string): string {
  if (!roles) return "GUEST"
  const userRoles = roles.split("|")
  for (const p of ROLE_PRIORITY) {
    if (userRoles.includes(p)) return p
  }
  return "GUEST"
}

/// Returns true (allow), false (deny), or null (no explicit entry — fall through)
async function checkUserPermission(userId: string, resource: string): Promise<boolean | null> {
  try {
    const { data } = await supabase
      .from('user_permissions')
      .select('grants, denies')
      .eq('user_id', userId)
      .eq('resource_path', resource);
    if (!data || data.length === 0) return null;
    for (const row of data as any[]) {
      const grants = row.grants ?? [];
      const denies = row.denies ?? [];
      if (denies.includes('access')) return false;
      if (grants.includes('access')) return true;
    }
  } catch (_) {}
  return null;
}

const PUBLIC_PATHS = new Set([
  "/login", "/activate", "/forgot-password", "/change-password",
  "/setup-password", "/403",
])

const PUBLIC_PREFIXES = ["/_next", "/api/auth", "/api/test-auth"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return NextResponse.next()
  }

  if (pathname.includes(".")) return NextResponse.next()

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const token = await getToken({ req: request, secret })

  if (!token) {
    if (pathname === "/") return NextResponse.next()
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const rawRole = (token as Record<string, unknown>).role as string | undefined
  const group = getPrimaryRole(rawRole ?? "GUEST")
  const userId = (token as any).id

  // Layer 1: User-level permission override (highest priority)
  const userPerm = await checkUserPermission(userId, pathname);
  if (userPerm === true) return NextResponse.next();
  if (userPerm === false) return NextResponse.redirect(new URL("/403", request.url));

  // Authenticated API requests are allowed by default unless explicitly denied above
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Layer 2: DB access-config merged with defaults
  const config = await loadAccessConfig();
  const entry = config[group];
  const dbAccess = entry?.pages?.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (dbAccess) return NextResponse.next();

  // Layer 3: Hardcoded default (only reached if DB config also denies)
  return NextResponse.redirect(new URL("/403", request.url));
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
