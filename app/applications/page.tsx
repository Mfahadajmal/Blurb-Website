"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Search,
  Eye,
} from "lucide-react"
import Navbar from "@/components/navbar"

interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  companyId: string
  companyName: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  coverLetter: string
  status: "pending" | "reviewing" | "interview" | "rejected" | "hired"
  timestamp: any
}

interface PostedJob {
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
  featuredUntil?: any
  applicationCount?: number
}

const STATUS_CONFIG = {
  pending: { color: "text-orange-600 bg-orange-100", icon: AlertCircle, label: "Pending" },
  reviewing: { color: "text-blue-600 bg-blue-100", icon: Search, label: "Reviewing" },
  interview: { color: "text-purple-600 bg-purple-100", icon: Users, label: "Interview" },
  rejected: { color: "text-red-600 bg-red-100", icon: XCircle, label: "Rejected" },
  hired: { color: "text-green-600 bg-green-100", icon: CheckCircle, label: "Hired" },
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"applications" | "jobs">("applications")
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        router.push("/login?redirect=/applications")
      }
    })
    return () => unsubscribe()
  }, [router])

  // Load applications when user is available
  useEffect(() => {
    if (currentUser) {
      loadApplicationsToMyJobs()
      loadPostedJobs()
    }
  }, [currentUser])

  const loadApplicationsToMyJobs = async () => {
    if (!currentUser) return

    try {
      setIsLoadingApplications(true)

      // First, get all jobs posted by the current user
      const jobsQuery = query(collection(db, "jobs"), where("userId", "==", currentUser.uid))
      const jobsSnapshot = await getDocs(jobsQuery)
      const userJobIds = jobsSnapshot.docs.map((doc) => doc.id)

      if (userJobIds.length === 0) {
        setApplications([])
        return
      }

      // Then, get all applications for those jobs
      const applicationsQuery = query(collection(db, "jobApplications"), where("jobId", "in", userJobIds))
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applicationsData = applicationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[]

      // Sort by timestamp on client side
      applicationsData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
      })

      setApplications(applicationsData)
    } catch (error) {
      console.error("Error loading applications:", error)
      setApplications([])
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const loadPostedJobs = async () => {
    if (!currentUser) return

    try {
      setIsLoadingJobs(true)
      // Remove orderBy to avoid index requirement
      const jobsQuery = query(collection(db, "jobs"), where("userId", "==", currentUser.uid))

      const jobsSnapshot = await getDocs(jobsQuery)
      const jobsData = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PostedJob[]

      // Sort by timestamp on client side
      jobsData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
      })

      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        jobsData.map(async (job) => {
          try {
            const applicationsQuery = query(collection(db, "jobApplications"), where("jobId", "==", job.id))
            const applicationsSnapshot = await getDocs(applicationsQuery)
            return {
              ...job,
              applicationCount: applicationsSnapshot.docs.length,
            }
          } catch (error) {
            console.error("Error getting application count for job:", job.id, error)
            return { ...job, applicationCount: 0 }
          }
        }),
      )

      setPostedJobs(jobsWithCounts)
    } catch (error) {
      console.error("Error loading posted jobs:", error)
    } finally {
      setIsLoadingJobs(false)
    }
  }

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

  const ApplicationCard = ({ application }: { application: JobApplication }) => {
    const statusConfig = STATUS_CONFIG[application.status]
    const StatusIcon = statusConfig.icon
    const timeAgo = formatTimeAgo(application.timestamp)

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{application.jobTitle}</h3>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{application.companyName}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Applicant:</strong> {application.applicantName}
                </p>
                <p>
                  <strong>Email:</strong> {application.applicantEmail}
                </p>
                {application.applicantPhone && (
                  <p>
                    <strong>Phone:</strong> {application.applicantPhone}
                  </p>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 text-sm">
              <strong>Cover Letter:</strong>
            </p>
            <p className="text-gray-600 text-sm line-clamp-3 mt-1">{application.coverLetter}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Applied {timeAgo}
            </span>
            <Link href={`/jobs/${application.jobId}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Job
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const JobCard = ({ job }: { job: PostedJob }) => {
    const timeAgo = formatTimeAgo(job.timestamp)
    const isFeatured = job.featured === true && job.featuredUntil && job.featuredUntil.toDate() > new Date()

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Job Image */}
        <div className="relative h-48">
          {job.photos && job.photos.length > 0 ? (
            <Image src={job.photos[0] || "/placeholder.svg"} alt={job.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="h-16 w-16 text-white" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Job Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-blue-600">
              {job.jobType}
            </span>
          </div>

          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                Featured
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                job.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
              }`}
            >
              {job.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Job Details */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{job.title}</h3>

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

          {/* Applications Count */}
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">
              {job.applicationCount || 0} Application{(job.applicationCount || 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Posted Time and Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Posted {timeAgo}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/jobs/${job.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Link>
              {job.applicationCount && job.applicationCount > 0 && (
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Applications
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
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

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Job Applications</h1>
            <p className="text-xl text-blue-100">Manage applications to your posted jobs</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === "applications"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Applications Received ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === "jobs"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              My Posted Jobs ({postedJobs.length})
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {activeTab === "applications" ? (
          <div>
            {isLoadingApplications ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {applications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No applications received yet</h3>
                <p className="text-gray-600 mb-4">Applications to your posted jobs will appear here</p>
                <Link
                  href="/post-job"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {isLoadingJobs ? (
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
            ) : postedJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {postedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibent text-gray-900">No jobs posted yet</h3>
                <p className="text-gray-600 mb-4">Post your first job to start receiving applications</p>
                <Link
                  href="/post-job"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
