import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthCheck } from "@/components/auth-check"
import { ChatProvider } from "@/contexts/chat-context"
import { AuthProvider } from "@/context/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Blurb - Billboard Marketplace",
  description: "The premier marketplace for billboard advertising",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.svg", // This line adds your favicon
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ChatProvider>
            <AuthCheck>{children}</AuthCheck>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

