"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/navbar"
import { MapPin, Star, Trash2, Filter, Search, Crown } from "lucide-react"
import { auth, db } from "@/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { getSavedBillboards, unsaveBillboard } from "@/utils/billboard-utils"
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore"

interface Billboard {
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
  savedAt?: any
  collectionType?: string
  isFeatured?: boolean
}

export default function SavedAdsPage() {
  const router = useRouter()
  const [savedBillboards, setSavedBillboards] = useState<Billboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchSavedBillboards(currentUser.uid)
      } else {
        router.push("/login?redirect=/saved-ads")
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchSavedBillboards = async (userId: string) => {
    try {
      setIsLoading(true)

      // Get saved billboards from Firebase
      const savedBillboards = await getSavedBillboards()

      // Get all featured ads to check featured status
      const featuredAdsQuery = query(collection(db, "featuredAds"))
      const featuredAdsSnapshot = await getDocs(featuredAdsQuery)
      const featuredAdIds = new Set()

      featuredAdsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.adId) {
          featuredAdIds.add(data.adId)
        }
        // Also check if the document ID itself is the billboard ID
        featuredAdIds.add(doc.id)
      })

      console.log("Featured ad IDs:", Array.from(featuredAdIds))

      // Fetch actual billboard data and featured status for each saved billboard
      const enrichedBillboards = await Promise.all(
        savedBillboards.map(async (savedBillboard) => {
          try {
            // Determine collection type
            const collectionType = savedBillboard.collectionType || "billboards"

            // Fetch actual billboard data from the original collection
            const billboardRef = doc(db, collectionType, savedBillboard.id)
            const billboardSnap = await getDoc(billboardRef)

            if (billboardSnap.exists()) {
              const actualData = billboardSnap.data()

              // Check if this billboard is featured
              const isFeatured = featuredAdIds.has(savedBillboard.id)

              console.log(`Billboard ${savedBillboard.id} featured status:`, isFeatured)

              return {
                ...savedBillboard,
                ...actualData,
                id: savedBillboard.id,
                price: actualData.price || 0,
                isFeatured,
                savedAt: savedBillboard.savedAt,
              }
            } else {
              // If original billboard doesn't exist, use saved data
              const isFeatured = featuredAdIds.has(savedBillboard.id)

              return {
                ...savedBillboard,
                isFeatured,
              }
            }
          } catch (error) {
            console.error("Error fetching billboard data:", error)
            return {
              ...savedBillboard,
              isFeatured: false,
            }
          }
        }),
      )

      // Sort by most recently saved
      enrichedBillboards.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date()
        const dateB = b.savedAt?.toDate?.() || new Date()
        return dateB.getTime() - dateA.getTime()
      })

      setSavedBillboards(enrichedBillboards)
    } catch (error) {
      console.error("Error fetching saved billboards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSaved = async (id: string) => {
    try {
      await unsaveBillboard(id)
      setSavedBillboards(savedBillboards.filter((billboard) => billboard.id !== id))
    } catch (error) {
      console.error("Error removing saved billboard:", error)
      alert("Failed to remove billboard. Please try again.")
    }
  }

  const filteredBillboards = savedBillboards.filter(
    (billboard) =>
      (billboard.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (billboard.state?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Billboards</h1>
          <p className="text-gray-600">Your collection of saved billboard advertisements</p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search saved billboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="modern-card animate-pulse">
                  <div className="h-48 w-full bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="flex justify-between">
                      <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : filteredBillboards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBillboards.map((billboard) => {
              // Get the actual price value, ensuring it's a number
              const actualPrice = Number(billboard.price) || 0

              return (
                <div key={billboard.id} className="modern-card group relative">
                  <div className="modern-card-image">
                    <Image
                      src={billboard.photos?.[0] || "/placeholder.svg?height=192&width=384"}
                      alt="Billboard"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>

                    {/* Featured badge */}
                    {billboard.isFeatured && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                          <Crown size={12} />
                          Featured
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <span className="badge badge-blue">{billboard.type || "Billboard"}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveSaved(billboard.id)}
                      className={`absolute ${billboard.isFeatured ? "top-12" : "top-3"} left-3 rounded-full bg-white/80 p-2 text-red-500 transition-all hover:bg-white hover:text-red-600`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div
                    className="modern-card-content cursor-pointer"
                    onClick={() => router.push(`/billboard/${billboard.id}`)}
                  >
                    <p className="mb-3 flex items-center text-sm text-gray-500">
                      <MapPin size={14} className="mr-1 text-blue-500" />
                      {billboard.city || "Unknown location"}
                      {billboard.state && `, ${billboard.state}`}
                    </p>
                    <div className="mb-3 text-lg font-bold text-gray-900">
                      <span className="text-green-600">PKR</span> {actualPrice.toLocaleString()}/mo
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <div className="flex items-center text-yellow-400">
                          <Star size={14} className="fill-yellow-400" />
                          <span className="ml-1 text-gray-700">4.8</span>
                        </div>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-gray-500">High visibility</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Star className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No saved billboards yet</h3>
            <p className="mb-4 text-gray-600">Browse billboards and save your favorites to view them here</p>
            <button onClick={() => router.push("/")} className="btn-primary inline-block">
              Browse Billboards
            </button>
          </div>
        )}
      </main>
    </>
  )
}
