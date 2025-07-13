import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🛒 Creating checkout session with data:", body)

    const { planId, contentId, contentType, userId, title } = body

    if (!planId || !contentId || !contentType || !userId) {
      console.error("❌ Missing required fields:", { planId, contentId, contentType, userId })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Plan pricing
    const planPrices = {
      "1_week": 99900, // PKR 999 in cents
      "3_weeks": 249900, // PKR 2499 in cents
    }

    const planNames = {
      "1_week": "1 Week Feature",
      "3_weeks": "3 Weeks Feature",
    }

    const price = planPrices[planId as keyof typeof planPrices]
    const planName = planNames[planId as keyof typeof planNames]

    if (!price || !planName) {
      console.error("❌ Invalid plan ID:", planId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    console.log("🌐 Base URL:", baseUrl)
    console.log("💰 Plan details:", { planId, planName, price })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "pkr",
            product_data: {
              name: `${planName} - ${contentType === "job" ? "Job" : "Billboard"} Feature`,
              description: `Feature your ${contentType === "job" ? "job posting" : "billboard"}: ${title || "Untitled"}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/feature-my-ads/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&type=${contentType}&ad_id=${contentId}&user_id=${userId}`,
      cancel_url: `${baseUrl}/feature-my-ads/plans?cancelled=true`,
      metadata: {
        contentId,
        contentType,
        planId,
        userId,
        title: title || "Untitled",
      },
    })

    console.log("✅ Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error("❌ Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
