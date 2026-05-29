import { supabase } from "@/lib/supabase"

export interface DatabaseSizeInfo {
  /** Total database size in bytes (from pg_database_size) */
  totalBytes: number | null
  /** Total file attachments size in bytes (from appointment_files) */
  fileBytes: number
  /** Estimated total size in bytes (fileBytes + row estimate) */
  estimatedTotalBytes: number
  /** Whether the RPC method was used (null means RPC wasn't available) */
  usedRpc: boolean
}

const FREE_TIER_BYTES = 500 * 1024 * 1024 // 500 MB

export async function getDatabaseSize(): Promise<DatabaseSizeInfo> {
  let totalBytes: number | null = null
  let usedRpc = false

  // Try RPC first (pg_database_size)
  try {
    const { data, error } = await supabase.rpc("get_database_size")
    if (!error && typeof data === "number" && data > 0) {
      totalBytes = data
      usedRpc = true
    }
  } catch {
    // RPC not available — fall through to file-based estimate
  }

  // File-based estimate: total size from appointment_files
  let fileBytes = 0
  try {
    const { data: files } = await supabase
      .from("appointment_files")
      .select("fileSize")

    if (files) {
      fileBytes = files.reduce((sum, f) => sum + (f.fileSize || 0), 0)
    }
  } catch {
    // Ignore query errors
  }

  // Estimate other table sizes from row counts
  let estimatedTotalBytes = fileBytes

  try {
    // Estimate appointments table size
    const { count: apptCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
    if (apptCount !== null) {
      // ~400 bytes per row (conservative estimate including indexes)
      estimatedTotalBytes += apptCount * 400
    }
  } catch {
    // Ignore
  }

  try {
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
    if (userCount !== null) {
      estimatedTotalBytes += userCount * 300
    }
  } catch {
    // Ignore
  }

  // If RPC succeeded, the totalBytes is authoritative
  // Otherwise use the estimate
  return {
    totalBytes,
    fileBytes,
    estimatedTotalBytes: totalBytes ?? estimatedTotalBytes,
    usedRpc,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

export function getStoragePercentage(bytes: number): number {
  return Math.min(100, Math.round((bytes / FREE_TIER_BYTES) * 100))
}

export function getStorageColor(percent: number): string {
  if (percent < 60) return "emerald"
  if (percent < 85) return "amber"
  return "red"
}
