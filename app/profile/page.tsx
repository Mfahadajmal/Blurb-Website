"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, updatePassword } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Camera, Save, Eye, EyeOff } from "lucide-react"
import { AuthCheck } from "@/components/auth-check"
import Navbar from "@/components/navbar"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contact: "",
    profileImage: "",
    currentPassword: "",
    newPassword: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setFormData({
              username: userData.username || "",
              email: currentUser.email || "",
              contact: userData.contact || "",
              profileImage: userData.profileImage || "",
              currentPassword: "",
              newPassword: "",
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setError("Failed to load profile data")
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.data.url
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    try {
      setUploading(true)
      setError("")
      const imageUrl = await uploadToImgBB(file)
      setFormData((prev) => ({
        ...prev,
        profileImage: imageUrl,
      }))
      setMessage("Profile picture uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      setError("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required")
      return false
    }

    if (!formData.contact.trim()) {
      setError("Phone number is required")
      return false
    }

    // Validate Pakistani phone number format
    const phoneRegex = /^03\d{9}$/
    if (!phoneRegex.test(formData.contact)) {
      setError("Please enter a valid Pakistani phone number (03xxxxxxxxx)")
      return false
    }

    // If changing password, validate new password
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password")
        return false
      }

      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters long")
        return false
      }

      // Check if password contains both letters and numbers
      const hasLetter = /[a-zA-Z]/.test(formData.newPassword)
      const hasNumber = /\d/.test(formData.newPassword)
      if (!hasLetter || !hasNumber) {
        setError("New password must contain both letters and numbers")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSaving(true)
      setError("")
      setMessage("")

      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        username: formData.username,
        contact: formData.contact,
        profileImage: formData.profileImage,
      })

      // Update password if provided
      if (formData.newPassword && formData.currentPassword) {
        await updatePassword(user, formData.newPassword)
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
        }))
      }

      setMessage("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log back in to change your password")
      } else {
        setError("Failed to update profile. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-lg text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <AuthCheck>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-lg text-gray-600">Manage your account information and preferences</p>
          </div>

          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center">
                <User className="h-6 w-6 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{message}</div>
              )}

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <label
                      htmlFor="profileImage"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <p className="text-sm text-blue-600">Uploading image...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username *
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                      className="h-12 text-lg"
                      required
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      className="h-12 text-lg bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-medium text-gray-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="contact"
                      name="contact"
                      type="tel"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="03xxxxxxxxx"
                      className="h-12 text-lg"
                      required
                    />
                    <p className="text-xs text-gray-500">Pakistani format: 03xxxxxxxxx</p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="Enter current password"
                          className="h-12 text-lg pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="Enter new password"
                          className="h-12 text-lg pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Must be 6+ characters with letters and numbers</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={saving || uploading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthCheck>
  )
}
