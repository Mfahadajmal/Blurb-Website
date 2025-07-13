import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/config"
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, contentType, planId } = body

    console.log("🧪 Testing feature functionality:", { contentId, contentType, planId })

    if (!contentId || !contentType || !planId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const weeks = planId === "1_week" ? 1 : 3
    const now = new Date()
    const endDate = new Date(now.getTime() + 7 * weeks * 24 * 60 * 60 * 1000)

    if (contentType === "job") {
      const docRef = doc(db, "jobs", contentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }

      await updateDoc(docRef, {
        featured: true,
        featuredUntil: Timestamp.fromDate(endDate),
        paymentStatus: "completed",
        featuredAt: Timestamp.fromDate(now),
      })

      return NextResponse.json({
        success: true,
        message: "Job featured successfully",
        endDate: endDate.toISOString(),
      })
    } else {
      // Try billboards collection first
      let docRef = doc(db, "billboards", contentId)
      let docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        // Try digital screens collection
        docRef = doc(db, "digital screens", contentId)
        docSnap = await getDoc(docRef)
      }

      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Billboard not found" }, { status: 404 })
      }

      await updateDoc(docRef, {
        featured: true,
        featuredUntil: Timestamp.fromDate(endDate),
        paymentStatus: "completed",
        featuredAt: Timestamp.fromDate(now),
      })

      return NextResponse.json({
        success: true,
        message: "Billboard featured successfully",
        collection: docRef.parent.id,
        endDate: endDate.toISOString(),
      })
    }
  } catch (error) {
    console.error("❌ Test feature error:", error)
    return NextResponse.json(
      {
        error: "Failed to feature content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
