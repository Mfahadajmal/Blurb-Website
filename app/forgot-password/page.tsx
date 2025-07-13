"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/firebase/config"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await sendPasswordResetEmail(auth, email)
      setEmailSent(true)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError("Failed to send password reset email. Please check your email address.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    const newCode = [...verificationCode]
    newCode[index] = value

    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would verify the code with Firebase
    // For now, we'll just show a success message
    alert("Code verified successfully!")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {!emailSent ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-1 text-2xl font-bold text-blue-600">Forgot Password</h1>
              <p className="text-sm text-gray-500">Enter your email to reset your password</p>
            </div>

            {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">{error}</div>}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-1 text-2xl font-bold text-blue-600">We have sent you an email!</h1>
              <p className="text-sm text-gray-500">Follow the steps to change password and come back here!</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
             

              <button
                type="submit"
                
              >
                
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Didn&apos;t receive the email? </span>
              <button onClick={() => setEmailSent(false)} className="font-medium text-blue-600 hover:underline">
                Resend
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
