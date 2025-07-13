import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/firebase/config"
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log("🎯 Webhook received at:", new Date().toISOString())
  console.log("🌐 Request URL:", request.url)
  console.log("🔗 Request headers:", Object.fromEntries(request.headers.entries()))

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  console.log("📋 Webhook signature present:", !!sig)
  console.log("🔑 Webhook secret configured:", !!endpointSecret)
  console.log("📄 Body length:", body.length)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log("✅ Webhook signature verified successfully")
    console.log("🎉 Event type:", event.type)
    console.log("📄 Event ID:", event.id)
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message)
    console.error("🔍 Signature received:", sig)
    console.error("🔍 Expected endpoint secret exists:", !!endpointSecret)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session

      console.log("💳 Processing checkout.session.completed")
      console.log("🆔 Session ID:", session.id)
      console.log("💰 Amount paid:", session.amount_total)
      console.log("💰 Currency:", session.currency)
      console.log("📋 Session metadata:", JSON.stringify(session.metadata, null, 2))
      console.log("📋 Payment status:", session.payment_status)

      try {
        // Extract metadata
        const { contentId, contentType, planId, userId } = session.metadata || {}

        console.log("🔍 Extracted metadata:", {
          contentId,
          contentType,
          planId,
          userId,
        })

        if (!contentId || !contentType || !planId) {
          console.error("❌ Missing required metadata in webhook")
          console.error("Available metadata keys:", Object.keys(session.metadata || {}))
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        // Only process if payment was successful
        if (session.payment_status !== "paid") {
          console.error("❌ Payment not completed. Status:", session.payment_status)
          return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
        }

        // Feature the item using the EXACT same logic as your mobile app
        if (contentType === "job") {
          console.log("💼 Featuring job...")
          await featureJobAfterPayment(contentId, planId)
        } else {
          console.log("📺 Featuring billboard/digital screen...")
          await featureAdAfterPayment(contentId, planId)
        }

        console.log(`✅ Successfully featured ${contentType} ${contentId} with plan ${planId}`)

        return NextResponse.json({
          success: true,
          message: `${contentType} featured successfully`,
          contentId,
          planId,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("❌ Error processing webhook:", error)
        console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
        return NextResponse.json(
          {
            error: "Failed to process payment",
            details: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        )
      }
      break

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true, timestamp: new Date().toISOString() })
}

// Feature ad after successful payment - EXACT same logic as mobile app
async function featureAdAfterPayment(docId: string, planType: string) {
  try {
    console.log(`🚀 Starting featureAdAfterPayment for docId: ${docId}, planType: ${planType}`)

    const weeks = planType === "1_week" ? 1 : 3
    const now = new Date()
    const endDate = new Date(now.getTime() + 7 * weeks * 24 * 60 * 60 * 1000)

    console.log(`⏰ Featuring ad ${docId} for ${weeks} weeks`)
    console.log(`📅 Start time: ${now.toISOString()}`)
    console.log(`📅 End time: ${endDate.toISOString()}`)

    // Try billboards collection first
    let docRef = doc(db, "billboards", docId)
    let docSnap = await getDoc(docRef)

    console.log(`🔍 Checking billboards collection for ${docId}:`, docSnap.exists())

    if (!docSnap.exists()) {
      // Try digital screens collection
      console.log("📱 Trying digital screens collection...")
      docRef = doc(db, "digital screens", docId)
      docSnap = await getDoc(docRef)
      console.log(`🔍 Checking digital screens collection for ${docId}:`, docSnap.exists())
    }

    if (!docSnap.exists()) {
      console.error(`❌ Document ${docId} not found in either collection`)
      throw new Error(`Document ${docId} not found in either billboards or digital screens collection`)
    }

    const collectionName = docRef.parent.id
    console.log(`📄 Found document in ${collectionName} collection`)

    // Get current document data
    const currentData = docSnap.data()
    console.log("📋 Current document data:", {
      id: docId,
      title: currentData?.title,
      userId: currentData?.userId,
      city: currentData?.city,
      price: currentData?.price,
      featured: currentData?.featured,
      featuredUntil: currentData?.featuredUntil?.toDate?.()?.toISOString(),
    })

    // Update with EXACT same fields as mobile app
    const updateData = {
      featured: true,
      featuredUntil: Timestamp.fromDate(endDate),
      paymentStatus: "completed",
      featuredAt: Timestamp.fromDate(now),
    }

    console.log("📝 Updating document with:", {
      ...updateData,
      featuredUntil: endDate.toISOString(),
      featuredAt: now.toISOString(),
    })

    await updateDoc(docRef, updateData)

    console.log(`✅ Ad ${docId} featured successfully in ${collectionName} collection`)

    // Verify the update
    const updatedDoc = await getDoc(docRef)
    const updatedData = updatedDoc.data()
    console.log("✅ Verification - Updated document data:", {
      id: docId,
      featured: updatedData?.featured,
      featuredUntil: updatedData?.featuredUntil?.toDate?.()?.toISOString(),
      paymentStatus: updatedData?.paymentStatus,
      featuredAt: updatedData?.featuredAt?.toDate?.()?.toISOString(),
    })

    if (!updatedData?.featured) {
      throw new Error("Document update failed - featured field not set")
    }
  } catch (error) {
    console.error(`❌ Error featuring ad ${docId}:`, error)
    console.error("❌ Error details:", error instanceof Error ? error.message : "Unknown error")
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}

// Feature job after successful payment - EXACT same logic as mobile app
async function featureJobAfterPayment(jobId: string, planType: string) {
  try {
    console.log(`🚀 Starting featureJobAfterPayment for jobId: ${jobId}, planType: ${planType}`)

    const weeks = planType === "1_week" ? 1 : 3
    const now = new Date()
    const endDate = new Date(now.getTime() + 7 * weeks * 24 * 60 * 60 * 1000)

    console.log(`⏰ Featuring job ${jobId} for ${weeks} weeks`)
    console.log(`📅 Start time: ${now.toISOString()}`)
    console.log(`📅 End time: ${endDate.toISOString()}`)

    const docRef = doc(db, "jobs", jobId)
    const docSnap = await getDoc(docRef)

    console.log(`🔍 Checking jobs collection for ${jobId}:`, docSnap.exists())

    if (!docSnap.exists()) {
      console.error(`❌ Job ${jobId} not found`)
      throw new Error(`Job ${jobId} not found`)
    }

    // Get current document data
    const currentData = docSnap.data()
    console.log("📋 Current job data:", {
      id: jobId,
      title: currentData?.title,
      userId: currentData?.userId,
      featured: currentData?.featured,
      featuredUntil: currentData?.featuredUntil?.toDate?.()?.toISOString(),
    })

    // Update with EXACT same fields as mobile app
    const updateData = {
      featured: true,
      featuredUntil: Timestamp.fromDate(endDate),
      paymentStatus: "completed",
      featuredAt: Timestamp.fromDate(now),
    }

    console.log("📝 Updating job with:", {
      ...updateData,
      featuredUntil: endDate.toISOString(),
      featuredAt: now.toISOString(),
    })

    await updateDoc(docRef, updateData)

    console.log(`✅ Job ${jobId} featured successfully`)

    // Verify the update
    const updatedDoc = await getDoc(docRef)
    const updatedData = updatedDoc.data()
    console.log("✅ Verification - Updated job data:", {
      id: jobId,
      featured: updatedData?.featured,
      featuredUntil: updatedData?.featuredUntil?.toDate?.()?.toISOString(),
      paymentStatus: updatedData?.paymentStatus,
      featuredAt: updatedData?.featuredAt?.toDate?.()?.toISOString(),
    })

    if (!updatedData?.featured) {
      throw new Error("Document update failed - featured field not set")
    }
  } catch (error) {
    console.error(`❌ Error featuring job ${jobId}:`, error)
    console.error("❌ Error details:", error instanceof Error ? error.message : "Unknown error")
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}
