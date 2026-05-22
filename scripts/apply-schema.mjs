import { readFileSync } from "fs"
import pkg from "pg"
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const sql = readFileSync("supabase-schema.sql", "utf-8")
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"))

  for (const stmt of statements) {
    try {
      await pool.query(stmt + ";")
      console.log("✓", stmt.slice(0, 80))
    } catch (err) {
      console.error("✗", stmt.slice(0, 80))
      console.error("  ", err.message)
    }
  }
  console.log("\nSchema applied!")
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
