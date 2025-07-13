import { db, auth } from "@/firebase/config"
import { doc, setDoc, deleteDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore"

export interface Billboard {
  id: string
  title: string
  address?: string
  city: string
  state?: string
  price: number
  photos: string[]
  description?: string
  userId: string
  timestamp: any
  facilities?: string[]
  type?: string
  size?: string
  width?: string
  height?: string
  location?: {
    lat: number
    lng: number
  }
}

// Save a billboard to user's saved ads
export async function saveBillboard(billboardId: string, billboardData: any) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to save billboards")
    }

    const userId = currentUser.uid
    const savedAdRef = doc(db, `users/${userId}/savedAds/${billboardId}`)

    // Create a sanitized version of the billboard data with default values for undefined fields
    const sanitizedData = {
      id: billboardId,
      title: billboardData.title || "Untitled Billboard",
      city: billboardData.city || "Unknown Location",
      state: billboardData.state || "",
      price: billboardData.price || 0,
      photos: Array.isArray(billboardData.photos) ? billboardData.photos : [],
      type: billboardData.type || "Billboard",
      facilities: Array.isArray(billboardData.facilities) ? billboardData.facilities : [],
      userId: billboardData.userId || "",
      collectionType: billboardData.collectionType || "billboards",
      savedAt: new Date(),
    }

    // Save the billboard data with timestamp
    await setDoc(savedAdRef, sanitizedData)

    return true
  } catch (error) {
    console.error("Error saving billboard:", error)
    throw error
  }
}

// Remove a billboard from user's saved ads
export async function unsaveBillboard(billboardId: string) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to unsave billboards")
    }

    const userId = currentUser.uid
    const savedAdRef = doc(db, `users/${userId}/savedAds/${billboardId}`)

    // Delete the saved billboard
    await deleteDoc(savedAdRef)

    return true
  } catch (error) {
    console.error("Error unsaving billboard:", error)
    throw error
  }
}

// Check if a billboard is saved by the current user
export async function isBillboardSaved(billboardId: string) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return false
    }

    const userId = currentUser.uid
    const savedAdRef = doc(db, `users/${userId}/savedAds/${billboardId}`)

    // Get the document
    const docSnap = await getDocs(
      query(collection(db, `users/${userId}/savedAds`), where("__name__", "==", billboardId)),
    )

    return !docSnap.empty
  } catch (error) {
    console.error("Error checking if billboard is saved:", error)
    return false
  }
}

// Get all saved billboards for the current user
export async function getSavedBillboards() {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to view saved billboards")
    }

    const userId = currentUser.uid
    const savedAdsRef = collection(db, `users/${userId}/savedAds`)

    // Get all saved billboards
    const querySnapshot = await getDocs(savedAdsRef)

    const savedBillboards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return savedBillboards
  } catch (error) {
    console.error("Error getting saved billboards:", error)
    throw error
  }
}

// Get all billboards from both collections
export async function getAllBillboards(): Promise<Billboard[]> {
  try {
    // Fetch from both collections
    const [billboardsSnapshot, digitalScreensSnapshot] = await Promise.all([
      getDocs(query(collection(db, "billboards"), orderBy("timestamp", "desc"))),
      getDocs(query(collection(db, "digital screens"), orderBy("timestamp", "desc"))),
    ])

    const allBillboards: Billboard[] = []

    // Add billboards
    billboardsSnapshot.forEach((doc) => {
      allBillboards.push({
        id: doc.id,
        ...doc.data(),
      } as Billboard)
    })

    // Add digital screens
    digitalScreensSnapshot.forEach((doc) => {
      allBillboards.push({
        id: doc.id,
        ...doc.data(),
      } as Billboard)
    })

    return allBillboards
  } catch (error) {
    console.error("Error fetching all billboards:", error)
    return []
  }
}
