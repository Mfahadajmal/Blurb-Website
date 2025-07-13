"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import {
  Menu,
  X,
  User,
  LogOut,
  Heart,
  MessageCircle,
  Star,
  Briefcase,
  Plus,
  FileText,
  ChevronDown,
  Monitor,
} from "lucide-react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Fetch user profile data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data())
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setShowProfileMenu(false)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const getDisplayName = () => {
    if (userProfile?.username) {
      return userProfile.username
    }
    if (userProfile?.name) {
      return userProfile.name
    }
    if (user?.displayName) {
      return user.displayName
    }
    return user?.email?.split("@")[0] || "User"
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8">
              <img src="/logo.svg" alt="Blurb Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900">Blurb</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/billboards"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/billboards") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Billboards
            </Link>
            <Link
              href="/digital-screens"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/digital-screens") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Digital Screens
            </Link>
            <Link
              href="/jobs"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/jobs") ? "text-blue-600 font-medium" : ""
              }`}
            >
              New Jobs
            </Link>
            <Link
              href="/post-job"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/post-job") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Post Job
            </Link>
            <Link
              href="/feature-my-ads"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/feature-my-ads") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Feature My Ads
            </Link>
            <Link
              href="/applications"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/applications") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Applications
            </Link>
            <Link
              href="/my-ads"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/my-ads") ? "text-blue-600 font-medium" : ""
              }`}
            >
              My Ads
            </Link>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile?.profileImage ? (
                      <img
                        src={userProfile.profileImage || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/my-ads"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      My Ads
                    </Link>
                    <Link
                      href="/applications"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Applications
                    </Link>
                    <Link
                      href="/saved-ads"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Saved Ads
                    </Link>
                    <Link
                      href="/chats"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <Link
                      href="/list-billboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      List Billboard
                    </Link>
                    <Link
                      href="/post-job"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post Job
                    </Link>
                    <Link
                      href="/feature-my-ads"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Feature My Ads
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-blue-600 transition-colors">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
              href="/billboards"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/billboards") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Billboards
            </Link>
            <Link
              href="/digital-screens"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/digital-screens") ? "text-blue-600 font-medium" : ""
              }`}
            >
              Digital Screens
            </Link>
            <Link
              href="/jobs"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive("/jobs") ? "text-blue-600 font-medium" : ""
              }`}
            >
              New Jobs
            </Link>
              <Link
                href="/post-job"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/post-job") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Post Job
              </Link>
              <Link
                href="/chats"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/chats") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Chats
              </Link>
              <Link
                href="/feature-my-ads"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/featured-my-ads") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Feature My Ads
              </Link>
              <Link
                href="/applications"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/applications") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Applications
              </Link>
              <Link
                href="/my-ads"
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActive("/my-ads") ? "text-blue-600 font-medium" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                My Ads
              </Link>

              {user ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {userProfile?.profileImage ? (
                        <img
                          src={userProfile.profileImage || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Link
                      href="/profile"
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/my-ads"
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      My Ads
                    </Link>
                    <Link
                      href="/applications"
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Applications
                    </Link>
                    <Link
                      href="/list-billboard"
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      List Billboard
                    </Link>
                    <Link
                      href="/post-job"
                      className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post Job
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
