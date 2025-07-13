"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/firebase/config"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { Search, MapPin, DollarSign, Building2, Heart, Clock, Star, Plus, SortAsc, Briefcase } from "lucide-react"
import Navbar from "@/components/navbar"
import { formatDistanceToNow } from "date-fns"

interface Job {
  id: string
  userId: string
  title: string
  companyName: string
  photos: string[]
  city: string
  jobType: string
  salary: string
  description: string
  requirements: string
  timestamp: any
  isActive: boolean
  featured?: boolean
  featuredUntil?: Timestamp
}

interface UserData {
  companyName?: string
  email?: string
  phone?: string
  username?: string
}

const JOB_TYPES = [
  "All Types",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Remote",
  "Hybrid",
  "On-site",
]

const SORT_OPTIONS = [
  { value: "Random", label: "Random", icon: "🎲" },
  { value: "Newest", label: "Newest to Oldest", icon: "🕐" },
  { value: "Oldest", label: "Oldest to Newest", icon: "🕑" },
  { value: "SalaryHigh", label: "Salary: High to Low", icon: "💰" },
  { value: "SalaryLow", label: "Salary: Low to High", icon: "💵" },
]

export default function JobsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})

  // Filter states
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState("Random")
  const [availableLocations, setAvailableLocations] = useState<string[]>(["All Locations"])
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states
  const [showJobTypeFilter, setShowJobTypeFilter] = useState(false)
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const [showSortOptions, setShowSortOptions] = useState(false)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Load jobs and related data
  useEffect(() => {
    loadJobs()
  }, [])

  // Load saved jobs when user changes
  useEffect(() => {
    if (currentUser) {
      loadSavedJobs()
    } else {
      setSavedJobs(new Set())
    }
  }, [currentUser])

  // Apply filters when jobs or filter options change
  useEffect(() => {
    applyFilters()
  }, [jobs, selectedJobType, selectedLocation, sortOption, searchTerm])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const jobsQuery = query(collection(db, "jobs"), where("isActive", "==", true))
      const jobsSnapshot = await getDocs(jobsQuery)

      const jobsData = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[]

      setJobs(jobsData)

      // Extract unique locations
      const locations = new Set(["All Locations"])
      jobsData.forEach((job) => {
        if (job.city) {
          locations.add(job.city)
        }
      })
      setAvailableLocations(Array.from(locations).sort())

      // Load company names
      const userIds = [...new Set(jobsData.map((job) => job.userId))]
      const companyNamesMap: Record<string, string> = {}

      for (const userId of userIds) {
        try {
          const jobQuery = query(collection(db, "jobs"), where("userId", "==", userId));
          const jobSnapshot = await getDocs(jobQuery);
          if (!jobSnapshot.empty) {
            const jobData = jobSnapshot.docs[0].data();
            companyNamesMap[userId] = jobData.companyName || "Unknown Company";
          }
          
        } catch (error) {
          console.error("Error loading company name for user:", userId, error)
          companyNamesMap[userId] = "Unknown Company"
        }
      }

      setCompanyNames(companyNamesMap)
    } catch (error) {
      console.error("Error loading jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedJobs = async () => {
    if (!currentUser) return

    try {
      const savedJobsQuery = query(collection(db, "users", currentUser.uid, "savedJobs"))
      const savedJobsSnapshot = await getDocs(savedJobsQuery)
      const savedJobIds = new Set(savedJobsSnapshot.docs.map((doc) => doc.id))
      setSavedJobs(savedJobIds)
    } catch (error) {
      console.error("Error loading saved jobs:", error)
    }
  }

  const organizeJobs = (jobsList: Job[]) => {
    // Separate featured and regular jobs
    const featuredJobs: Job[] = []
    const regularJobs: Job[] = []

    jobsList.forEach((job) => {
      const isFeatured = job.featured === true
      let isValidFeature = false

      if (isFeatured && job.featuredUntil) {
        const featuredUntil = job.featuredUntil.toDate()
        isValidFeature = featuredUntil > new Date()
      }

      if (isValidFeature) {
        featuredJobs.push(job)
      } else {
        regularJobs.push(job)
      }
    })

    // Apply sorting
    const sortJobs = (jobsArray: Job[]) => {
      switch (sortOption) {
        case "Newest":
          return jobsArray.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate())
        case "Oldest":
          return jobsArray.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate())
        case "SalaryHigh":
          return jobsArray.sort((a, b) => Number.parseFloat(b.salary) - Number.parseFloat(a.salary))
        case "SalaryLow":
          return jobsArray.sort((a, b) => Number.parseFloat(a.salary) - Number.parseFloat(b.salary))
        default:
          // Random shuffle
          return jobsArray.sort(() => Math.random() - 0.5)
      }
    }

    const sortedFeatured = sortJobs([...featuredJobs])
    const sortedRegular = sortJobs([...regularJobs])

    // Interleave featured jobs with regular jobs
    const result: Job[] = []
    let featuredIndex = 0

    sortedRegular.forEach((job, index) => {
      result.push(job)
      // Insert featured job after every 7 regular jobs
      if ((index + 1) % 7 === 0 && featuredIndex < sortedFeatured.length) {
        result.push(sortedFeatured[featuredIndex])
        featuredIndex++
      }
    })

    // Add remaining featured jobs at the beginning
    const remainingFeatured = sortedFeatured.slice(featuredIndex)
    return [...remainingFeatured, ...result]
  }

  const applyFilters = () => {
    let filtered = [...jobs]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          companyNames[job.userId]?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply job type filter
    if (selectedJobType && selectedJobType !== "All Types") {
      filtered = filtered.filter((job) => job.jobType === selectedJobType)
    }

    // Apply location filter
    if (selectedLocation && selectedLocation !== "All Locations") {
      filtered = filtered.filter((job) => job.city === selectedLocation)
    }

    // Organize and sort jobs
    const organized = organizeJobs(filtered)
    setFilteredJobs(organized)
  }

  const toggleSavedJob = async (jobId: string, job: Job) => {
    if (!currentUser) {
      router.push("/login?redirect=/jobs")
      return
    }

    try {
      const savedJobRef = doc(db, "users", currentUser.uid, "savedJobs", jobId)

      if (savedJobs.has(jobId)) {
        await deleteDoc(savedJobRef)
        setSavedJobs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
      } else {
        await setDoc(savedJobRef, {
          timestamp: serverTimestamp(),
          jobData: job,
          type: "job",
        })
        setSavedJobs((prev) => new Set([...prev, jobId]))
      }
    } catch (error) {
      console.error("Error toggling saved job:", error)
    }
  }

  const clearAllFilters = () => {
    setSelectedJobType(null)
    setSelectedLocation(null)
    setSearchTerm("")
  }

  const JobCard = ({ job }: { job: Job }) => {
    const companyName = companyNames[job.userId] || job.companyName || "Unknown Company"
    const timeAgo = job.timestamp ? formatDistanceToNow(job.timestamp.toDate(), { addSuffix: true }) : "Recently"
    const isSaved = savedJobs.has(job.id)
    const isFeatured = job.featured === true && job.featuredUntil && job.featuredUntil.toDate() > new Date()

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Job Image */}
        <div className="relative h-48">
          {job.photos && job.photos.length > 0 ? (
            <Image src={job.photos[0] || "/placeholder.svg"} alt={job.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-white" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>

          {/* Job Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-blue-600">
              {job.jobType}
            </span>
          </div>

          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Star size={12} className="fill-white" />
                Featured
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleSavedJob(job.id, job)
            }}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Job Details */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>

          {/* Company */}
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-gray-700 font-medium">{companyName}</span>
          </div>

          {/* Location and Salary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm text-gray-600">{job.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">PKR {job.salary}</span>
            </div>
          </div>

          {/* Posted Time */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            <Link
              href={`/jobs/${job.id}`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const FilterModal = ({
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
    searchable = false,
  }: {
    title: string
    options: string[]
    selectedValue: string | null
    onSelect: (value: string | null) => void
    onClose: () => void
    searchable?: boolean
  }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const filteredOptions = searchable
      ? options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))
      : options

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            {searchable && (
              <div className="mt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredOptions.map((option) => {
              const isSelected = selectedValue === option || (option.includes("All") && selectedValue === null)
              return (
                <button
                  key={option}
                  onClick={() => {
                    onSelect(option.includes("All") ? null : option)
                    onClose()
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isSelected && <span className="text-blue-600">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Dream Job</h1>
            <p className="text-xl text-blue-100">Discover amazing opportunities from top companies</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {/* Job Type Filter */}
            <button
              onClick={() => setShowJobTypeFilter(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                selectedJobType
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              {selectedJobType || "Job Type"}
            </button>

            {/* Location Filter */}
            <button
              onClick={() => setShowLocationFilter(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                selectedLocation
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              <MapPin className="h-4 w-4" />
              {selectedLocation || "Location"}
            </button>

            {/* Sort Button */}
            <button
              onClick={() => setShowSortOptions(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <SortAsc className="h-4 w-4" />
              Sort
            </button>

            {/* Clear Filters */}
            {(selectedJobType || selectedLocation || searchTerm) && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Active Filters */}
          {(selectedJobType || selectedLocation) && (
            <div className="flex items-center gap-2 mt-3">
              {selectedJobType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {selectedJobType}
                  <button onClick={() => setSelectedJobType(null)} className="ml-1 hover:text-blue-900">
                    ✕
                  </button>
                </span>
              )}
              {selectedLocation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {selectedLocation}
                  <button onClick={() => setSelectedLocation(null)} className="ml-1 hover:text-blue-900">
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Jobs Grid */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={clearAllFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/post-job"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* Filter Modals */}
      {showJobTypeFilter && (
        <FilterModal
          title="Job Type"
          options={JOB_TYPES}
          selectedValue={selectedJobType}
          onSelect={setSelectedJobType}
          onClose={() => setShowJobTypeFilter(false)}
        />
      )}

      {showLocationFilter && (
        <FilterModal
          title="Location"
          options={availableLocations}
          selectedValue={selectedLocation}
          onSelect={setSelectedLocation}
          onClose={() => setShowLocationFilter(false)}
          searchable
        />
      )}

      {showSortOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sort By</h3>
                <button onClick={() => setShowSortOptions(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortOption(option.value)
                    setShowSortOptions(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    sortOption === option.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                    {sortOption === option.value && <span className="text-blue-600">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
