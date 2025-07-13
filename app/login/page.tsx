"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/config"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success message from signup
    const message = searchParams.get("message")
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      const redirect = searchParams.get("redirect")
      router.push(redirect || "/")
    } catch (error: any) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.")
      } else {
        setError("An error occurred during login. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-bold text-blue-600">Welcome back to Blurb</h1>
          <p className="text-sm text-gray-500">Sign in to your account</p>
        </div>

        {successMessage && <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">{successMessage}</div>}

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
