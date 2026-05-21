import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    const role = (session.user as any).role
    if (role === "STUDENT") redirect("/student")
    if (role === "FACULTY") redirect("/faculty")
    if (role === "DEAN") redirect("/dean")
    if (role === "ADMIN") redirect("/admin")
  }
  redirect("/login")
}
