"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/config"
import { MapPin, Upload, X, Check, ArrowLeft, Building2, FileText, Users, Camera, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import SelectLocation from "@/components/select-location"
import { cities, jobTypes, uploadImageToImgbb, saveJobToFirebase } from "@/utils/job-utils"

interface LocationData {
  lat: number
  lng: number
}

export default function PostJobPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    city: "",
    jobType: "",
    salary: "",
    description: "",
    requirements: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        router.push("/login?redirect=/post-job")
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      if (selectedPhotos.length + filesArray.length > 5) {
        alert("You can only upload a maximum of 5 images")
        return
      }
      setSelectedPhotos((prev) => [...prev, ...filesArray])
    }
  }

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location)
    setShowLocationModal(false)
  }

  const validateForm = () => {
    const required = ["title", "companyName", "city", "jobType", "salary", "description"]
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Upload images to ImgBB
      const imageUrls: string[] = []
      for (const photo of selectedPhotos) {
        const imageUrl = await uploadImageToImgbb(photo)
        imageUrls.push(imageUrl)
      }

      // Save job to Firebase
      await saveJobToFirebase({
        title: formData.title,
        companyName: formData.companyName,
        photos: imageUrls,
        city: formData.city,
        jobType: formData.jobType,
        location: selectedLocation,
        salary: formData.salary,
        description: formData.description,
        requirements: formData.requirements,
        isActive: true,
      })

      alert("Job posted successfully!")
      router.push("/")
    } catch (error) {
      console.error("Error posting job:", error)
      alert("Failed to post job. Please try again.")
    } finally {
      setIsLoading(false)
    }
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 relative overflow-hidden py-16 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="text-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Users className="h-5 w-5 text-green-300" />
              <span className="text-sm font-medium">Post a Job</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Perfect Talent</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Post your job and connect with skilled professionals in the advertising industry
            </p>
          </div>
        </div>
      </section>

      <main className="py-12 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Job Details</h2>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {isLoading ? "Posting..." : "Post Job"}
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Senior Graphic Designer"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Creative Agency Inc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      id="jobType"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Job Type</option>
                      {jobTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">
                      PKR
                    </span>
                    <input
                      id="salary"
                      name="salary"
                      type="text"
                      value={formData.salary}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,-\s]/g, "")
                        setFormData((prev) => ({ ...prev, salary: value }))
                      }}
                      className="w-full rounded-lg border border-gray-300 pl-12 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. 50,000 - 80,000 per month"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Photos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Camera className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Company Photos (Optional)</h3>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                >
                  {selectedPhotos.length === 0 ? (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Click to upload company photos</p>
                      <p className="text-sm text-gray-500">Maximum 5 images</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={URL.createObjectURL(photo) || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            width={120}
                            height={120}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removePhoto(index)
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {selectedPhotos.length < 5 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Job Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Job Details</h3>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe the job role, responsibilities, and what you're looking for..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={4}
                    value={formData.requirements}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="List the required skills, experience, and qualifications..."
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Location (Optional)</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <MapPin className="h-5 w-5" />
                  {selectedLocation ? "Change Location" : "Select Location on Map"}
                </button>

                {selectedLocation && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 mb-1">Location Selected</p>
                        <p className="text-sm text-green-700">Latitude: {selectedLocation?.lat.toFixed(6)}</p>
                        <p className="text-sm text-green-700">Longitude: {selectedLocation?.lng.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Location Selection Modal */}
      <SelectLocation
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedLocation}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-700">Posting your job...</p>
          </div>
        </div>
      )}
    </>
  )
}
