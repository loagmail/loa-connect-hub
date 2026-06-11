import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasRole } from '@/lib/utils/roles'

function isTrusted(request: NextRequest): boolean {
  return request.headers.get('x-auth-by') === 'user_permissions'
}

export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  if (isTrusted(request)) return null

  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined
  if (!role || !hasRole(role, 'ADMIN')) {
    return NextResponse.json({
      error: 'Forbidden',
      message: 'This API endpoint requires the ADMIN role or a user-permissions grant for this path.',
      path: request.nextUrl?.pathname,
    }, { status: 403 })
  }
  return null
}

export async function requireAdminOrDean(request: NextRequest): Promise<Response | null> {
  if (isTrusted(request)) return null

  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined
  if (!role || (!hasRole(role, 'ADMIN') && !hasRole(role, 'DEAN'))) {
    return NextResponse.json({
      error: 'Forbidden',
      message: 'This API endpoint requires the ADMIN or DEAN role, or a user-permissions grant for this path.',
      path: request.nextUrl?.pathname,
    }, { status: 403 })
  }
  return null
}

export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<Response | null> {
  if (isTrusted(request)) return null

  const session = await auth()
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined
  if (!role || !allowedRoles.some((r) => hasRole(role, r))) {
    return NextResponse.json({
      error: 'Forbidden',
      message: `This API endpoint requires one of these roles: ${allowedRoles.join(', ')}; or a user-permissions grant for this path.`,
      path: request.nextUrl?.pathname,
    }, { status: 403 })
  }
  return null
}
