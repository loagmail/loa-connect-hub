import { supabase } from '@/lib/supabase';

export interface IUserPermission {
  id: number;
  user_id: string;
  resource_path: string;
  grants: string[];
  denies: string[];
}

export async function findByUserId(userId: string): Promise<IUserPermission[] | null> {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching permissions', error);
    return null;
  }
  return data as IUserPermission[];
}

export async function upsertPermission(
  userId: string,
  resource: string,
  grants?: string[],
  denies?: string[]
): Promise<IUserPermission | null> {
  // Upsert by user_id+resource_path
  const { data, error } = await supabase
    .from('user_permissions')
    .upsert(
      {
        user_id: userId,
        resource_path: resource,
        grants: grants ?? [],
        denies: denies ?? [],
      },
      { onConflict: 'user_id,resource_path' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('Error upserting permission', error);
    return null;
  }
  return data as IUserPermission;
}
