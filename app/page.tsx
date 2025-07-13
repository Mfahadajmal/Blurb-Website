"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/navbar"
import {
  MapPin,
  Search,
  ArrowRight,
  Star,
  Users,
  Zap,
  Map,
  Shield,
  TrendingUp,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  DollarSign,
  Clock,
} from "lucide-react"
import { auth } from "@/firebase/config"
import { useRouter } from "next/navigation"
import type { JSX } from "react"
import { saveBillboard, unsaveBillboard, getSavedBillboards } from "@/utils/billboard-utils"
import { onAuthStateChanged } from "firebase/auth"
import { getFeaturedBillboards, getFeaturedJobs, getBillboardsWithFeatured } from "@/utils/featured-utils"
import { getAllJobs, type Job } from "@/utils/job-utils"
import InteractiveMap from "@/components/interactive-map"

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
  isFeaturedPosition?: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [digitalScreens, setDigitalScreens] = useState<Billboard[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoadingBillboards, setIsLoadingBillboards] = useState(true)
  const [isLoadingDigital, setIsLoadingDigital] = useState(true)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [featuredBillboards, setFeaturedBillboards] = useState<Billboard[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCity, setSearchCity] = useState("")
  const [searchType, setSearchType] = useState("")
  const [searchMinPrice, setSearchMinPrice] = useState("")
  const [searchMaxPrice, setSearchMaxPrice] = useState("")
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<Billboard[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const [savedBillboardIds, setSavedBillboardIds] = useState<string[]>([])
  const [savingBillboardId, setSavingBillboardId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Refs for horizontal scrolling
  const billboardsScrollRef = useRef<HTMLDivElement>(null)
  const digitalScrollRef = useRef<HTMLDivElement>(null)
  const jobsScrollRef = useRef<HTMLDivElement>(null)
  const featuredScrollRef = useRef<HTMLDivElement>(null)

  // Format time ago function
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Recently"

    const now = new Date()
    const date = timestamp.toDate()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    } else {
      return "Just now"
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        setIsLoadingBillboards(true)
        // Get billboards with featured ads interspersed
        const billboardsData = await getBillboardsWithFeatured("billboards")
        setBillboards(billboardsData)
      } catch (error) {
        console.error("Error fetching billboards:", error)
      } finally {
        setIsLoadingBillboards(false)
      }
    }

    const fetchDigitalScreens = async () => {
      try {
        setIsLoadingDigital(true)
        // Get digital screens with featured ads interspersed
        const digitalData = await getBillboardsWithFeatured("digital screens")
        setDigitalScreens(digitalData)
      } catch (error) {
        console.error("Error fetching digital screens:", error)
      } finally {
        setIsLoadingDigital(false)
      }
    }

    const fetchJobs = async () => {
      try {
        setIsLoadingJobs(true)
        const jobsData = await getAllJobs()
        setJobs(jobsData)
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setIsLoadingJobs(false)
      }
    }

    const fetchFeaturedContent = async () => {
      try {
        setIsLoadingFeatured(true)
        const [featuredBillboardsData, featuredJobsData] = await Promise.all([
          getFeaturedBillboards(),
          getFeaturedJobs(),
        ])
        setFeaturedBillboards(featuredBillboardsData)
        setFeaturedJobs(featuredJobsData)
      } catch (error) {
        console.error("Error fetching featured content:", error)
      } finally {
        setIsLoadingFeatured(false)
      }
    }

    fetchBillboards()
    fetchDigitalScreens()
    fetchJobs()
    fetchFeaturedContent()
  }, [])

  // Horizontal scroll functions
  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 300
      const newScrollLeft =
        direction === "left" ? ref.current.scrollLeft - scrollAmount : ref.current.scrollLeft + scrollAmount

      ref.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  // Search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Combine all billboards and digital screens for searching
    const allBillboards = [...billboards, ...digitalScreens]

    // Check if the main search query is a city name
    const searchingForCity = allBillboards.some(
      (billboard) => billboard.city?.toLowerCase() === searchQuery.toLowerCase(),
    )

    // Filter based on search criteria
    const results = allBillboards.filter((billboard) => {
      // If searching for a city in the main search bar
      if (searchingForCity && searchQuery.trim() !== "") {
        return billboard.city?.toLowerCase() === searchQuery.toLowerCase()
      }

      // For advanced search or general search
      const matchesText =
        searchQuery.trim() === "" ||
        billboard.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        billboard.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        billboard.city?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCity = searchCity.trim() === "" || billboard.city?.toLowerCase().includes(searchCity.toLowerCase())
      const matchesType = searchType === "" || billboard.type === searchType

      const minPrice = searchMinPrice ? Number.parseFloat(searchMinPrice) : 0
      const maxPrice = searchMaxPrice ? Number.parseFloat(searchMaxPrice) : Number.POSITIVE_INFINITY
      const matchesPrice = billboard.price >= minPrice && billboard.price <= maxPrice

      return matchesText && matchesCity && matchesType && matchesPrice
    })

    console.log("Search results:", results.length, "billboards found")
    setSearchResults(results)
    setHasSearched(true)

    // Scroll to results
    document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSaveBillboard = async (billboard: Billboard) => {
    if (!currentUser) {
      router.push("/login?redirect=/")
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
          collectionType: billboard.type === "Digital Billboard" ? "digital screens" : "billboards",
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

  // Check if billboard is currently featured and not expired
  const isBillboardCurrentlyFeatured = (billboard: Billboard) => {
    if (!billboard.featured || !billboard.featuredUntil) return false
    const featuredUntil = billboard.featuredUntil?.toDate?.() || new Date(billboard.featuredUntil)
    return featuredUntil > new Date()
  }

  // Billboard card component
  const BillboardCard = ({
    billboard,
    href,
    showFeaturedBadge = false,
    forceDisplayType,
  }: {
    billboard: Billboard
    href: string
    showFeaturedBadge?: boolean
    forceDisplayType?: "Billboard" | "Digital Screen"
  }) => {
    const isCurrentlyFeatured = isBillboardCurrentlyFeatured(billboard)
    const shouldShowFeaturedBadge = showFeaturedBadge || billboard.isFeaturedPosition || isCurrentlyFeatured

    // Determine display type based on forceDisplayType prop or billboard type
    const getDisplayType = () => {
      if (forceDisplayType) return forceDisplayType
      if (billboard.type === "Digital Billboard" || billboard.type === "LED Billboard") {
        return "Digital Screen"
      }
      return "Billboard"
    }

    return (
      <div className="modern-card hover-lift group min-w-[300px] max-w-[300px] flex-shrink-0 mx-2">
        <div className="modern-card-image">
          <Image
            src={billboard.photos?.[0] || "/placeholder.svg?height=192&width=384"}
            alt={billboard.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60"></div>

          {/* Featured Badge */}
          {shouldShowFeaturedBadge && (
            <div className="absolute top-3 left-3">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} />
                Featured
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 right-3">
            <span className="badge badge-blue">{getDisplayType()}</span>
          </div>

          {/* Save Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSaveBillboard(billboard)
            }}
            className="absolute top-3 left-3 rounded-full bg-white/80 p-2 text-red-500 transition-all hover:bg-white hover:text-red-600"
            style={{ marginTop: shouldShowFeaturedBadge ? "40px" : "0" }}
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
            <span className="text-green-600">PKR</span> {billboard.price?.toLocaleString() || "Price on request"}/mo
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
            
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-500">View Details</span>
            </div>
            <Link href={href} className="rounded-full bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100">
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Job card component
  const JobCard = ({ job }: { job: Job }) => {
    const timeAgo = formatTimeAgo(job.timestamp)
    const isFeatured = job.featured === true && job.featuredUntil && job.featuredUntil.toDate() > new Date()

    return (
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="modern-card hover-lift group min-w-[300px] max-w-[300px] flex-shrink-0 mx-2 cursor-pointer">
          <div className="modern-card-image">
            <Image
              src={job.photos?.[0] || "/placeholder.svg?height=192&width=384"}
              alt={job.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

            {/* Featured Badge */}
            {isFeatured && (
              <div className="absolute top-3 left-3">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  Featured
                </div>
              </div>
            )}

            {/* Job Type Badge */}
            <div className="absolute top-3 right-3">
              <span className="badge badge-green">{job.jobType}</span>
            </div>

            {/* Company Badge */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                <div className="flex items-center gap-1">
                  <Building2 size={12} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">{job.companyName}</span>
                </div>
              </div>
            </div>

            {/* Click to view overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-blue-600">
                Click to view details
              </div>
            </div>
          </div>
          <div className="modern-card-content">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <div className="mb-3 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={14} className="mr-1 text-blue-500" />
                <span>{job.city}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign size={14} className="mr-1 text-green-500" />
                <span>PKR {job.salary}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Posted {timeAgo}
              </span>
              <div className="text-blue-600 text-sm font-medium group-hover:underline">View Details →</div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Empty state component
  const EmptyState = ({ type, linkText, linkHref }: { type: string; linkText: string; linkHref: string }) => (
    <div className="min-w-full rounded-xl border border-dashed border-blue-200 bg-blue-50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Map className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">No {type} available yet</h3>
      <p className="mb-4 text-gray-600">Be the first to list one and reach thousands of potential customers!</p>
      <Link href={linkHref} className="btn-primary inline-block">
        {linkText}
      </Link>
    </div>
  )

  // Horizontal scrollable section component
  const ScrollableSection = ({
    title,
    description,
    items,
    renderItem,
    isLoading,
    emptyState,
    scrollRef,
    viewAllLink,
  }: {
    title: string
    description: string
    items: any[]
    renderItem: (item: any) => JSX.Element
    isLoading: boolean
    emptyState: JSX.Element
    scrollRef: React.RefObject<HTMLDivElement>
    viewAllLink: string
  }) => (
    <section className="mb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <Link href={viewAllLink} className="btn-outline">
          View All
        </Link>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll(scrollRef, "left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading
            ? Array(5)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="modern-card animate-pulse min-w-[300px] max-w-[300px] flex-shrink-0 mx-2">
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
                ))
            : items.length > 0
              ? items.map((item) => renderItem(item))
              : emptyState}
        </div>

        <button
          onClick={() => scroll(scrollRef, "right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  )

  return (
    <>
      <Navbar />

      {/* Hero Section with Enhanced Search */}
      <section className="blue-gradient relative overflow-hidden py-20 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Find the Perfect Billboard for Your Brand
            </h1>
            <p className="mb-8 text-lg text-blue-100 md:text-xl">
              Browse thousands of premium advertising spaces across the country and boost your visibility today.
            </p>

            <div className="mx-auto mb-8 max-w-2xl">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search billboards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border-0 bg-white/90 py-4 pl-6 pr-16 text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="absolute right-16 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                  >
                    {showAdvancedSearch ? "Simple" : "Advanced"}
                  </button>
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 p-3 text-white hover:bg-blue-700"
                  >
                    <Search size={20} />
                  </button>
                </div>

                {showAdvancedSearch && (
                  <div className="grid gap-4 md:grid-cols-2 bg-white/90 p-4 rounded-xl">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        placeholder="Enter city name"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        id="type"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="Standard Billboard">Standard Billboard</option>
                        <option value="Digital Billboard">Digital Billboard</option>
                        <option value="LED Billboard">LED Billboard</option>
                        <option value="Transit Billboard">Transit Billboard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Range ($/month)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={searchMinPrice}
                          onChange={(e) => setSearchMinPrice(e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={searchMaxPrice}
                          onChange={(e) => setSearchMaxPrice(e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/list-billboard" className="btn-primary">
                List Your Billboard
              </Link>
              <Link href="#billboards" className="btn-outline bg-white/10">
                Browse Billboards
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        <div className="absolute -right-16 top-16 h-32 w-32 rounded-full bg-blue-300 opacity-20 blur-3xl"></div>
      </section>

      <main className="pattern-bg">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          {/* Search Results Section */}
          {hasSearched && (
            <section id="search-results" className="mb-16">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                <p className="text-gray-600">Found {searchResults.length} billboards matching your criteria</p>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((billboard) => (
                    <div
                      key={billboard.id}
                      onClick={() => router.push(`/billboard/${billboard.id}`)}
                      className="cursor-pointer"
                    >
                      <BillboardCard billboard={billboard} href={`/billboard/${billboard.id}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Search className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">No billboards found</h3>
                  <p className="mb-4 text-gray-600">
                    Try adjusting your search criteria or browse our available billboards below
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Stats Section */}
          <section className="mb-16">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="glass rounded-xl p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Map className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-1 text-2xl font-bold text-gray-900">2,500+</h3>
                <p className="text-sm text-gray-600">Billboard Locations</p>
              </div>

              <div className="glass rounded-xl p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-1 text-2xl font-bold text-gray-900">15,000+</h3>
                <p className="text-sm text-gray-600">Happy Advertisers</p>
              </div>

              <div className="glass rounded-xl p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mb-1 text-2xl font-bold text-gray-900">99.8%</h3>
                <p className="text-sm text-gray-600">Uptime Guarantee</p>
              </div>

             
            </div>
          </section>

          {/* Featured Content Section - Shows all featured billboards and jobs */}
          {(featuredBillboards.length > 0 || featuredJobs.length > 0) && (
            <section className="mb-16">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">⭐ Featured Content</h2>
                  <p className="text-gray-600">Premium listings with enhanced visibility</p>
                </div>
                <Link href="/featured-ads" className="btn-outline">
                  View All Featured
                </Link>
              </div>

              <div className="relative">
                <button
                  onClick={() => scroll(featuredScrollRef, "left")}
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={24} />
                </button>

                <div
                  ref={featuredScrollRef}
                  className="flex overflow-x-auto pb-4 scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {isLoadingFeatured ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="modern-card animate-pulse min-w-[300px] max-w-[300px] flex-shrink-0 mx-2"
                        >
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
                      ))
                  ) : (
                    <>
                      {/* Featured Billboards */}
                      {featuredBillboards.map((billboard) => (
                        <div
                          key={billboard.id}
                          onClick={() => router.push(`/billboard/${billboard.id}`)}
                          className="cursor-pointer"
                        >
                          <BillboardCard
                            billboard={billboard}
                            href={`/billboard/${billboard.id}`}
                            showFeaturedBadge={true}
                          />
                        </div>
                      ))}

                      {/* Featured Jobs */}
                      {featuredJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </>
                  )}
                </div>

                <button
                  onClick={() => scroll(featuredScrollRef, "right")}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </section>
          )}

          {/* Standard Billboards Section - with featured ads interspersed */}
          <ScrollableSection
            title="Standard Billboards"
            description="Premium advertising spaces in high-traffic areas (featured ads shown every 7th position)"
            items={billboards}
            renderItem={(billboard) => (
              <div
                key={billboard.id}
                onClick={() => router.push(`/billboard/${billboard.id}`)}
                className="cursor-pointer"
              >
                <BillboardCard billboard={billboard} href={`/billboard/${billboard.id}`} forceDisplayType="Billboard" />
              </div>
            )}
            isLoading={isLoadingBillboards}
            emptyState={<EmptyState type="billboards" linkText="List a Billboard" linkHref="/list-billboard" />}
            scrollRef={billboardsScrollRef}
            viewAllLink="/billboards"
          />

          {/* Map section with header */}
          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Billboards Near You</h2>
                <p className="text-gray-600">Explore billboard locations on the interactive map</p>
              </div>
              <Link href="/billboards" className="btn-outline">
                View All Billboards
              </Link>
            </div>

            <InteractiveMap billboards={[...billboards, ...digitalScreens]} height="400px" className="w-full" />
          </section>

          {/* Digital Screens Section - with featured ads interspersed */}
          <ScrollableSection
            title="Digital Screens"
            description="Dynamic advertising with real-time content updates (featured ads shown every 7th position)"
            items={digitalScreens}
            renderItem={(billboard) => (
              <div
                key={billboard.id}
                onClick={() => router.push(`/billboard/${billboard.id}`)}
                className="cursor-pointer"
              >
                <BillboardCard
                  billboard={billboard}
                  href={`/billboard/${billboard.id}`}
                  forceDisplayType="Digital Screen"
                />
              </div>
            )}
            isLoading={isLoadingDigital}
            emptyState={
              <EmptyState type="digital screens" linkText="List a Digital Screen" linkHref="/list-billboard" />
            }
            scrollRef={digitalScrollRef}
            viewAllLink="/digital-screens"
          />

          {/* Jobs Section */}
          <ScrollableSection
            title="Latest Jobs"
            description="Find creative opportunities in advertising"
            items={jobs}
            renderItem={(job) => <JobCard key={job.id} job={job} />}
            isLoading={isLoadingJobs}
            emptyState={<EmptyState type="jobs" linkText="Post a Job" linkHref="/post-job" />}
            scrollRef={jobsScrollRef}
            viewAllLink="/jobs"
          />

          {/* Features Section */}
          <section className="mb-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Why Choose Blurb</h2>
              <p className="text-gray-600">The premier marketplace for billboard advertising</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="modern-card p-6 hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Map className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Interactive Map</h3>
                <p className="text-sm text-gray-600">
                  Easily locate and navigate to billboard locations with our interactive map.
                </p>
              </div>

              <div className="modern-card p-6 hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Featured Ads</h3>
                <p className="text-sm text-gray-600">
                  Promote your billboard with top visibility and reach more potential customers.
                </p>
              </div>

              <div className="modern-card p-6 hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">In-app Chat</h3>
                <p className="text-sm text-gray-600">
                  Get a seemless chat functionality to chat with any user.
                </p>
              </div>

              <div className="modern-card p-6 hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Job Listings</h3>
                <p className="text-sm text-gray-600">
                  Post your advertising requirements efficiently and find the perfect talent.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="rounded-xl white-gradient overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="p-8 md:p-12 md:w-1/2">
                <h2 className="mb-4 text-3xl font-bold text-black">Ready to Advertise?</h2>
                <p className="mb-6 text-black-100">
                  List your billboard today and reach thousands of potential customers. Our platform makes it easy to
                  manage your advertising spaces and connect with businesses.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/list-billboard" className="btn-primary bg-white text-blue-600 hover:bg-blue-50">
                    List Your Billboard
                  </Link>
                  <Link href="/contact" className="btn-outline border-white text-white hover:bg-white/10">
                    Contact Sales
                  </Link>
                </div>
              </div>
              <div className="relative md:w-1/2">
                <div className="absolute inset-0 bg-blue-600 opacity-20"></div>
                <div className="h-full w-full">
                  <Image src="/ChatGPT Image Jul 13, 2025, 08_35_06 PM.png" alt="Billboard advertising" fill className="object-cover" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white">
  <div className="container mx-auto max-w-7xl px-4 py-16">
    <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
      {/* Branding */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <img src="/logo.svg" alt="Blurb Logo" className="w-8 h-8" />
          <span className="text-2xl font-bold text-white">Blurb</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          The premier digital marketplace for billboard and digital screen advertising. Discover, book, and manage ad space effortlessly.
        </p>
      </div>

      {/* Explore */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Explore</h4>
        <ul className="space-y-3 text-sm text-gray-400">
          <li><a href="/" className="hover:text-white">Home</a></li>
          <li><a href="/billboards" className="hover:text-white">Billboards</a></li>
          <li><a href="/digital-screens" className="hover:text-white">Digital Screens</a></li>
          <li><a href="/jobs" className="hover:text-white">New Jobs</a></li>
        </ul>
      </div>

      {/* Actions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Get Started</h4>
        <ul className="space-y-3 text-sm text-gray-400">
          <li><a href="/post-job" className="hover:text-white">Post a Job</a></li>
          <li><a href="/feature-my-ads" className="hover:text-white">Feature My Ads</a></li>
          <li><a href="/list-billboard" className="hover:text-white">List a Billboard</a></li>
          <li><a href="/signup" className="hover:text-white">Sign Up</a></li>
        </ul>
      </div>

      {/* Your Account */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Your Account</h4>
        <ul className="space-y-3 text-sm text-gray-400">
          <li><a href="/my-ads" className="hover:text-white">My Ads</a></li>
          <li><a href="/applications" className="hover:text-white">Applications</a></li>
          <li><a href="/saved-ads" className="hover:text-white">Saved Ads</a></li>
          <li><a href="/chats" className="hover:text-white">Messages</a></li>
        </ul>
      </div>
    </div>

    <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Blurb. All rights reserved.
    </div>
  </div>
</footer>

    </>
  )
}
