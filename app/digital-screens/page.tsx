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

export default function DigitalScreensPage() {
  const router = useRouter()
  const [featuredScreens, setFeaturedScreens] = useState<Billboard[]>([])
  const [regularScreens, setRegularScreens] = useState<Billboard[]>([])
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
    const fetchDigitalScreens = async () => {
      try {
        setIsLoading(true)
        const snapshot = await getDocs(query(collection(db, "digital screens"), orderBy("timestamp", "desc")))
        const now = new Date()

        const allScreens = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Billboard[]

        const featured = allScreens.filter(
          (b) => b.featured && (b.featuredUntil?.toDate?.() || new Date(b.featuredUntil)) > now
        )
        const regular = allScreens.filter(
          (b) => !b.featured || (b.featuredUntil?.toDate?.() || new Date(b.featuredUntil)) <= now
        )

        setFeaturedScreens(featured)
        setRegularScreens(regular)
      } catch (error) {
        console.error("Error fetching digital screens:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDigitalScreens()
  }, [])

  useEffect(() => {
    const loadSavedBillboards = async () => {
      if (currentUser) {
        try {
          const savedBillboards = await getSavedBillboards()
          setSavedBillboardIds(savedBillboards.map((billboard) => billboard.id))
        } catch (error) {
          console.error("Error loading saved billboards:", error)
        }
      }
    }

    loadSavedBillboards()
  }, [currentUser])

  const handleSaveBillboard = async (billboard: Billboard) => {
    if (!currentUser) {
      router.push("/login?redirect=/digital-screens")
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
          title: billboard.title || "Untitled Digital Screen",
          city: billboard.city || "Unknown Location",
          state: billboard.state || "",
          price: typeof billboard.price === "number" ? billboard.price : 0,
          photos: Array.isArray(billboard.photos) ? billboard.photos : [],
          type: billboard.type || "Digital Screen",
          facilities: Array.isArray(billboard.facilities) ? billboard.facilities : [],
          userId: billboard.userId || "",
          collectionType: "digital screens",
        }

        await saveBillboard(billboard.id, billboardToSave)
        setSavedBillboardIds((prev) => [...prev, billboard.id])
      }
    } catch (error) {
      console.error("Error saving digital screen:", error)
      alert("Failed to save digital screen. Please try again.")
    } finally {
      setSavingBillboardId(null)
    }
  }

  const isBillboardCurrentlyFeatured = (billboard: Billboard) => {
    if (!billboard.featured || !billboard.featuredUntil) return false
    const featuredUntil = billboard.featuredUntil?.toDate?.() || new Date(billboard.featuredUntil)
    return featuredUntil > new Date()
  }

  const renderCard = (screen: Billboard, isFeatured: boolean) => (
    <div
      key={screen.id}
      onClick={() => router.push(`/billboard/${screen.id}`)}
      className="modern-card hover-lift group cursor-pointer"
    >
      <div className="modern-card-image">
        <Image
          src={screen.photos?.[0] || "/placeholder.svg?height=192&width=384"}
          alt={screen.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles size={12} /> Featured
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge badge-blue">Digital Screen</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSaveBillboard(screen)
          }}
          className="absolute top-3 left-3 rounded-full bg-white/80 p-2 text-red-500 transition-all hover:bg-white hover:text-red-600"
          style={{ marginTop: isFeatured ? "40px" : "0" }}
        >
          {savingBillboardId === screen.id ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
          ) : (
            <Heart size={18} className={savedBillboardIds.includes(screen.id) ? "fill-red-500" : ""} />
          )}
        </button>
      </div>
      <div className="modern-card-content">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-1">{screen.title}</h3>
        <p className="mb-3 flex items-center text-sm text-gray-500">
          <MapPin size={14} className="mr-1 text-blue-500" />
          {screen.city}{screen.state && `, ${screen.state}`}
        </p>
        <div className="mb-3 text-lg font-bold text-gray-900">
          <span className="text-green-600">PKR</span> {screen.price?.toLocaleString() || "Price on request"}/mo
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Screens</h1>
            <p className="text-gray-600">Browse all available digital screen advertising spaces</p>
          </div>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="modern-card animate-pulse">
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
              {featuredScreens.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Digital Screens</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                    {featuredScreens.map((screen) => renderCard(screen, true))}
                  </div>
                </>
              )}
              {regularScreens.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Digital Screens</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularScreens.map((screen) => renderCard(screen, false))}
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