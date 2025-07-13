"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/config"
import { getUserBillboards, getUserJobs, isBillboardFeatured, isJobFeatured } from "@/utils/featured-utils"
import { Sparkles, MapPin, TrendingUp, Star, Crown, Zap, ArrowRight, Building2, Clock, Briefcase } from "lucide-react"
import Navbar from "@/components/navbar"

interface Billboard {
  id: string
  title: string
  city: string
  state?: string
  price: number
  photos: string[]
  type?: string
  facilities?: string[]
  userId: string
  timestamp: any
  isFeatured?: boolean
  featuredUntil?: any
  collectionType?: string
}

interface Job {
  id: string
  title: string
  companyName: string
  city: string
  state?: string
  salary: string
  jobType: string
  description: string
  requirements: string[]
  benefits: string[]
  photos: string[]
  userId: string
  timestamp: any
  isFeatured?: boolean
  featuredUntil?: any
}

export default function FeaturedAdsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [featuredStatus, setFeaturedStatus] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "billboards" | "jobs">("all")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        router.push("/login?redirect=/featured-ads")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchUserContent = async () => {
      if (!currentUser) return

      try {
        setIsLoading(true)

        // Fetch user's billboards and jobs
        const [userBillboards, userJobs] = await Promise.all([getUserBillboards(), getUserJobs()])

        setBillboards(userBillboards)
        setJobs(userJobs)

        // Check featured status for each billboard and job
        const allContent = [
          ...userBillboards.map((b) => ({ id: b.id, type: "billboard" })),
          ...userJobs.map((j) => ({ id: j.id, type: "job" })),
        ]

        const statusChecks = await Promise.all(
          allContent.map(async (item) => {
            const featured =
              item.type === "billboard" ? await isBillboardFeatured(item.id) : await isJobFeatured(item.id)
            return { id: item.id, featured }
          }),
        )

        const statusMap = statusChecks.reduce(
          (acc, { id, featured }) => {
            acc[id] = featured
            return acc
          },
          {} as { [key: string]: boolean },
        )

        setFeaturedStatus(statusMap)
      } catch (error) {
        console.error("Error fetching user content:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserContent()
  }, [currentUser])

  const handleFeatureBillboard = (billboard: Billboard) => {
    router.push(`/feature-my-ads/plans?billboardId=${billboard.id}&type=billboard`)
  }

  const handleFeatureJob = (job: Job) => {
    router.push(`/feature-my-ads/plans?jobId=${job.id}&type=job`)
  }

  const formatTimeRemaining = (featuredUntil: any) => {
    if (!featuredUntil) return "Unknown"

    const now = new Date()
    const endDate = featuredUntil.toDate()
    const diffInMs = endDate.getTime() - now.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} remaining`
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} remaining`
    } else {
      return "Expires soon"
    }
  }

  // Helper function to get the correct display type for billboards
  const getBillboardDisplayType = (billboard: Billboard) => {
    // Check if it's from digital screens collection or has digital type
    if (
      billboard.collectionType === "digital screens" ||
      billboard.type === "Digital Billboard" ||
      billboard.type === "LED Billboard"
    ) {
      return "Digital Screen"
    }
    return "Billboard"
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  const featuredBillboards = billboards.filter((b) => featuredStatus[b.id])
  const featuredJobs = jobs.filter((j) => featuredStatus[j.id])
  const totalFeatured = featuredBillboards.length + featuredJobs.length
  const totalContent = billboards.length + jobs.length

  // Filter content based on active tab
  const getFilteredContent = () => {
    switch (activeTab) {
      case "billboards":
        return { billboards, jobs: [] }
      case "jobs":
        return { billboards: [], jobs }
      default:
        return { billboards, jobs }
    }
  }

  const { billboards: filteredBillboards, jobs: filteredJobs } = getFilteredContent()

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">Featured Ads Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Boost Your Visibility
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Feature your billboards and jobs to get maximum exposure and reach thousands of potential customers
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span>10x More Views</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>Instant Activation</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-orange-300" />
                <span>Premium Placement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-500"></div>
      </section>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">{totalContent}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Crown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Featured Items</p>
                  <p className="text-2xl font-bold text-gray-900">{totalFeatured}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billboards</p>
                  <p className="text-2xl font-bold text-gray-900">{billboards.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Briefcase className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All Content ({totalContent})
            </button>
            <button
              onClick={() => setActiveTab("billboards")}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === "billboards"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Billboards ({billboards.length})
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === "jobs"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Jobs ({jobs.length})
            </button>
          </div>

          {/* Content Grid */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Content</h2>
            <p className="text-gray-600 mb-8">Manage and feature your billboard listings and job postings</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : totalContent === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Content Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You haven't listed any billboards or posted any jobs yet. Create your first listing to start featuring
                content.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/list-billboard"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Building2 className="h-5 w-5" />
                  List Your Billboard
                </Link>
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <Briefcase className="h-5 w-5" />
                  Post a Job
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Billboard Cards */}
              {filteredBillboards.map((billboard) => {
                const isFeatured = featuredStatus[billboard.id]
                const displayType = getBillboardDisplayType(billboard)

                return (
                  <div
                    key={billboard.id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                      isFeatured
                        ? "border-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-yellow-200"
                        : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    {/* Featured Badge */}
                    {isFeatured && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={billboard.photos?.[0] || "/placeholder.svg?height=192&width=384"}
                        alt={billboard.title || "Billboard"}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                      {/* Price Badge */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-gray-900">
                          PKR {billboard.price?.toLocaleString() || "0"}/mo
                        </div>
                      </div>

                      {/* Time Remaining Badge (if featured) */}
                      {isFeatured && billboard.featuredUntil && (
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span className="text-xs font-medium text-gray-700">
                                {formatTimeRemaining(billboard.featuredUntil)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Location */}
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {billboard.city || "Unknown location"}
                          {billboard.state && `, ${billboard.state}`}
                        </span>
                      </div>

                      {/* Type Badge - Only show the main type */}
                      <div className="flex items-center gap-2 mb-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            displayType === "Digital Screen"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {displayType}
                        </span>
                      </div>

                      {/* Action Button */}
                      {isFeatured ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                            <Crown className="h-4 w-4" />
                            <span className="text-sm font-medium">Currently Featured</span>
                          </div>
                          <Link
                            href={`/billboard/${billboard.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                          >
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFeatureBillboard(billboard)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                          Feature This {displayType}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Job Cards */}
              {filteredJobs.map((job) => {
                const isFeatured = featuredStatus[job.id]

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                      isFeatured
                        ? "border-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-yellow-200"
                        : "border-gray-100 hover:border-green-200"
                    }`}
                  >
                    {/* Featured Badge */}
                    {isFeatured && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Featured Job
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={job.photos?.[0] || "/placeholder.svg?height=192&width=384"}
                        alt={job.title || "Job"}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                      {/* Salary Badge */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-gray-900">
                          PKR {job.salary}
                        </div>
                      </div>

                      {/* Time Remaining Badge (if featured) */}
                      {isFeatured && job.featuredUntil && (
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span className="text-xs font-medium text-gray-700">
                                {formatTimeRemaining(job.featuredUntil)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {job.title || "Untitled Job"}
                      </h3>

                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">{job.companyName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {job.city || "Unknown location"}
                          {job.state && `, ${job.state}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {job.jobType || "Job"}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          PKR {job.salary}
                        </span>
                      </div>

                      {/* Action Button */}
                      {isFeatured ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                            <Crown className="h-4 w-4" />
                            <span className="text-sm font-medium">Currently Featured</span>
                          </div>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                          >
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFeatureJob(job)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                          Feature This Job
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
