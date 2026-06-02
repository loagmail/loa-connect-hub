import { userRepository } from "@/lib/repositories/factory"
import type { UserData } from "@/lib/types"

export async function softDeleteUser(id: string): Promise<void> {
  const user = await userRepository.findById(id)
  if (!user) throw new Error("User not found")
  if (user.deletedAt) throw new Error("User is already deleted")
  await userRepository.softDelete(id)
}

export async function restoreUser(id: string): Promise<void> {
  const user = await userRepository.findById(id)
  if (!user) throw new Error("User not found")
  if (!user.deletedAt) throw new Error("User is not deleted")
  await userRepository.restore(id)
}

export async function permanentDeleteUser(id: string): Promise<void> {
  const user = await userRepository.findById(id)
  if (!user) throw new Error("User not found")
  if (!user.deletedAt) throw new Error("User must be soft-deleted first before permanent deletion")
  await userRepository.permanentDelete(id)
}

export async function listDeletedUsers(): Promise<UserData[]> {
  return userRepository.listDeleted()
}
