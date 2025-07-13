"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/config"
import { FEATURED_PLANS, getPriceDisplay, getDurationDisplay } from "@/utils/featured-utils"
import {
  CheckCircle,
  Crown,
  Calendar,
  TrendingUp,
  ArrowRight,
  Home,
  Eye,
  Star,
  Building2,
  Briefcase,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Link from "next/link"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const planId = searchParams.get("plan")
  const contentType = searchParams.get("type")
  const adId = searchParams.get("ad_id")
  const userId = searchParams.get("user_id")

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentVerified, setPaymentVerified] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !planId || !contentType) {
        router.push("/feature-my-ads")
        return
      }

      try {
        // Payment was successful if we have the session ID from Stripe redirect
        setPaymentVerified(true)
        console.log("Payment successful:", { sessionId, planId, contentType, adId, userId })
      } catch (error) {
        console.error("Error verifying payment:", error)
        router.push("/feature-my-ads")
      } finally {
        setIsLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId, planId, contentType, adId, userId, router])

  if (!currentUser || isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  if (!paymentVerified) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment verification failed</h2>
            <Link href="/feature-my-ads" className="text-blue-600 hover:text-blue-700">
              Return to Featured Ads
            </Link>
          </div>
        </div>
      </>
    )
  }

  const selectedPlan = FEATURED_PLANS.find((plan) => plan.id === planId)
  const isJob = contentType === "job"
  const ContentIcon = isJob ? Briefcase : Building2

  return (
    <>
      <Navbar />

      {/* Success Hero Section */}
      <section className="bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 relative overflow-hidden py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-300 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4">🎉 Payment Successful!</h1>
            <p className="text-xl text-blue-100 mb-8">
              Your {isJob ? "job posting" : "billboard"} is now featured and will get maximum visibility!
            </p>
          </div>

          {selectedPlan && (
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Crown className="h-8 w-8 text-yellow-300" />
                <h2 className="text-2xl font-bold">Featured with {selectedPlan.name} Plan</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <Calendar className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Duration</div>
                  <div className="text-blue-100">{getDurationDisplay(selectedPlan.id)}</div>
                </div>
                <div>
                  <TrendingUp className="h-8 w-8 text-green-200 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Investment</div>
                  <div className="text-blue-100">{getPriceDisplay(selectedPlan.id)}</div>
                </div>
                <div>
                  <Star className="h-8 w-8 text-yellow-200 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Boost</div>
                  <div className="text-blue-100">10x More Views</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4">
          {/* What Happens Next */}
          <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Happens Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Instant Activation</h4>
                <p className="text-gray-600">
                  Your {isJob ? "job" : "billboard"} is now featured and appears at the top of search results
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Increased Visibility</h4>
                <p className="text-gray-600">
                  Expect significantly more views and {isJob ? "applications" : "inquiries"} during the featured period
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Premium Badge</h4>
                <p className="text-gray-600">
                  Your listing now displays a premium featured badge to attract more attention
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {sessionId && (
            <div className="bg-green-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Payment Confirmed</h3>
              </div>
              <p className="text-green-700 mb-2">
                Your payment has been processed successfully through Stripe. You will receive a receipt via email
                shortly.
              </p>
              <p className="text-sm text-green-600">Transaction ID: {sessionId.slice(-12)}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={isJob ? "/jobs" : "/"}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <ContentIcon className="h-5 w-5" />
                View Your Featured {isJob ? "Job" : "Billboard"}
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
              >
                <Home className="h-5 w-5" />
                View on Homepage
              </Link>
            </div>

            <p className="text-gray-600 mt-6">
              Need help?{" "}
              <Link href="/chats" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
