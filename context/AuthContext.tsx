"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { auth } from "@/firebase/config"
import { onAuthStateChanged } from "firebase/auth"

interface AuthContextType {
  currentUser: any | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ currentUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
