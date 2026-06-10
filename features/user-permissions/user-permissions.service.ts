import { findByUserId, upsertPermission, IUserPermission } from '@/features/user-permissions/user-permissions.repository';
import { auth } from '@/lib/auth';

export async function getUserPermissions(userId: string): Promise<IUserPermission[] | null> {
  return await findByUserId(userId);
}

export async function setUserPermissions(
  userId: string,
  resource: string,
  grants: string[],
  denies: string[]
): Promise<IUserPermission | null> {
  const session = await auth();
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
  if (!role?.includes('ADMIN')) {
    throw new Error('Unauthorized');
  }
  return await upsertPermission(userId, resource, grants, denies);
}
