"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/config"
import { Loader2 } from "lucide-react"

interface AuthCheckProps {
  children: React.ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Protected routes that require authentication
      const protectedRoutes = ["/list-billboard", "/my-ads", "/send-ad"]

      if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
        // Redirect to login if trying to access protected routes without auth
        router.push("/login?redirect=" + encodeURIComponent(pathname))
      } else if (user && (pathname === "/login" || pathname === "/signup")) {
        // Redirect to homepage if logged in and trying to access auth pages
        router.push("/")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
