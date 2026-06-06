"use client"

import { SessionProvider } from "next-auth/react"
import { SWRConfig } from "swr"
import { fetcher } from "@/lib/api/client"
import { SidebarProvider } from "@/lib/contexts/sidebar"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
