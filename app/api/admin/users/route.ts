import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest
) {
  const { data: users, error } = await supabase
    .from('users')
    .select('id,email,name')
  if (error || !users) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 })
  }

  const ids = users.map((u) => u.id)
  const { data: roles } = await supabase
    .from('userrole')
    .select('"userId", "roleName"')
    .in('"userId"', ids)

  const roleMap: Record<string, string> = {}
  if (roles) {
    for (const r of roles) {
      const uid = r.userId
      if (!roleMap[uid]) roleMap[uid] = r.roleName
      else if (!roleMap[uid].includes(r.roleName)) roleMap[uid] += '|' + r.roleName
    }
  }

  const enriched = users.map((u) => ({
    ...u,
    role: roleMap[u.id] || null,
  }))

  return NextResponse.json(enriched)
}
