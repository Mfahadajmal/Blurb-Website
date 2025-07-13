import { db, auth } from "@/firebase/config"
import { collection, doc, updateDoc, getDocs, query, where, getDoc, orderBy, Timestamp } from "firebase/firestore"

export interface FeaturedPlan {
  id: string
  name: string
  duration: number // days
  price: number // PKR
  popular?: boolean
}

export const FEATURED_PLANS: FeaturedPlan[] = [
  {
    id: "1_week",
    name: "1 Week Feature",
    duration: 7,
    price: 999, // PKR 999
    popular: false,
  },
  {
    id: "3_weeks",
    name: "3 Weeks Feature",
    duration: 21,
    price: 2499, // PKR 2499
    popular: true,
  },
]

// Feature a billboard with selected plan
export async function featureBillboard(billboardId: string, planId: string, billboardData: any) {
  try {
    const plan = FEATURED_PLANS.find((p) => p.id === planId)
    if (!plan) {
      throw new Error("Invalid plan selected")
    }

    const weeks = planId === "1_week" ? 1 : 3
    const now = new Date()
    const featuredUntil = new Date(now.getTime() + 7 * weeks * 24 * 60 * 60 * 1000)

    // Try to update the original billboard - check both collections
    let billboardRef = doc(db, "billboards", billboardId)
    let billboardDoc = await getDoc(billboardRef)

    if (!billboardDoc.exists()) {
      // Try digital screens collection
      billboardRef = doc(db, "digital screens", billboardId)
      billboardDoc = await getDoc(billboardRef)
    }

    if (billboardDoc.exists()) {
      // Update the document in the correct collection with featured status
      await updateDoc(billboardRef, {
        featured: true,
        featuredUntil: Timestamp.fromDate(featuredUntil),
        featuredAt: Timestamp.fromDate(now),
        featuredPlan: plan.name,
        featuredPrice: plan.price,
        paymentStatus: "completed",
      })
    } else {
      throw new Error(`Billboard ${billboardId} not found in either collection`)
    }

    return true
  } catch (error) {
    console.error("Error featuring billboard:", error)
    throw error
  }
}

// Feature a job with selected plan
export async function featureJob(jobId: string, planId: string, jobData: any) {
  try {
    const plan = FEATURED_PLANS.find((p) => p.id === planId)
    if (!plan) {
      throw new Error("Invalid plan selected")
    }

    const weeks = planId === "1_week" ? 1 : 3
    const now = new Date()
    const featuredUntil = new Date(now.getTime() + 7 * weeks * 24 * 60 * 60 * 1000)

    // Update the original job document
    const jobRef = doc(db, "jobs", jobId)
    await updateDoc(jobRef, {
      featured: true,
      featuredUntil: Timestamp.fromDate(featuredUntil),
      featuredAt: Timestamp.fromDate(now),
      featuredPlan: plan.name,
      featuredPrice: plan.price,
      paymentStatus: "completed",
    })

    return true
  } catch (error) {
    console.error("Error featuring job:", error)
    throw error
  }
}

// Get user's own billboards
export async function getUserBillboards() {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to view your billboards")
    }

    const userId = currentUser.uid

    // Get from billboards collection
    const billboardsQuery = query(collection(db, "billboards"), where("userId", "==", userId))
    const billboardsSnapshot = await getDocs(billboardsQuery)
    const billboards = billboardsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get from digital screens collection
    const digitalQuery = query(collection(db, "digital screens"), where("userId", "==", userId))
    const digitalSnapshot = await getDocs(digitalQuery)
    const digitalScreens = digitalSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      collectionType: "digital screens",
    }))

    // Combine and sort by timestamp on the client side
    const allBillboards = [...billboards, ...digitalScreens]

    // Sort by timestamp (newest first)
    allBillboards.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
      return bTime.getTime() - aTime.getTime()
    })

    return allBillboards
  } catch (error) {
    console.error("Error getting user billboards:", error)
    throw error
  }
}

// Get user's own jobs
export async function getUserJobs() {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to view your jobs")
    }

    const userId = currentUser.uid

    // Get from jobs collection
    const jobsQuery = query(collection(db, "jobs"), where("userId", "==", userId))
    const jobsSnapshot = await getDocs(jobsQuery)
    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Sort by timestamp (newest first)
    jobs.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
      return bTime.getTime() - aTime.getTime()
    })

    return jobs
  } catch (error) {
    console.error("Error getting user jobs:", error)
    throw error
  }
}

// Get all featured billboards from both collections
export async function getFeaturedBillboards() {
  try {
    const now = new Date()
    console.log("🔍 Getting featured billboards, current time:", now.toISOString())

    // Get featured billboards from billboards collection
    const billboardsQuery = query(collection(db, "billboards"), where("featured", "==", true))
    const billboardsSnapshot = await getDocs(billboardsQuery)
    const featuredBillboards = billboardsSnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log(`📋 Billboard ${doc.id}:`, {
        featured: data.featured,
        featuredUntil: data.featuredUntil?.toDate?.()?.toISOString() || data.featuredUntil,
        isActive: data.featuredUntil ? (data.featuredUntil?.toDate?.() || new Date(data.featuredUntil)) > now : false,
      })
      return {
        id: doc.id,
        ...data,
        type: "Standard Billboard",
      }
    })

    // Get featured billboards from digital screens collection
    const digitalQuery = query(collection(db, "digital screens"), where("featured", "==", true))
    const digitalSnapshot = await getDocs(digitalQuery)
    const featuredDigital = digitalSnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log(`📱 Digital Screen ${doc.id}:`, {
        featured: data.featured,
        featuredUntil: data.featuredUntil?.toDate?.()?.toISOString() || data.featuredUntil,
        isActive: data.featuredUntil ? (data.featuredUntil?.toDate?.() || new Date(data.featuredUntil)) > now : false,
      })
      return {
        id: doc.id,
        ...data,
        type: "Digital Screen",
      }
    })

    // Combine all featured billboards
    const allFeatured = [...featuredBillboards, ...featuredDigital]

    // Filter out expired featured ads and sort by featuredAt
    const activeFeatured = allFeatured
      .filter((billboard) => {
        if (!billboard.featuredUntil) {
          console.log(`❌ No featuredUntil for ${billboard.id}`)
          return false
        }
        const featuredUntil = billboard.featuredUntil?.toDate?.() || new Date(billboard.featuredUntil)
        const isActive = featuredUntil > now
        console.log(`${isActive ? "✅" : "❌"} ${billboard.id} active:`, isActive, featuredUntil.toISOString())
        return isActive
      })
      .sort((a, b) => {
        const aTime = a.featuredAt?.toDate?.() || new Date(a.featuredAt || 0)
        const bTime = b.featuredAt?.toDate?.() || new Date(b.featuredAt || 0)
        return bTime.getTime() - aTime.getTime()
      })

    console.log(`🎯 Found ${activeFeatured.length} active featured billboards`)
    return activeFeatured
  } catch (error) {
    console.error("Error getting featured billboards:", error)
    return []
  }
}

// Get all featured jobs
export async function getFeaturedJobs() {
  try {
    const now = new Date()

    // Get featured jobs
    const jobsQuery = query(collection(db, "jobs"), where("featured", "==", true))
    const jobsSnapshot = await getDocs(jobsQuery)
    const featuredJobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Filter out expired featured jobs and sort by featuredAt
    const activeFeatured = featuredJobs
      .filter((job) => {
        if (!job.featured || !job.featuredUntil) return false
        const featuredUntil = job.featuredUntil?.toDate?.() || new Date(job.featuredUntil)
        return featuredUntil > now
      })
      .sort((a, b) => {
        const aTime = a.featuredAt?.toDate?.() || new Date(a.featuredAt || 0)
        const bTime = b.featuredAt?.toDate?.() || new Date(b.featuredAt || 0)
        return bTime.getTime() - aTime.getTime()
      })

    return activeFeatured
  } catch (error) {
    console.error("Error getting featured jobs:", error)
    return []
  }
}

// Check if billboard is featured and not expired
export async function isBillboardFeatured(billboardId: string) {
  try {
    // Try billboards collection first
    let billboardRef = doc(db, "billboards", billboardId)
    let billboardDoc = await getDoc(billboardRef)

    if (!billboardDoc.exists()) {
      // Try digital screens collection
      billboardRef = doc(db, "digital screens", billboardId)
      billboardDoc = await getDoc(billboardRef)
    }

    if (!billboardDoc.exists()) {
      return false
    }

    const data = billboardDoc.data()
    if (!data.featured || !data.featuredUntil) {
      return false
    }

    const featuredUntil = data.featuredUntil?.toDate?.() || new Date(data.featuredUntil)
    const isActive = featuredUntil > new Date()

    // If expired, remove featured status
    if (!isActive && data.featured) {
      await updateDoc(billboardRef, {
        featured: false,
        featuredUntil: null,
        featuredAt: null,
        featuredPlan: null,
        featuredPrice: null,
        paymentStatus: "expired",
      })
    }

    return isActive
  } catch (error) {
    console.error("Error checking featured status:", error)
    return false
  }
}

// Check if job is featured and not expired
export async function isJobFeatured(jobId: string) {
  try {
    const jobRef = doc(db, "jobs", jobId)
    const jobDoc = await getDoc(jobRef)

    if (!jobDoc.exists()) {
      return false
    }

    const data = jobDoc.data()
    if (!data.featured || !data.featuredUntil) {
      return false
    }

    const featuredUntil = data.featuredUntil?.toDate?.() || new Date(data.featuredUntil)
    const isActive = featuredUntil > new Date()

    // If expired, remove featured status
    if (!isActive && data.featured) {
      await updateDoc(jobRef, {
        featured: false,
        featuredUntil: null,
        featuredAt: null,
        featuredPlan: null,
        featuredPrice: null,
        paymentStatus: "expired",
      })
    }

    return isActive
  } catch (error) {
    console.error("Error checking featured status:", error)
    return false
  }
}

// Get billboards with featured ads interspersed (every 7th position)
export async function getBillboardsWithFeatured(collectionName: string) {
  try {
    const now = new Date()
    console.log(`🔍 Getting billboards from ${collectionName} with featured interspersed`)

    // Get all billboards from the specified collection
    const allQuery = query(collection(db, collectionName), orderBy("timestamp", "desc"))
    const allSnapshot = await getDocs(allQuery)
    const allBillboards = allSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`📊 Total billboards in ${collectionName}:`, allBillboards.length)

    // Separate featured and regular billboards
    const featuredBillboards = allBillboards.filter((billboard) => {
      if (!billboard.featured || !billboard.featuredUntil) return false
      const featuredUntil = billboard.featuredUntil?.toDate?.() || new Date(billboard.featuredUntil)
      const isActive = featuredUntil > now
      console.log(`${isActive ? "⭐" : "❌"} ${billboard.id} featured status:`, isActive)
      return isActive
    })

    const regularBillboards = allBillboards.filter((billboard) => {
      if (!billboard.featured || !billboard.featuredUntil) return true
      const featuredUntil = billboard.featuredUntil?.toDate?.() || new Date(billboard.featuredUntil)
      return featuredUntil <= now
    })

    console.log(`⭐ Featured: ${featuredBillboards.length}, Regular: ${regularBillboards.length}`)

    // Sort both arrays by timestamp (newest first)
    featuredBillboards.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
      return bTime.getTime() - aTime.getTime()
    })

    regularBillboards.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
      return bTime.getTime() - aTime.getTime()
    })

    // Intersperse featured ads every 7th position
    const result = []
    let regularIndex = 0
    let featuredIndex = 0

    for (let i = 0; i < regularBillboards.length + featuredBillboards.length; i++) {
      // Every 7th position (0, 6, 12, 18...) should be featured if available
      if ((i + 1) % 7 === 0 && featuredIndex < featuredBillboards.length) {
        result.push({ ...featuredBillboards[featuredIndex], isFeaturedPosition: true })
        featuredIndex++
      } else if (regularIndex < regularBillboards.length) {
        result.push(regularBillboards[regularIndex])
        regularIndex++
      } else if (featuredIndex < featuredBillboards.length) {
        // If we run out of regular ads, add remaining featured ads
        result.push({ ...featuredBillboards[featuredIndex], isFeaturedPosition: true })
        featuredIndex++
      }
    }

    console.log(`🎯 Final result: ${result.length} billboards with featured interspersed`)
    return result
  } catch (error) {
    console.error("Error getting billboards with featured:", error)
    return []
  }
}

// Helper function to get price display
export const getPriceDisplay = (planId: string): string => {
  const plan = FEATURED_PLANS.find((p) => p.id === planId)
  if (!plan) return "N/A"
  return `PKR ${plan.price.toLocaleString()}`
}

// Helper function to get plan duration display
export const getDurationDisplay = (planId: string): string => {
  const plan = FEATURED_PLANS.find((p) => p.id === planId)
  if (!plan) return "N/A"
  return `${plan.duration} days`
}
