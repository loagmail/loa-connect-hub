import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role as string | undefined

    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (pathname.startsWith("/faculty") && role !== "FACULTY") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (pathname.startsWith("/api/schedules") && req.method !== "GET" && role !== "FACULTY" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl
        if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api/auth")) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
