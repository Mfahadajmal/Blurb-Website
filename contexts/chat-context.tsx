"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, orderBy, onSnapshot, getDoc, doc, updateDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { serverTimestamp, addDoc } from "firebase/firestore"

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  participants: string[]
  message: string
  timestamp: any
  read?: boolean
  type?: "text" | "image" | "file"
  fileUrl?: string
  fileName?: string
}

interface Chat {
  id: string
  participants: string[]
  lastMessage: string
  lastTimestamp: any
  senderId: string
  receiverId: string
  lastSenderId?: string
  read?: boolean
  otherUser?: {
    id: string
    username: string
    profileImage?: string
  }
  typing?: {
    [userId: string]: boolean
  }
}

interface ChatContextType {
  currentUser: any | null
  chats: Chat[]
  loading: boolean
  currentChat: string | null
  setCurrentChat: (chatId: string | null) => void
  messages: ChatMessage[]
  messagesLoading: boolean
  markChatAsRead: (chatId: string) => Promise<void>
  setTypingStatus: (chatId: string, isTyping: boolean) => Promise<void>
  isOtherUserTyping: (chatId: string) => boolean
  uploadAndSendImage: (chatId: string, file: File, receiverId: string) => Promise<void>
  getChatId: (userId1: string, userId2: string) => string
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [currentChat, setCurrentChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Helper function to get chat ID (same as mobile app)
  const getChatId = (userId1: string, userId2: string): string => {
    const sortedIds = [userId1, userId2].sort()
    return sortedIds.join("_")
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(!user)
    })
    return unsubscribe
  }, [])

  // Fetch chats when user is authenticated
  useEffect(() => {
    if (!currentUser) return

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastTimestamp", "desc"),
    )

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (docSnapshot) => {
        const chatData = docSnapshot.data()
        const senderId = chatData.senderId
        const receiverId = chatData.receiverId
        const otherUserId = senderId === currentUser.uid ? receiverId : senderId

        // Fetch other user's details
        let otherUser = undefined
        try {
          const userDocRef = doc(db, "users", otherUserId)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            otherUser = {
              id: otherUserId,
              username: userData.username || userData.fullName || userData.displayName || "User",
              profileImage: userData.profileImage || "",
            }
          } else {
            // If user document doesn't exist, create a placeholder
            otherUser = {
              id: otherUserId,
              username: "User",
              profileImage: "",
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Create a fallback user object
          otherUser = {
            id: otherUserId,
            username: "User",
            profileImage: "",
          }
        }

        return {
          id: docSnapshot.id,
          ...chatData,
          otherUser,
        }
      })

      const chatResults = await Promise.all(chatPromises)
      setChats(chatResults)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch messages when current chat changes
  useEffect(() => {
    if (!currentChat) {
      setMessages([])
      return
    }

    setMessagesLoading(true)
    const messagesQuery = query(collection(db, "chats", currentChat, "messages"), orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]

      // Reverse to show oldest first (like mobile app)
      setMessages(messageList.reverse())
      setMessagesLoading(false)

      // Mark messages as read if they're from the other user
      if (currentUser) {
        markChatAsRead(currentChat)
      }
    })

    return () => unsubscribe()
  }, [currentChat, currentUser])

  // Mark chat as read
  const markChatAsRead = async (chatId: string) => {
    if (!currentUser) return

    try {
      const chatRef = doc(db, "chats", chatId)
      const chatDoc = await getDoc(chatRef)

      if (chatDoc.exists()) {
        const chatData = chatDoc.data()

        // Only mark as read if the last message is from the other user
        if (chatData.senderId && chatData.senderId !== currentUser.uid) {
          await updateDoc(chatRef, {
            read: true,
          })
        }
      }
    } catch (error) {
      console.error("Error marking chat as read:", error)
    }
  }

  // Set typing status
  const setTypingStatus = async (chatId: string, isTyping: boolean) => {
    if (!currentUser) return

    try {
      const chatRef = doc(db, "chats", chatId)
      const typingField = `typing.${currentUser.uid}`

      await updateDoc(chatRef, {
        [typingField]: isTyping,
      })
    } catch (error) {
      console.error("Error updating typing status:", error)
    }
  }

  // Check if other user is typing
  const isOtherUserTyping = (chatId: string) => {
    if (!currentUser) return false

    const chat = chats.find((c) => c.id === chatId)
    if (!chat || !chat.typing) return false

    const otherUserId = chat.participants.find((id) => id !== currentUser.uid)
    return otherUserId ? !!chat.typing[otherUserId] : false
  }

  // Upload and send image
  const uploadAndSendImage = async (chatId: string, file: File, receiverId: string) => {
    if (!currentUser) return

    try {
      // Upload to ImgBB
      const formData = new FormData()
      formData.append("image", file)
      formData.append("key", "1c68955746294f27f97d3aee877488ea") // ImgBB API Key

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = data.data.url
        const now = serverTimestamp()

        // Add message to subcollection (matching mobile app structure)
        const messageData = {
          senderId: currentUser.uid,
          receiverId: receiverId,
          participants: [currentUser.uid, receiverId],
          message: "Sent an image",
          timestamp: now,
          type: "image",
          fileUrl: imageUrl,
          fileName: file.name,
        }

        await addDoc(collection(db, "chats", chatId, "messages"), messageData)

        // Update chat document (matching mobile app structure)
        await setDoc(
          doc(db, "chats", chatId),
          {
            participants: [currentUser.uid, receiverId],
            lastMessage: "Sent an image",
            lastTimestamp: now,
            senderId: currentUser.uid,
            receiverId: receiverId,
          },
          { merge: true },
        )
      } else {
        throw new Error("Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading and sending image:", error)
      throw error
    }
  }

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        chats,
        loading,
        currentChat,
        setCurrentChat,
        messages,
        messagesLoading,
        markChatAsRead,
        setTypingStatus,
        isOtherUserTyping,
        uploadAndSendImage,
        getChatId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
