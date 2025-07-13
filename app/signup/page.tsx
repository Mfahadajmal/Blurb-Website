"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp, query, where, getDocs, collection } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { Camera, Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profilePicture, setProfilePicture] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Validation functions
  const validatePassword = (password: string) => {
    const hasNumber = /\d/.test(password)
    const hasLetter = /[a-zA-Z]/.test(password)
    return password.length >= 6 && hasNumber && hasLetter
  }

  const validatePakistaniPhone = (phone: string) => {
    // Pakistani mobile numbers: 03xxxxxxxxx (11 digits starting with 03)
    const pakistaniMobileRegex = /^03\d{9}$/
    return pakistaniMobileRegex.test(phone)
  }

  const checkUniqueness = async (field: string, value: string) => {
    try {
      console.log(`Checking uniqueness for ${field}:`, value)
      const usersRef = collection(db, "users")
      const q = query(usersRef, where(field, "==", value))
      const querySnapshot = await getDocs(q)
      console.log(`${field} uniqueness check result:`, querySnapshot.empty)
      return querySnapshot.empty
    } catch (error) {
      console.error(`Error checking ${field}:`, error)
      return false
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setProfilePicture(data.data.url)
      } else {
        setError("Failed to upload profile picture")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      setError("Failed to upload profile picture")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validations
    if (!fullName.trim()) {
      setError("Full name is required")
      return
    }

    if (!username.trim()) {
      setError("Username is required")
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long")
      return
    }

    if (!validatePakistaniPhone(phoneNumber)) {
      setError("Please enter a valid Pakistani mobile number (e.g., 03001234567)")
      return
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long and contain both letters and numbers")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    

    setIsLoading(true)

    try {
      // Check uniqueness for username, email, and phone
      console.log("Checking uniqueness for all fields...")
      const [isUsernameUnique, isEmailUnique, isPhoneUnique] = await Promise.all([
        checkUniqueness("username", username.toLowerCase()),
        checkUniqueness("email", email.toLowerCase()),
        checkUniqueness("phone", phoneNumber),
      ])

      console.log("Uniqueness results:", { isUsernameUnique, isEmailUnique, isPhoneUnique })

      if (!isUsernameUnique) {
        setError("Username is already taken. Please choose a different username.")
        setIsLoading(false)
        return
      }

      if (!isEmailUnique) {
        setError("Email is already registered. Please use a different email.")
        setIsLoading(false)
        return
      }

      if (!isPhoneUnique) {
        setError("Phone number is already registered. Please use a different number.")
        setIsLoading(false)
        return
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update the user's display name and photo
      await updateProfile(user, {
        displayName: fullName,
        photoURL: profilePicture,
      })

      // Create user document in Firestore with all required fields
      await setDoc(doc(db, "users", user.uid), {
        username: username.toLowerCase(),
        name: fullName,
        email: email.toLowerCase(),
        contact: phoneNumber,
        phone: phoneNumber,
        profileImage: profilePicture,
        profilePicture: profilePicture,
        createdAt: serverTimestamp(),
        userId: user.uid,
      })

      console.log("User document created successfully in Firestore")

      // Sign out the user after successful registration
      await auth.signOut()

      // Redirect to login page
      router.push("/login?message=Account created successfully! Please sign in.")
    } catch (error: any) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use. Please use a different email or sign in.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
      } else {
        setError("An error occurred during signup. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-bold text-blue-600">Create your Blurb account</h1>
          <p className="text-sm text-gray-500">Join the billboard revolution today!</p>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="h-3 w-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            {uploadingImage && <p className="text-xs text-blue-600">Uploading...</p>}
            <p className="text-xs text-gray-500 text-center">Add a profile picture (optional)</p>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Choose a unique username"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Username must be at least 3 characters long</p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "")
                setPhoneNumber(value)
              }}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="03001234567"
              maxLength={11}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter Pakistani mobile number (e.g., 03001234567)</p>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">At least 6 characters with letters and numbers</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          

          <button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
