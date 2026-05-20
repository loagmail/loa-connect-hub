import { PrismaClient } from "@/lib/generated/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { hash } from "bcryptjs"

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await hash("password123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@econsult.com" },
    update: {},
    create: { name: "Admin", email: "admin@econsult.com", passwordHash, role: "ADMIN" },
  })

  const faculty1 = await prisma.user.upsert({
    where: { email: "faculty1@econsult.com" },
    update: {},
    create: { name: "Dr. Smith", email: "faculty1@econsult.com", passwordHash, role: "FACULTY" },
  })

  const faculty2 = await prisma.user.upsert({
    where: { email: "faculty2@econsult.com" },
    update: {},
    create: { name: "Prof. Johnson", email: "faculty2@econsult.com", passwordHash, role: "FACULTY" },
  })

  const student = await prisma.user.upsert({
    where: { email: "student@econsult.com" },
    update: {},
    create: { name: "Alice Student", email: "student@econsult.com", passwordHash, role: "STUDENT" },
  })

  console.log({ admin, faculty1, faculty2, student })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
