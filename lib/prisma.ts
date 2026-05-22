let prismaClient: any

function getPrisma(): any {
  if (!prismaClient) {
    const { PrismaClient } = require("@/lib/generated/client")
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
    const path = require("path")
    const dbPath = path.join(process.cwd(), "prisma", "dev.db")
    const adapter = new PrismaBetterSqlite3({ url: dbPath })
    prismaClient = new PrismaClient({ adapter })
  }
  return prismaClient
}

export const prisma = new Proxy({} as any, {
  get(_, prop) {
    return (getPrisma() as any)[prop]
  },
})
