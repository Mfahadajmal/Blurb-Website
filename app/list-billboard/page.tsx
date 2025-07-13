"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/navbar"
import { X, MapPin, Camera, Check, Monitor, Square } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import SelectLocation from "@/components/select-location"
import axios from "axios"

interface LocationData {
  lat: number
  lng: number
  address?: string
}

export default function ListBillboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [billboardType, setBillboardType] = useState<string>("") // New state for billboard type
  const [price, setPrice] = useState("")
  const [facilities, setFacilities] = useState("")
  const [pinLocation, setPinLocation] = useState<LocationData | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pakistani cities list (matching your mobile app)
  const cities = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
    "Sialkot",
    "Hyderabad",
  ]

  // Billboard types
  const billboardTypes = [
    { value: "standard", label: "Standard Billboard", icon: Square },
    { value: "digital", label: "Digital Screen", icon: Monitor },
  ]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newPhotos = Array.from(files).slice(0, 10 - selectedPhotos.length)
      setSelectedPhotos((prev) => [...prev, ...newPhotos])
    }
  }

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setPinLocation(location)
    setShowLocationPicker(false)
  }

  // Upload image to ImgBB (like your mobile app)
  const uploadImageToImgbb = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("key", "1c68955746294f27f97d3aee877488ea") // ImgBB API Key

      const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        return response.data.data.url
      } else {
        throw new Error("Image upload failed")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Please log in to list a billboard")
      return
    }

    if (selectedPhotos.length === 0 || !selectedCity || !billboardType || !price || !pinLocation) {
      alert("Please fill all required fields and select at least one photo")
      return
    }

    try {
      setIsLoading(true)
      console.log("Starting billboard submission...")

      // Upload all photos to ImgBB (matching mobile app approach)
      const photoUrls: string[] = []
      for (const photo of selectedPhotos) {
        console.log("Uploading photo:", photo.name)
        const url = await uploadImageToImgbb(photo)
        photoUrls.push(url)
        console.log("Photo uploaded successfully:", url)
      }

      // Determine collection based on billboard type
      const collectionName = billboardType === "digital" ? "digital screens" : "billboards"

      // Create billboard document with mobile app structure
      const billboardData = {
        userId: currentUser.uid,
        photos: photoUrls,
        city: selectedCity,
        location: {
          lat: pinLocation.lat,
          lng: pinLocation.lng,
        },
        price: price, // Keep as string like mobile app
        facilities: facilities,
        timestamp: serverTimestamp(),
      }

      console.log("Saving to collection:", collectionName)
      console.log("Billboard data:", billboardData)

      await addDoc(collection(db, collectionName), billboardData)

      console.log("Billboard saved successfully!")
      alert("Billboard listed successfully!")

      // Reset form
      setSelectedPhotos([])
      setSelectedCity("")
      setBillboardType("")
      setPrice("")
      setFacilities("")
      setPinLocation(null)

      router.push("/")
    } catch (error) {
      console.error("Error listing billboard:", error)
      alert(`Failed to list billboard: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">List Your Billboard</h1>
            <p className="mt-2 text-gray-600">Share your billboard with potential advertisers</p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="space-y-8">
              {/* Billboard Type Selection */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">
                  Billboard Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {billboardTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setBillboardType(type.value)}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          billboardType === type.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <IconComponent size={32} className="mb-3" />
                          <h3 className="font-semibold text-lg">{type.label}</h3>
                          <p className="text-sm mt-1 opacity-75">
                            {type.value === "standard"
                              ? "Traditional static billboard advertising"
                              : "Dynamic digital screen with real-time content"}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">
                  Photos <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  {selectedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="group relative">
                          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={URL.createObjectURL(photo) || "/placeholder.svg"}
                              alt={`Billboard photo ${index + 1}`}
                              width={200}
                              height={200}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPhotos.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 hover:bg-blue-50"
                    >
                      <div className="text-center">
                        <Camera size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">
                          {selectedPhotos.length === 0 ? "Add Photos" : "Add More Photos"}
                        </p>
                        <p className="text-xs text-gray-500">{selectedPhotos.length}/10 photos selected</p>
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* City Selection */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-medium">PKR</span>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setPrice(value)
                    }}
                    placeholder="Enter price (e.g., 5000)"
                    className="w-full rounded-lg border border-gray-300 pl-12 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Facilities */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">Facilities</label>
                <textarea
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  placeholder="Describe the facilities and features of your billboard..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Location Selection */}
              <div>
                <label className="mb-4 block text-lg font-semibold text-gray-900">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="text-center">
                      <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {pinLocation ? "Change Location" : "Pick Location"}
                      </p>
                      {pinLocation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Selected: ({pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)})
                        </p>
                      )}
                    </div>
                  </button>

                  {pinLocation && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 mb-1">Location Selected</p>
                          <p className="text-sm text-green-700">Latitude: {pinLocation.lat.toFixed(6)}</p>
                          <p className="text-sm text-green-700">Longitude: {pinLocation.lng.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isLoading ||
                    selectedPhotos.length === 0 ||
                    !selectedCity ||
                    !billboardType ||
                    !price ||
                    !pinLocation
                  }
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Listing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      List Billboard
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location Selection Modal */}
        <SelectLocation
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={pinLocation}
        />
      </main>
    </>
  )
}
