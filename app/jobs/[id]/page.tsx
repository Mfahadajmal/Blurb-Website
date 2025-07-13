"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/firebase/config"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  Heart,
  Share2,
  Phone,
  Mail,
  User,
  FileText,
  Send,
  CheckCircle,
  Star,
  ExternalLink,
  Navigation,
} from "lucide-react"
import Navbar from "@/components/navbar"
import { formatDistanceToNow, format } from "date-fns"

interface Job {
  id: string
  userId: string
  title: string
  companyName: string
  photos: string[]
  city: string
  jobType: string
  location?: {
    lat: number
    lng: number
  }
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

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [posterData, setPosterData] = useState<UserData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)

  // Application form data
  const [applicationData, setApplicationData] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
  })

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        // Pre-fill user info
        loadUserInfo(user.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  // Load user info for pre-filling application form
  const loadUserInfo = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setApplicationData((prev) => ({
          ...prev,
          name: userData.username || "",
          email: userData.email || "",
          phone: userData.phone || "",
        }))
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    }
  }

  // Load job details
  useEffect(() => {
    const loadJobDetails = async () => {
      if (!jobId) return

      try {
        setIsLoading(true)
        const jobDoc = await getDoc(doc(db, "jobs", jobId))

        if (jobDoc.exists()) {
          const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job
          setJob(jobData)

          // Load poster information
          if (jobData.userId) {
            const userDoc = await getDoc(doc(db, "users", jobData.userId))
            if (userDoc.exists()) {
              setPosterData(userDoc.data() as UserData)
            }
          }
        } else {
          console.error("Job not found")
          router.push("/jobs")
        }
      } catch (error) {
        console.error("Error loading job details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadJobDetails()
  }, [jobId, router])

  // Check saved and application status
  useEffect(() => {
    const checkStatuses = async () => {
      if (!currentUser || !jobId) return

      try {
        // Check if job is saved
        const savedJobDoc = await getDoc(doc(db, "users", currentUser.uid, "savedJobs", jobId))
        setIsSaved(savedJobDoc.exists())

        // Check if user has applied
        const applicationQuery = query(
          collection(db, "jobApplications"),
          where("jobId", "==", jobId),
          where("applicantId", "==", currentUser.uid),
        )
        const applicationSnapshot = await getDocs(applicationQuery)
        setIsApplied(!applicationSnapshot.empty)
      } catch (error) {
        console.error("Error checking statuses:", error)
      }
    }

    checkStatuses()
  }, [currentUser, jobId])

  // Toggle saved status
  const handleSaveJob = async () => {
    if (!currentUser) {
      router.push("/login?redirect=/jobs/" + jobId)
      return
    }

    if (!job) return

    try {
      const savedJobRef = doc(db, "users", currentUser.uid, "savedJobs", jobId)

      if (isSaved) {
        await deleteDoc(savedJobRef)
        setIsSaved(false)
      } else {
        await setDoc(savedJobRef, {
          timestamp: serverTimestamp(),
          jobData: job,
          type: "job",
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error("Error saving job:", error)
    }
  }

  // Submit application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      router.push("/login?redirect=/jobs/" + jobId)
      return
    }

    if (!job || isApplied) return

    // Validate form
    if (!applicationData.name || !applicationData.email || !applicationData.phone || !applicationData.coverLetter) {
      alert("Please fill in all fields")
      return
    }

    try {
      setIsSubmittingApplication(true)

      await addDoc(collection(db, "jobApplications"), {
        jobId: jobId,
        jobTitle: job.title,
        companyId: job.userId,
        companyName: posterData.companyName || job.companyName || "Unknown Company",
        applicantId: currentUser.uid,
        applicantName: applicationData.name,
        applicantEmail: applicationData.email,
        applicantPhone: applicationData.phone,
        coverLetter: applicationData.coverLetter,
        status: "pending",
        timestamp: serverTimestamp(),
      })

      setIsApplied(true)
      setShowApplicationForm(false)
      alert("Application submitted successfully!")
    } catch (error) {
      console.error("Error submitting application:", error)
      alert("Failed to submit application. Please try again.")
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  const getDirectionsUrl = () => {
    if (!job?.location) return "#"
    return `https://www.google.com/maps/dir/?api=1&destination=${job.location.lat},${job.location.lng}`
  }

  const getMapUrl = () => {
    if (!job?.location) return "#"
    return `https://www.google.com/maps/@${job.location.lat},${job.location.lng},15z`
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <Link href="/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </>
    )
  }

  const isFeatured = job.featured === true && job.featuredUntil && job.featuredUntil.toDate() > new Date()
  const postedDate = job.timestamp ? format(job.timestamp.toDate(), "MMMM d, yyyy") : "Recently"
  const timeAgo = job.timestamp ? formatDistanceToNow(job.timestamp.toDate(), { addSuffix: true }) : "Recently"

  return (
    <>
      <Navbar />

      {/* Hero Section with Images */}
      <section className="relative">
        {job.photos && job.photos.length > 0 ? (
          <div className="h-64 md:h-80 relative">
            <Image src={job.photos[0] || "/placeholder.svg"} alt={job.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Building2 className="h-16 w-16 text-white" />
          </div>
        )}

        {/* Navigation and Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSaveJob}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-red-500 hover:bg-white transition-colors"
            >
              <Heart className={`h-5 w-5 ${isSaved ? "fill-red-500" : ""}`} />
            </button>
            <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <Star size={16} className="fill-white" />
              Featured Job
            </div>
          </div>
        )}
      </section>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-gray-600 mb-4">
                {posterData.companyName || job.companyName || "Unknown Company"}
              </p>

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-semibold">PKR {job.salary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{job.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-semibold">{job.jobType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted</p>
                    <p className="font-semibold">{postedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button and View Applications */}
            <div className="flex flex-col gap-2">
              {/* Show View Applications button if user owns this job */}
              {currentUser && currentUser.uid === job.userId && (
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-colors text-center"
                >
                  View Applications
                </Link>
              )}

              {/* Apply button - only show if user doesn't own the job */}
              {currentUser && currentUser.uid !== job.userId && (
                <button
                  onClick={() => {
                    if (isApplied) return
                    setShowApplicationForm(true)
                  }}
                  disabled={isApplied}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isApplied
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Applied
                    </span>
                  ) : (
                    "Apply Now"
                  )}
                </button>
              )}

              {/* Login prompt if not logged in */}
              {!currentUser && (
                <Link
                  href={`/login?redirect=/jobs/${jobId}`}
                  className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors text-center"
                >
                  Login to Apply
                </Link>
              )}

              <p className="text-xs text-gray-500 text-center">Posted {timeAgo}</p>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Job Description
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Requirements
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          </div>
        )}

        {/* Location Map */}
        {job.location && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Job Location
            </h2>

            {/* Custom Map Display */}
            <div className="rounded-lg overflow-hidden mb-4">
              <div className="w-full h-[300px] bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center relative border-2 border-gray-200">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="job-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#job-grid)" />
                  </svg>
                </div>

                {/* Job Location Marker */}
                <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-[140px] text-center border">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-xs text-gray-600">{job.city}</div>
                    </div>
                  </div>
                </div>

                {/* Corner Info */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Job Location</span>
                  </div>
                </div>

                {/* Zoom Level Indicator */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                  <span className="text-xs text-gray-600">Zoom: 15x</span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{job.city}, Pakistan</div>
                  <div className="text-sm text-gray-600">
                    Coordinates: {job.location.lat.toFixed(6)}, {job.location.lng.toFixed(6)}
                  </div>
                </div>
              </div>

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
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Contact Information
          </h2>
          <div className="space-y-3">
            {posterData.phone && (
              <a
                href={`tel:${posterData.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-5 w-5 text-green-600" />
                <span className="text-blue-600 hover:underline">{posterData.phone}</span>
              </a>
            )}
            {posterData.email && (
              <a
                href={`mailto:${posterData.email}?subject=Regarding ${encodeURIComponent(job.title)}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="h-5 w-5 text-red-600" />
                <span className="text-blue-600 hover:underline">{posterData.email}</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Apply for {job.title}</h3>
                <button onClick={() => setShowApplicationForm(false)} className="text-white/80 hover:text-white">
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={applicationData.name}
                  onChange={(e) => setApplicationData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => setApplicationData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={applicationData.phone}
                  onChange={(e) => setApplicationData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter *</label>
                <textarea
                  rows={6}
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData((prev) => ({ ...prev, coverLetter: e.target.value }))}
                  placeholder="Tell us why you are a good fit for this position..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingApplication}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingApplication ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
