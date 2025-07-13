"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/navbar"
import { MapPin, Heart, ArrowRight, Sparkles } from "lucide-react"
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
  salary: number
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
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [featuredScreens, setFeaturedScreens] = useState<Billboard[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<Billboard[]>([])
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
    const fetchAll = async () => {
      try {
        setIsLoading(true)
        const now = new Date()

        const billboardSnap = await getDocs(query(collection(db, "billboards"), orderBy("timestamp", "desc")))
        const billboards = billboardSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.featured && (item.featuredUntil?.toDate?.() || new Date(item.featuredUntil)) > now) as Billboard[]
        setBillboards(billboards)

        const screenSnap = await getDocs(query(collection(db, "digital screens"), orderBy("timestamp", "desc")))
        const screens = screenSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.featured && (item.featuredUntil?.toDate?.() || new Date(item.featuredUntil)) > now) as Billboard[]
        setFeaturedScreens(screens)

        const jobsSnap = await getDocs(query(collection(db, "jobs"), orderBy("timestamp", "desc")))
        const jobs = jobsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.featured && (item.featuredUntil?.toDate?.() || new Date(item.featuredUntil)) > now) as Billboard[]
        setFeaturedJobs(jobs)
      } catch (error) {
        console.error("Error fetching featured data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [])

  useEffect(() => {
    const loadSavedBillboards = async () => {
      if (currentUser) {
        try {
          const saved = await getSavedBillboards()
          setSavedBillboardIds(saved.map((b) => b.id))
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
        await saveBillboard(billboard.id, billboard)
        setSavedBillboardIds((prev) => [...prev, billboard.id])
      }
    } catch (error) {
      console.error("Error saving billboard:", error)
      alert("Failed to save billboard. Please try again.")
    } finally {
      setSavingBillboardId(null)
    }
  }

  const renderCards = (data: Billboard[], type: string) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => {
            const path =
              type === "digital-screen" ? `/billboard/${item.id}` :
              type === "job" ? `/jobs/${item.id}` :
              `/billboard/${item.id}`
            router.push(path)
          }}
          className="modern-card hover-lift group cursor-pointer"
        >
          <div className="modern-card-image">
            <Image
              src={item.photos?.[0] || "/placeholder.svg?height=192&width=384"}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>

            <div className="absolute top-3 left-3">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} />
                Featured
              </div>
            </div>

            <div className="absolute top-3 right-3">
              <span className="badge badge-blue capitalize">{type.replace("-", " ")}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSaveBillboard(item)
              }}
              className="absolute top-3 left-3 rounded-full bg-white/80 p-2 text-red-500 transition-all hover:bg-white hover:text-red-600 mt-10"
            >
              {savingBillboardId === item.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              ) : (
                <Heart size={18} className={savedBillboardIds.includes(item.id) ? "fill-red-500" : ""} />
              )}
            </button>
          </div>

          <div className="modern-card-content">
            <h3 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
            <p className="mb-3 flex items-center text-sm text-gray-500">
              <MapPin size={14} className="mr-1 text-blue-500" />
              {item.city}{item.state && `, ${item.state}`}
            </p>

            <div className="mb-3 text-lg font-bold text-gray-900">
              <span className="text-green-600">PKR</span>{" "}
              {type === "job"
                ? (item.salary ? item.salary.toLocaleString() + "/mo" : "Salary not disclosed")
                : (item.price ? item.price.toLocaleString() : "Price on request")}
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
      ))}
    </div>
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Featured Listings</h1>
            <p className="text-gray-600">Browse all available Featured Billboards, Digital Screens, and Jobs</p>
          </div>

          {!isLoading && (
            <>
              {billboards.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Billboards</h2>
                  {renderCards(billboards, "billboard")}
                </div>
              )}
              {featuredScreens.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Digital Screens</h2>
                  {renderCards(featuredScreens, "digital-screen")}
                </div>
              )}
              {featuredJobs.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Jobs</h2>
                  {renderCards(featuredJobs, "job")}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
