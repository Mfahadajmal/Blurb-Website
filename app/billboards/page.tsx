"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/navbar"
import { MapPin, Heart, ArrowRight, Star, Sparkles } from "lucide-react"
import { auth, db } from "@/firebase/config"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { saveBillboard, unsaveBillboard, getSavedBillboards } from "@/utils/billboard-utils"

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
  size?: string
  width?: string
  height?: string
  location?: {
    lat: number
    lng: number
  }
  featured?: boolean
  featuredUntil?: any
}

export default function BillboardsPage() {
  const router = useRouter()
  const [featuredBillboards, setFeaturedBillboards] = useState<Billboard[]>([])
  const [regularBillboards, setRegularBillboards] = useState<Billboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedBillboardIds, setSavedBillboardIds] = useState<string[]>([])
  const [savingBillboardId, setSavingBillboardId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        setIsLoading(true)
        const snapshot = await getDocs(query(collection(db, "billboards"), orderBy("timestamp", "desc")))
        const now = new Date()

        const allBillboards = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Billboard[]

        const featured = allBillboards.filter(
          (b) => b.featured && (b.featuredUntil?.toDate?.() || new Date(b.featuredUntil)) > now
        )
        const regular = allBillboards.filter(
          (b) => !b.featured || (b.featuredUntil?.toDate?.() || new Date(b.featuredUntil)) <= now
        )

        setFeaturedBillboards(featured)
        setRegularBillboards(regular)
      } catch (error) {
        console.error("Error fetching billboards:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillboards()
  }, [])

  useEffect(() => {
    const loadSavedBillboards = async () => {
      if (currentUser) {
        try {
          const savedBillboards = await getSavedBillboards()
          setSavedBillboardIds(savedBillboards.map((b) => b.id))
        } catch (error) {
          console.error("Error loading saved billboards:", error)
        }
      }
    }

    loadSavedBillboards()
  }, [currentUser])

  const handleSaveBillboard = async (billboard: Billboard) => {
    if (!currentUser) {
      router.push("/login?redirect=/billboards")
      return
    }

    try {
      setSavingBillboardId(billboard.id)

      if (savedBillboardIds.includes(billboard.id)) {
        await unsaveBillboard(billboard.id)
        setSavedBillboardIds((prev) => prev.filter((id) => id !== billboard.id))
      } else {
        const billboardToSave = {
          id: billboard.id,
          title: billboard.title || "Untitled Billboard",
          city: billboard.city || "Unknown Location",
          state: billboard.state || "",
          price: typeof billboard.price === "number" ? billboard.price : 0,
          photos: Array.isArray(billboard.photos) ? billboard.photos : [],
          type: billboard.type || "Billboard",
          facilities: Array.isArray(billboard.facilities) ? billboard.facilities : [],
          userId: billboard.userId || "",
          collectionType: "billboards",
        }

        await saveBillboard(billboard.id, billboardToSave)
        setSavedBillboardIds((prev) => [...prev, billboard.id])
      }
    } catch (error) {
      console.error("Error saving billboard:", error)
      alert("Failed to save billboard. Please try again.")
    } finally {
      setSavingBillboardId(null)
    }
  }

  const renderBillboardCard = (billboard: Billboard, isFeatured: boolean) => (
    <div
      key={billboard.id}
      onClick={() => router.push(`/billboard/${billboard.id}`)}
      className="modern-card hover-lift group cursor-pointer"
    >
      <div className="modern-card-image">
        <Image
          src={billboard.photos?.[0] || "/placeholder.svg?height=192&width=384"}
          alt={billboard.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>

        {isFeatured && (
          <div className="absolute top-3 left-3">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles size={12} />
              Featured
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="badge badge-blue">Billboard</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSaveBillboard(billboard)
          }}
          className="absolute top-3 left-3 rounded-full bg-white/80 p-2 text-red-500 transition-all hover:bg-white hover:text-red-600"
          style={{ marginTop: isFeatured ? "40px" : "0" }}
        >
          {savingBillboardId === billboard.id ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
          ) : (
            <Heart size={18} className={savedBillboardIds.includes(billboard.id) ? "fill-red-500" : ""} />
          )}
        </button>
      </div>

      <div className="modern-card-content">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-1">{billboard.title}</h3>
        <p className="mb-3 flex items-center text-sm text-gray-500">
          <MapPin size={14} className="mr-1 text-blue-500" />
          {billboard.city}
          {billboard.state && `, ${billboard.state}`}
        </p>
        <div className="mb-3 text-lg font-bold text-gray-900">
          <span className="text-green-600">PKR</span>{" "}
          {billboard.price?.toLocaleString() || "Price on request"}/mo
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
           
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-500">View Details</span>
          </div>
          <div className="rounded-full bg-blue-50 p-2 text-blue-600 transition-colors group-hover:bg-blue-100">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Billboards</h1>
            <p className="text-gray-600">Browse all available standard billboard advertising spaces</p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="modern-card animate-pulse">
                  <div className="h-48 w-full bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="flex justify-between">
                      <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {featuredBillboards.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Billboards</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                    {featuredBillboards.map((b) => renderBillboardCard(b, true))}
                  </div>
                </>
              )}

              {regularBillboards.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Billboards</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularBillboards.map((b) => renderBillboardCard(b, false))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
