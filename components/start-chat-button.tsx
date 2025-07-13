"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/firebase/config"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useChat } from "@/contexts/chat-context"

interface StartChatButtonProps {
  otherUserId: string
  otherUsername: string
  className?: string
}

export default function StartChatButton({ otherUserId, otherUsername, className = "" }: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { getChatId } = useChat()
  const currentUser = auth.currentUser

  const handleStartChat = async () => {
    if (!currentUser || currentUser.uid === otherUserId) return

    setIsLoading(true)
    try {
      // Generate chat ID using the same logic as mobile app
      const chatId = getChatId(currentUser.uid, otherUserId)

      // Create or update chat document with mobile app structure
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [currentUser.uid, otherUserId],
          lastMessage: `Chat started with ${otherUsername}`,
          lastTimestamp: serverTimestamp(),
          senderId: currentUser.uid,
          receiverId: otherUserId,
        },
        { merge: true },
      )

      // Navigate to the chat
      router.push(`/chats/${chatId}`)
    } catch (error) {
      console.error("Error starting chat:", error)
      alert("Failed to start chat. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentUser || currentUser.uid === otherUserId) {
    return null
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 ${className}`}
    >
      <MessageCircle size={18} />
      {isLoading ? "Starting..." : "Start Chat"}
    </button>
  )
}
