"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { FEATURED_PLANS, getPriceDisplay, getDurationDisplay } from "@/utils/featured-utils"
import {
  Crown,
  Check,
  TrendingUp,
  Zap,
  Star,
  ArrowLeft,
  Clock,
  Target,
  Eye,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Link from "next/link"

// Load Stripe.js
const loadStripe = async () => {
  if (typeof window !== "undefined") {
    const { loadStripe } = await import("@stripe/stripe-js")
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return null
}

function PlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const billboardId = searchParams.get("billboardId")
  const jobId = searchParams.get("jobId")
  const type = searchParams.get("type") // 'billboard' or 'job'

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [content, setContent] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [stripe, setStripe] = useState<any>(null)

  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await loadStripe()
      setStripe(stripeInstance)
    }
    initStripe()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        router.push("/login?redirect=/featured-ads")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchContent = async () => {
      if (!billboardId && !jobId) {
        router.push("/featured-ads")
        return
      }

      try {
        setIsLoadingContent(true)

        if (type === "billboard" && billboardId) {
          // Try billboards collection first
          let contentRef = doc(db, "billboards", billboardId)
          let contentDoc = await getDoc(contentRef)

          if (!contentDoc.exists()) {
            // Try digital screens collection
            contentRef = doc(db, "digital screens", billboardId)
            contentDoc = await getDoc(contentRef)
          }

          if (contentDoc.exists()) {
            setContent({
              id: contentDoc.id,
              ...contentDoc.data(),
              type: "billboard",
            })
          } else {
            router.push("/featured-ads")
          }
        } else if (type === "job" && jobId) {
          const contentRef = doc(db, "jobs", jobId)
          const contentDoc = await getDoc(contentRef)

          if (contentDoc.exists()) {
            setContent({
              id: contentDoc.id,
              ...contentDoc.data(),
              type: "job",
            })
          } else {
            router.push("/featured-ads")
          }
        } else {
          router.push("/featured-ads")
        }
      } catch (error) {
        console.error("Error fetching content:", error)
        router.push("/featured-ads")
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchContent()
  }, [billboardId, jobId, type, router])

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !content || !currentUser || !stripe) return

    try {
      setIsLoading(true)

      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan,
          contentId: content.id,
          contentType: content.type,
          contentTitle: content.title,
          userId: currentUser.uid,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Use Stripe's redirect method instead of window.location
      if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })

        if (error) {
          console.error("Stripe redirect error:", error)
          throw new Error(error.message)
        }
      } else {
        throw new Error("No session ID received")
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      alert("Failed to proceed to payment. Please try again.")
      setIsLoading(false)
    }
  }

  if (!currentUser || isLoadingContent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  if (!content) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Content not found</h2>
            <Link href="/featured-ads" className="text-blue-600 hover:text-blue-700">
              Return to Featured Ads
            </Link>
          </div>
        </div>
      </>
    )
  }

  const isJob = content.type === "job"
  const contentTitle = isJob ? content.title : content.title
  const ContentIcon = isJob ? Briefcase : Building2

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden py-16 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="text-center">
            <Link
              href="/featured-ads"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Featured Ads
            </Link>

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">Choose Your Plan</span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <ContentIcon className="h-8 w-8 text-blue-200" />
              <h1 className="text-4xl md:text-5xl font-bold">Feature This Ad</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Select the perfect plan to boost your {isJob ? "job posting" : "billboard"}'s visibility and reach more{" "}
              {isJob ? "job seekers" : "customers"}
            </p>
          </div>
        </div>
      </section>

      <main className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">10x More Views</h3>
              <p className="text-gray-600">
                Featured {isJob ? "jobs" : "ads"} appear at the top of search results and get significantly more
                visibility
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Placement</h3>
              <p className="text-gray-600">
                Your {isJob ? "job" : "billboard"} will be highlighted with special badges and premium positioning
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Activation</h3>
              <p className="text-gray-600">Your featured status activates immediately after successful payment</p>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {FEATURED_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-blue-500 ring-4 ring-blue-100 scale-105"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
                } ${plan.popular ? "ring-2 ring-purple-200" : ""}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedPlan === plan.id && (
                  <div className="absolute top-6 right-6">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                      plan.popular ? "bg-gradient-to-br from-purple-100 to-pink-100" : "bg-blue-100"
                    }`}
                  >
                    {plan.duration === 7 && <Clock className="h-8 w-8 text-blue-600" />}
                    {plan.duration === 21 && <TrendingUp className="h-8 w-8 text-purple-600" />}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{getPriceDisplay(plan.id)}</span>
                    <span className="text-gray-600 ml-2">for {getDurationDisplay(plan.id)}</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Premium placement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Featured badge</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Top search results</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">Increased visibility</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="text-gray-700">{plan.duration} days duration</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-500">
                      {Math.round(plan.price / plan.duration).toLocaleString()} PKR per day
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Secure Payment with Stripe</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Your payment is processed securely through Stripe. We accept all major credit and debit cards.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Visa</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Mastercard</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">American Express</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">Discover</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleProceedToPayment}
              disabled={!selectedPlan || isLoading || !stripe}
              className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                selectedPlan && !isLoading && stripe
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Redirecting to Stripe...
                </div>
              ) : !stripe ? (
                "Loading Payment System..."
              ) : selectedPlan ? (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  Pay {getPriceDisplay(selectedPlan)} with Stripe
                </div>
              ) : (
                "Select a Plan to Continue"
              )}
            </button>

            {selectedPlan && stripe && (
              <p className="text-gray-600 mt-4">
                You'll be redirected to Stripe's secure checkout page to complete your payment
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default function PlansPage() {
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
      <PlansContent />
    </Suspense>
  )
}
