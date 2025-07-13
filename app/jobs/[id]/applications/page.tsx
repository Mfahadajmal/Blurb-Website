"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/firebase/config"
import { collection, query, where, orderBy, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MessageCircle,
  MessageSquare,
  Copy,
  Clock,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import Navbar from "@/components/navbar"
import { format, formatDistanceToNow } from "date-fns"

interface Application {
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

const statusConfig = {
  pending: { color: "orange", icon: Clock, label: "Pending" },
  reviewing: { color: "blue", icon: Search, label: "Reviewing" },
  interview: { color: "purple", icon: Users, label: "Interview" },
  rejected: { color: "red", icon: XCircle, label: "Rejected" },
  hired: { color: "green", icon: CheckCircle, label: "Hired" },
}

export default function JobApplicationsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [jobTitle, setJobTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  // Status counts
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    reviewing: 0,
    interview: 0,
    rejected: 0,
    hired: 0,
  })

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  // Load applications
  useEffect(() => {
    const loadApplications = async () => {
      if (!currentUser || !jobId) return

      try {
        setIsLoading(true)

        // Get job details
        const jobDoc = await getDoc(doc(db, "jobs", jobId))
        if (jobDoc.exists()) {
          setJobTitle(jobDoc.data().title || "Unknown Job")
        }

        // Get applications for this job
        const applicationsQuery = query(
          collection(db, "jobApplications"),
          where("jobId", "==", jobId),
          where("companyId", "==", currentUser.uid),
          orderBy("timestamp", "desc"),
        )

        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsData = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[]

        setApplications(applicationsData)

        // Calculate status counts
        const counts = {
          pending: 0,
          reviewing: 0,
          interview: 0,
          rejected: 0,
          hired: 0,
        }

        applicationsData.forEach((app) => {
          counts[app.status]++
        })

        setStatusCounts(counts)
      } catch (error) {
        console.error("Error loading applications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [currentUser, jobId])

  // Update application status
  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "jobApplications", applicationId), {
        status: newStatus,
      })

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus as any } : app)),
      )

      // Update counts
      const updatedApplications = applications.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus as any } : app,
      )

      const counts = {
        pending: 0,
        reviewing: 0,
        interview: 0,
        rejected: 0,
        hired: 0,
      }

      updatedApplications.forEach((app) => {
        counts[app.status]++
      })

      setStatusCounts(counts)
      setSelectedApplication(null)
    } catch (error) {
      console.error("Error updating application status:", error)
      alert("Failed to update application status")
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  // Start chat with applicant
  const startChat = (applicantId: string, applicantName: string) => {
    router.push(`/chats?userId=${applicantId}&userName=${encodeURIComponent(applicantName)}`)
  }

  // Filter applications by status
  const getFilteredApplications = (status: string) => {
    return applications.filter((app) => app.status === status)
  }

  const ApplicationCard = ({ application }: { application: Application }) => {
    const timeAgo = application.timestamp
      ? formatDistanceToNow(application.timestamp.toDate(), { addSuffix: true })
      : "Recently"

    const StatusIcon = statusConfig[application.status].icon
    const statusColor = statusConfig[application.status].color

    return (
      <div
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => setSelectedApplication(application)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {application.applicantName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{application.applicantName}</h3>
              <p className="text-sm text-gray-600">{application.applicantEmail}</p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              statusColor === "orange"
                ? "bg-orange-100 text-orange-800"
                : statusColor === "blue"
                  ? "bg-blue-100 text-blue-800"
                  : statusColor === "purple"
                    ? "bg-purple-100 text-purple-800"
                    : statusColor === "red"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
            }`}
          >
            <StatusIcon size={12} />
            {statusConfig[application.status].label}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{application.coverLetter}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Applied {timeAgo}</span>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                startChat(application.applicantId, application.applicantName)
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Start Chat"
            >
              <MessageCircle size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`tel:${application.applicantPhone}`)
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Call"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://wa.me/${application.applicantPhone.replace(/\D/g, "")}`)
              }}
              className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              title="WhatsApp"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ApplicationDetailModal = ({ application }: { application: Application }) => {
    const appliedDate = application.timestamp ? format(application.timestamp.toDate(), "MMMM d, yyyy") : "Unknown"

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Application from {application.applicantName}</h3>
              <button onClick={() => setSelectedApplication(null)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Update */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Application Status</span>
                <select
                  value={application.status}
                  onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
            </div>

            {/* Applicant Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Applicant Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-500" />
                  <span className="font-medium w-20">Name:</span>
                  <span>{application.applicantName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500" />
                  <span className="font-medium w-20">Email:</span>
                  <span>{application.applicantEmail}</span>
                  <button
                    onClick={() => copyToClipboard(application.applicantEmail)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-500" />
                  <span className="font-medium w-20">Phone:</span>
                  <span>{application.applicantPhone}</span>
                  <button
                    onClick={() => copyToClipboard(application.applicantPhone)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-500" />
                  <span className="font-medium w-20">Applied:</span>
                  <span>{appliedDate}</span>
                </div>
              </div>
            </div>

            {/* Contact Options */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Contact Options</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => startChat(application.applicantId, application.applicantName)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <MessageCircle size={16} />
                  Chat
                </button>
                <button
                  onClick={() => window.open(`tel:${application.applicantPhone}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Phone size={16} />
                  Call
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/${application.applicantPhone.replace(/\D/g, "")}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <MessageSquare size={16} />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Cover Letter</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Job Applications</h1>
              <p className="text-blue-100">Applications for: {jobTitle}</p>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = statusCounts[status as keyof typeof statusCounts]
              const Icon = config.icon
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === status ? "bg-white text-blue-600" : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Icon size={16} />
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Applications Grid */}
        {getFilteredApplications(activeTab).length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredApplications(activeTab).map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No applications found</h3>
            <p className="text-gray-600">
              No applications with status "{statusConfig[activeTab as keyof typeof statusConfig].label}" yet.
            </p>
          </div>
        )}
      </main>

      {/* Application Detail Modal */}
      {selectedApplication && <ApplicationDetailModal application={selectedApplication} />}
    </>
  )
}
