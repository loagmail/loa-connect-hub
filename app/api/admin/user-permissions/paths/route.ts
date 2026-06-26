import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: groups, error } = await supabase
    .from('group_access')
    .select('pages');
  if (error || !groups) {
    return NextResponse.json({ error: 'Failed to fetch paths' }, { status: 500 });
  }
  const pathsSet = new Set<string>();
  groups.forEach(g => {
    if (Array.isArray(g.pages)) {
      g.pages.forEach((p: string) => pathsSet.add(p));
    }
  });
  const adminExclusive = new Set(["/admin/data-management"])
  return NextResponse.json({ paths: Array.from(pathsSet).filter((p) => !adminExclusive.has(p)) });
}
