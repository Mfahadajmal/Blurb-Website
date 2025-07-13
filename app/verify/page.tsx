"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/firebase/config"
import { applyActionCode, checkActionCode } from "firebase/auth"
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const verifyEmail = async () => {
      const actionCode = searchParams.get("oobCode")

      if (!actionCode) {
        setVerificationStatus("error")
        setErrorMessage("Invalid verification link")
        return
      }

      try {
        // Verify the action code is valid
        await checkActionCode(auth, actionCode)

        // Apply the email verification
        await applyActionCode(auth, actionCode)

        setVerificationStatus("success")

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } catch (error: any) {
        console.error("Email verification error:", error)
        setVerificationStatus("error")

        switch (error.code) {
          case "auth/expired-action-code":
            setErrorMessage("This verification link has expired. Please request a new one.")
            break
          case "auth/invalid-action-code":
            setErrorMessage("This verification link is invalid. Please check your email for the correct link.")
            break
          case "auth/user-disabled":
            setErrorMessage("This account has been disabled.")
            break
          default:
            setErrorMessage("Failed to verify email. Please try again.")
        }
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {verificationStatus === "loading" && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been verified. You'll be redirected to your dashboard shortly.
              </p>
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Back to Login
                </Link>
                <div>
                  <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create a new account
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
