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
  return NextResponse.json(users)
}
