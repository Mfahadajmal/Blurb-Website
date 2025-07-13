"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { doc, getDoc, enableNetwork } from "firebase/firestore"
import { db, auth } from "@/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import Navbar from "@/components/navbar"
import StartChatButton from "@/components/start-chat-button"
import {
  MapPin,
  DollarSign,
  Calendar,
  User,
  Heart,
  Share2,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Monitor,
  Square,
  MessageCircle,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Users,
  Navigation,
  Sun,
  Activity,
  ExternalLink,
} from "lucide-react"
import { saveBillboard, unsaveBillboard, isBillboardSaved } from "@/utils/billboard-utils"

interface Billboard {
  id: string
  userId: string
  title?: string
  photos: string[]
  city: string
  location?: {
    lat: number
    lng: number
  }
  price: string | number
  facilities?: string
  timestamp: any
  type?: string
}

interface UserData {
  username?: string
  email?: string
  profileImage?: string
  contact?: string
  phone?: string
  whatsapp?: string
}

export default function BillboardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const billboardId = params.id as string

  const [billboard, setBillboard] = useState<Billboard | null>(null)
  const [ownerData, setOwnerData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  const fetchBillboardDetail = async (attempt = 0) => {
    try {
      setIsLoading(true)
      setError(null)

      // Enable network in case it was disabled
      await enableNetwork(db)

      console.log(`Fetching billboard ${billboardId}, attempt ${attempt + 1}`)

      // Try both collections since we now have standard and digital
      let billboardDoc = await getDoc(doc(db, "billboards", billboardId))
      let collectionType = "billboards"

      if (!billboardDoc.exists()) {
        billboardDoc = await getDoc(doc(db, "digital screens", billboardId))
        collectionType = "digital screens"
      }

      if (!billboardDoc.exists()) {
        throw new Error("Billboard not found")
      }

      const billboardData = {
        id: billboardDoc.id,
        ...billboardDoc.data(),
        type: collectionType === "digital screens" ? "Digital Screen" : "Standard Billboard",
      } as Billboard

      setBillboard(billboardData)

      // Fetch owner data
      if (billboardData.userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", billboardData.userId))
          if (userDoc.exists()) {
            setOwnerData(userDoc.data() as UserData)
          }
        } catch (userError) {
          console.warn("Could not fetch user data:", userError)
        }
      }

      // Check if billboard is saved
      if (currentUser) {
        const saved = await isBillboardSaved(billboardId)
        setIsSaved(saved)
      }
    } catch (error: any) {
      console.error("Error fetching billboard details:", error)

      // Handle specific offline errors
      if (error.message?.includes("offline") || error.message?.includes("unavailable")) {
        if (attempt < 3) {
          console.log(`Retrying in ${(attempt + 1) * 2} seconds...`)
          setTimeout(
            () => {
              setRetryAttempt(attempt + 1)
              fetchBillboardDetail(attempt + 1)
            },
            (attempt + 1) * 2000,
          )
          return
        }
        setError("Unable to connect. Please check your internet connection and try again.")
      } else {
        setError(error.message || "Failed to load billboard details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (billboardId) {
      fetchBillboardDetail()
    }
  }, [billboardId])

  const handleSave = async () => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    if (!billboard) return

    try {
      setIsSaving(true)

      if (isSaved) {
        await unsaveBillboard(billboardId)
        setIsSaved(false)
      } else {
        await saveBillboard(billboardId, billboard)
        setIsSaved(true)
      }
    } catch (error) {
      console.error("Error saving billboard:", error)
      alert("Failed to save billboard. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Billboard in ${billboard?.city}`,
          text: `Check out this billboard listing`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleWhatsAppChat = () => {
    if (!ownerData) {
      alert("Owner information not available.")
      return
    }

    // Use the contact field from the database
    const phoneNumber = ownerData.contact || ownerData.whatsapp || ownerData.phone || ""

    console.log("Owner data:", ownerData) // Debug log
    console.log("Contact field:", ownerData.contact) // Debug log
    console.log("Raw phone number:", phoneNumber) // Debug log

    // If no phone number found, show alert
    if (!phoneNumber || phoneNumber.trim() === "") {
      alert("WhatsApp contact not available. Please use the email or in-app chat option.")
      return
    }

    // Clean the phone number - remove all non-numeric characters except +
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, "")

    console.log("Cleaned number:", cleanNumber) // Debug log

    // Handle Pakistani phone number formats
    if (cleanNumber.startsWith("+92")) {
      // Already has Pakistani country code, remove the + for WhatsApp
      cleanNumber = cleanNumber.substring(1)
    } else if (cleanNumber.startsWith("92")) {
      // Has Pakistani country code without +, keep as is
      cleanNumber = cleanNumber
    } else if (cleanNumber.startsWith("0")) {
      // Pakistani number starting with 0 (e.g., 03001234567), replace 0 with 92
      cleanNumber = "92" + cleanNumber.substring(1)
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith("3")) {
      // Pakistani mobile number without country code (e.g., 3001234567), add 92
      cleanNumber = "92" + cleanNumber
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith("03")) {
      // Pakistani number with leading 0 (e.g., 03001234567), replace 0 with 92
      cleanNumber = "92" + cleanNumber.substring(1)
    } else if (cleanNumber.startsWith("+")) {
      // Other international number, remove + for WhatsApp
      cleanNumber = cleanNumber.substring(1)
    } else if (cleanNumber.length < 10) {
      // Number too short, likely invalid
      alert("Invalid phone number format. Please contact the owner via email or in-app chat.")
      return
    }

    console.log("Final formatted number:", cleanNumber) // Debug log

    // Validate Pakistani number format (should be 92 followed by 10 digits)
    if (!cleanNumber.startsWith("92") || cleanNumber.length !== 12) {
      alert("Invalid Pakistani phone number format. Please contact the owner via email or in-app chat.")
      return
    }

    const message = `Hi! I'm interested in your ${billboard?.type} billboard in ${billboard?.city}. Can we discuss the details?`
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`

    console.log("WhatsApp URL:", whatsappUrl) // Debug log

    // Open WhatsApp
    window.open(whatsappUrl, "_blank")
  }

  const getBillboardFeatures = () => {
    const features = []
    if (billboard?.type === "Digital Screen") {
      features.push(
       
      )
    } else {
      
    }

    features.push(
     
    )

    return features
  }

  const getDirectionsUrl = () => {
    if (!billboard?.location) return "#"
    return `https://www.google.com/maps/dir/?api=1&destination=${billboard.location.lat},${billboard.location.lng}`
  }

  const getMapUrl = () => {
    if (!billboard?.location) return "#"
    return `https://www.google.com/maps/@${billboard.location.lat},${billboard.location.lng},15z`
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-300 mx-auto opacity-20"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Billboard Details</h3>
            <p className="text-gray-600">Please wait while we fetch the information...</p>
            {retryAttempt > 0 && (
              <div className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg inline-block">
                Retry attempt {retryAttempt}/3
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Billboard</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => fetchBillboardDetail()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!billboard) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Square size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Billboard Not Found</h2>
            <p className="text-gray-600 mb-6">The billboard you're looking for doesn't exist.</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  const features = getBillboardFeatures()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative">
          {/* Back Button */}
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => router.back()}
              className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-gray-700 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6 z-10 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white/90 backdrop-blur-md p-3 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              ) : (
                <Heart size={20} className={isSaved ? "fill-red-500 text-red-500" : "text-gray-600"} />
              )}
            </button>
            <button
              onClick={handleShare}
              className="bg-white/90 backdrop-blur-md p-3 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Share2 size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Main Image */}
          <div className="relative h-[70vh] overflow-hidden">
            <Image
              src={billboard.photos?.[selectedImageIndex] || "/placeholder.svg?height=600&width=1200"}
              alt="Billboard"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

            {/* Billboard Type Badge */}
            <div className="absolute bottom-6 left-6">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                {billboard.type === "Digital Screen" ? (
                  <Monitor size={18} className="text-blue-600" />
                ) : (
                  <Square size={18} className="text-gray-600" />
                )}
                <span className="font-semibold text-gray-800">{billboard.type}</span>
              </div>
            </div>

            {/* Price Badge */}
            
<div className="absolute bottom-6 right-6">
  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg">
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold">
        {typeof billboard.price === "string"
          ? billboard.price
          : billboard.price?.toLocaleString() || "Price on request"}
      </span>
      <span className="text-green-100 text-sm font-semibold">PKR/month</span>
    </div>
  </div>
</div>

          </div>

          {/* Thumbnail Images */}
          {billboard.photos && billboard.photos.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg">
                {billboard.photos.slice(0, 5).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? "border-blue-500 scale-110 shadow-lg"
                        : "border-white/50 hover:border-blue-300"
                    }`}
                  >
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Billboard ${index + 1}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {billboard.photos.length > 5 && (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    +{billboard.photos.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Location & Basic Info */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {billboard.title || `Billboard in ${billboard.city}`}
                        </h1>
                        <p className="text-gray-600">{billboard.city} - Prime advertising location</p>
                      </div>
                    </div>

                    {billboard.timestamp && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={16} />
                        <span>
                          Listed{" "}
                          {new Date(billboard.timestamp.toDate()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <feature.icon size={20} className={feature.color} />
                      <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {billboard.facilities && (
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award size={20} className="text-purple-600" />
                    </div>
                    Facilities & Features
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {showFullDescription
                        ? billboard.facilities
                        : `${billboard.facilities.slice(0, 200)}${billboard.facilities.length > 200 ? "..." : ""}`}
                    </p>
                    {billboard.facilities.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors duration-200"
                      >
                        {showFullDescription ? "Show Less" : "Read More"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Location Map */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Navigation size={20} className="text-green-600" />
                  </div>
                  Location & Accessibility
                </h3>

                {/* Custom Map Display */}
                <div className="rounded-xl overflow-hidden shadow-lg mb-4">
                  {billboard.location ? (
                    <div className="w-full h-[300px] bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center relative border-2 border-gray-200">
                      {/* Grid Pattern Background */}
                      <div className="absolute inset-0 opacity-20">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="1" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      </div>

                      {/* Billboard Marker */}
                      <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                        <div className="relative">
                          <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-[140px] text-center border">
                            <div className="text-sm font-medium text-gray-900">
                              {billboard.title || "Billboard Location"}
                            </div>
                            <div className="text-xs text-gray-600">{billboard.city}</div>
                          </div>
                        </div>
                      </div>

                      {/* Corner Info */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Billboard Location</span>
                        </div>
                      </div>

                      {/* Zoom Level Indicator */}
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                        <span className="text-xs text-gray-600">Zoom: 15x</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Location map not available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{billboard.city}, Pakistan</div>
                      {billboard.location && (
                        <div className="text-sm text-gray-600">
                          Coordinates: {billboard.location.lat.toFixed(6)}, {billboard.location.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>

                  {billboard.location && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <a
                        href={getMapUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Google Maps
                      </a>
                      <a
                        href={getDirectionsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Owner Info */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 sticky top-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      {ownerData?.profileImage ? (
                        <Image
                          src={ownerData.profileImage || "/placeholder.svg"}
                          alt="Owner"
                          width={64}
                          height={64}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={28} className="text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">
                      {ownerData?.username || ownerData?.email || "Billboard Owner"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Owner since{" "}
                      {billboard.timestamp
                        ? new Date(billboard.timestamp.toDate()).getFullYear()
                        : new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Contact Buttons */}
                {currentUser && currentUser.uid !== billboard.userId && (
                  <div className="space-y-3">
                    {/* In-App Chat Button */}
                    <StartChatButton
                      otherUserId={billboard.userId}
                      otherUserData={ownerData}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    />

                    {/* WhatsApp Button */}
                    <button
                      onClick={handleWhatsAppChat}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <MessageCircle size={20} />
                      <span className="font-semibold">WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Shield size={14} className="text-green-500" />
                      <span>Verified Owner</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-blue-500" />
                      <span>Premium Listing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Safety First</h4>
                    <p className="text-sm text-yellow-700">
                      Always verify property details and meet in safe, public locations. Report any suspicious activity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
