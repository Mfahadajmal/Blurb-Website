"use client"

import { useEffect, useState } from "react"
import { auth } from "@/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold text-orange-600">Billboard Marketplace Dashboard</h1>
      <p className="text-gray-600">Welcome to your dashboard! You've successfully verified as a human.</p>

      {/* Dashboard content would go here */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">My Billboards</h2>
          <p className="text-gray-600">Manage your billboard listings</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Messages</h2>
          <p className="text-gray-600">Check your inbox for inquiries</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Analytics</h2>
          <p className="text-gray-600">View your billboard performance</p>
        </div>
      </div>
    </div>
  )
}
