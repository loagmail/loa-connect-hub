import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import SessionWrapper from "@/components/SessionWrapper"

export const metadata: Metadata = {
  title: "E-Consultation",
  description: "Academic e-Consultation booking system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SessionWrapper>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </SessionWrapper>
      </body>
    </html>
  )
}
