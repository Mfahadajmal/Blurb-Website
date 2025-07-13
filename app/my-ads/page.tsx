"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  MapPin,
  Star,
  Crown,
  Briefcase,
  Monitor,
  BarcodeIcon as Billboard,
  Plus,
  Calendar,
  Eye,
} from "lucide-react"
import { AuthCheck } from "@/components/auth-check"
import Navbar from "@/components/navbar"

interface MyAd {
  id: string
  title: string
  city: string
  price?: number
  salary?: string
  photos: string[]
  type: "billboard" | "digital-screen" | "job"
  timestamp: any
  isActive?: boolean
  companyName?: string
  jobType?: string
}

export default function MyAdsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myAds, setMyAds] = useState<MyAd[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredAds, setFeaturedAds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<"all" | "billboard" | "digital-screen" | "job">("all")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchMyAds(currentUser.uid)
        fetchFeaturedAds()
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchFeaturedAds = async () => {
    try {
      const featuredSnapshot = await getDocs(collection(db, "featuredAds"))
      const featuredIds = new Set<string>()

      featuredSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.adId) {
          featuredIds.add(data.adId)
        }
        featuredIds.add(doc.id)
      })

      setFeaturedAds(featuredIds)
    } catch (error) {
      console.error("Error fetching featured ads:", error)
    }
  }

  const fetchMyAds = async (userId: string) => {
    try {
      setLoading(true)
      const allAds: MyAd[] = []

      // Fetch billboards
      const billboardsQuery = query(collection(db, "billboards"), where("userId", "==", userId))
      const billboardsSnapshot = await getDocs(billboardsQuery)
      billboardsSnapshot.forEach((doc) => {
        const data = doc.data()
        allAds.push({
          id: doc.id,
          title: data.title || "Billboard",
          city: data.city,
          price: data.price,
          photos: data.photos || [],
          type: "billboard",
          timestamp: data.timestamp,
        })
      })

      // Fetch digital screens
      const digitalScreensQuery = query(collection(db, "digital screens"), where("userId", "==", userId))
      const digitalScreensSnapshot = await getDocs(digitalScreensQuery)
      digitalScreensSnapshot.forEach((doc) => {
        const data = doc.data()
        allAds.push({
          id: doc.id,
          title: data.title || "Digital Screen",
          city: data.city,
          price: data.price,
          photos: data.photos || [],
          type: "digital-screen",
          timestamp: data.timestamp,
        })
      })

      // Fetch jobs
      const jobsQuery = query(collection(db, "jobs"), where("userId", "==", userId))
      const jobsSnapshot = await getDocs(jobsQuery)
      jobsSnapshot.forEach((doc) => {
        const data = doc.data()
        allAds.push({
          id: doc.id,
          title: data.title,
          city: data.city,
          salary: data.salary,
          photos: data.photos || [],
          type: "job",
          timestamp: data.timestamp,
          isActive: data.isActive,
          companyName: data.companyName,
          jobType: data.jobType,
        })
      })

      // Sort all ads by timestamp (client-side sorting)
      allAds.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        const aTime = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
        const bTime = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
        return bTime - aTime // Newest first
      })

      setMyAds(allAds)
    } catch (error) {
      console.error("Error fetching my ads:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAd = async (adId: string, adType: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return

    try {
      let collectionName = ""
      switch (adType) {
        case "billboard":
          collectionName = "billboards"
          break
        case "digital-screen":
          collectionName = "digital screens"
          break
        case "job":
          collectionName = "jobs"
          break
        default:
          return
      }

      await deleteDoc(doc(db, collectionName, adId))

      // Remove from local state
      setMyAds(myAds.filter((ad) => ad.id !== adId))

      alert("Ad deleted successfully!")
    } catch (error) {
      console.error("Error deleting ad:", error)
      alert("Error deleting ad. Please try again.")
    }
  }

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case "billboard":
        return <Billboard className="h-4 w-4" />
      case "digital-screen":
        return <Monitor className="h-4 w-4" />
      case "job":
        return <Briefcase className="h-4 w-4" />
      default:
        return null
    }
  }

  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case "billboard":
        return "Billboard"
      case "digital-screen":
        return "Digital Screen"
      case "job":
        return "Job"
      default:
        return ""
    }
  }

  const getAdTypeColor = (type: string) => {
    switch (type) {
      case "billboard":
        return "bg-blue-100 text-blue-800"
      case "digital-screen":
        return "bg-purple-100 text-purple-800"
      case "job":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAdClick = (ad: MyAd) => {
    if (ad.type === "job") {
      router.push(`/jobs/${ad.id}`)
    } else {
      router.push(`/billboard/${ad.id}`)
    }
  }

  const filteredAds = filter === "all" ? myAds : myAds.filter((ad) => ad.type === filter)

  const getStats = () => {
    const billboards = myAds.filter((ad) => ad.type === "billboard").length
    const digitalScreens = myAds.filter((ad) => ad.type === "digital-screen").length
    const jobs = myAds.filter((ad) => ad.type === "job").length

    return { billboards, digitalScreens, jobs, total: myAds.length }
  }

  const stats = getStats()

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-lg text-gray-600">Loading your ads...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <AuthCheck>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Ads</h1>
                <p className="text-lg text-gray-600">Manage all your posted content in one place</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => router.push("/list-billboard")} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  List Billboard
                </Button>
                <Button onClick={() => router.push("/post-job")} variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Ads</div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.billboards}</div>
                <div className="text-sm text-gray-600">Billboards</div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.digitalScreens}</div>
                <div className="text-sm text-gray-600">Digital Screens</div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.jobs}</div>
                <div className="text-sm text-gray-600">Jobs</div>
              </div>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
              All ({stats.total})
            </Button>
            <Button
              variant={filter === "billboard" ? "default" : "outline"}
              onClick={() => setFilter("billboard")}
              size="sm"
            >
              <Billboard className="h-4 w-4 mr-1" />
              Billboards ({stats.billboards})
            </Button>
            <Button
              variant={filter === "digital-screen" ? "default" : "outline"}
              onClick={() => setFilter("digital-screen")}
              size="sm"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Digital Screens ({stats.digitalScreens})
            </Button>
            <Button variant={filter === "job" ? "default" : "outline"} onClick={() => setFilter("job")} size="sm">
              <Briefcase className="h-4 w-4 mr-1" />
              Jobs ({stats.jobs})
            </Button>
          </div>

          {/* Ads Grid */}
          {filteredAds.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Billboard className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {filter === "all" ? "No ads posted yet" : `No ${getAdTypeLabel(filter).toLowerCase()}s posted yet`}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filter === "all"
                  ? "Start by posting your first billboard, digital screen, or job to reach your audience"
                  : `Create your first ${getAdTypeLabel(filter).toLowerCase()} to get started`}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push("/list-billboard")} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  List Billboard
                </Button>
                <Button onClick={() => router.push("/post-job")} variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <Card
                  key={ad.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md"
                >
                  <div className="relative group" onClick={() => handleAdClick(ad)}>
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {ad.photos && ad.photos.length > 0 ? (
                        <img
                          src={ad.photos[0] || "/placeholder.svg"}
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                          {getAdTypeIcon(ad.type)}
                        </div>
                      )}
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Featured Badge */}
                    {featuredAds.has(ad.id) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 shadow-lg">
                          <Crown className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Ad Type Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getAdTypeColor(ad.type)} border-0 shadow-sm`}>
                        {getAdTypeIcon(ad.type)}
                        <span className="ml-1">{getAdTypeLabel(ad.type)}</span>
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3
                        className="font-semibold text-lg text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleAdClick(ad)}
                      >
                        {ad.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAd(ad.id, ad.type)
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {ad.city}
                    </div>

                    {ad.type === "job" ? (
                      <div className="space-y-2">
                        {ad.companyName && <p className="text-sm text-gray-600 font-medium">{ad.companyName}</p>}
                        {ad.jobType && <p className="text-sm text-gray-500">{ad.jobType}</p>}
                        {ad.salary && <p className="text-xl font-bold text-green-600">PKR {ad.salary}</p>}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${ad.isActive ? "bg-green-500" : "bg-red-500"}`}></div>
                          <span className="text-xs text-gray-500 font-medium">
                            {ad.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-green-600">PKR {Number(ad.price || 0).toLocaleString()}</p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                     
                      <div className="flex items-center text-gray-400 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {ad.timestamp?.toDate?.()?.toLocaleDateString() || "Recently posted"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthCheck>
  )
}
