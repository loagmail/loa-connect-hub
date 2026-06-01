import { supabase } from "@/lib/supabase"
import type { PasswordResetTokenData, IPasswordResetTokenRepository } from "../interfaces"

export const passwordResetTokenRepository: IPasswordResetTokenRepository = {
  async create(email, token, expiresAt) {
    const { error } = await supabase
      .from("password_reset_tokens")
      .insert({ email, token, expiresAt: expiresAt.toISOString() })
    if (error) throw error
  },
  async findByToken(token) {
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .single()
    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as PasswordResetTokenData
  },
  async markUsed(id) {
    const { error } = await supabase
      .from("password_reset_tokens")
      .update({ usedAt: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
  },
  async findByEmail(email) {
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("email", email)
      .order("createdAt", { ascending: false })
      .limit(1)
    if (error) throw error
    return (data?.[0] as PasswordResetTokenData) ?? null
  },
}
