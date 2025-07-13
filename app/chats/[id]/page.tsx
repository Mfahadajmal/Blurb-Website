"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { format, formatDistanceToNow } from "date-fns"
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Check,
 

  Info,
  
  Paperclip,
  Mic,
  Search,
  Plus,
} from "lucide-react"
import { doc, collection, addDoc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useChat } from "@/contexts/chat-context"
import Navbar from "@/components/navbar"

export default function ChatDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const {
    currentUser,
    messages,
    messagesLoading,
    chats,
    setCurrentChat,
    markChatAsRead,
    setTypingStatus,
    isOtherUserTyping,
    uploadAndSendImage,
    getChatId,
  } = useChat()
  const [messageText, setMessageText] = useState("")
  const [otherUserInfo, setOtherUserInfo] = useState<{ id: string; username: string; profileImage?: string } | null>(
    null,
  )
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredChats, setFilteredChats] = useState(chats)
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
 
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  

  const chat = chats.find((c) => c.id === id)
  const otherUserTyping = isOtherUserTyping(id as string)

  // Filter chats based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const filtered = chats.filter((chat) => chat.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredChats(filtered)
  }, [searchQuery, chats])

  // Fetch other user info if not available in chat
  useEffect(() => {
    const fetchOtherUserInfo = async () => {
      if (!currentUser || !id) return

      try {
        // Get the chat document to find participants
        const chatDoc = await getDoc(doc(db, "chats", id as string))

        if (chatDoc.exists()) {
          const chatData = chatDoc.data()
          const senderId = chatData.senderId
          const receiverId = chatData.receiverId
          const otherUserId = senderId === currentUser.uid ? receiverId : senderId

          if (otherUserId) {
            // Get the other user's document
            const userDoc = await getDoc(doc(db, "users", otherUserId))

            if (userDoc.exists()) {
              const userData = userDoc.data()
              setOtherUserInfo({
                id: otherUserId,
                username: userData.username || userData.fullName || userData.displayName || "Unknown User",
                profileImage: userData.profileImage || "",
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching other user info:", error)
      }
    }

    // Only fetch if we don't already have the info from the chat context
    if (!chat?.otherUser) {
      fetchOtherUserInfo()
    }
  }, [currentUser, id, chat])

  // Use either the info from chat context or what we fetched separately
  const otherUser = chat?.otherUser || otherUserInfo

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Set current chat when component mounts
  useEffect(() => {
    if (id) {
      setCurrentChat(id as string)
      markChatAsRead(id as string)
    }

    return () => {
      // Clear current chat when component unmounts
      setCurrentChat(null)
    }
  }, [id, setCurrentChat, markChatAsRead])

  // Handle typing status
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout | null = null

    if (messageText && id) {
      setTypingStatus(id as string, true)

      // Clear typing status after 3 seconds of inactivity
      if (typingTimeout) clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => {
        setTypingStatus(id as string, false)
      }, 3000)
    } else if (id) {
      setTypingStatus(id as string, false)
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
      if (id) setTypingStatus(id as string, false)
    }
  }, [messageText, id, setTypingStatus])

  

  
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !currentUser || !id || !otherUser) return

    try {
      const chatId = id as string
      const now = serverTimestamp()

      // Message data structure matching mobile app
      const messageData = {
        senderId: currentUser.uid,
        receiverId: otherUser.id,
        participants: [currentUser.uid, otherUser.id],
        message: messageText.trim(),
        timestamp: now,
      }

      // Add message to subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), messageData)

      // Update chat document (matching mobile app structure)
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [currentUser.uid, otherUser.id],
          lastMessage: messageText.trim(),
          lastTimestamp: now,
          senderId: currentUser.uid,
          receiverId: otherUser.id,
        },
        { merge: true },
      )

      setMessageText("")

      // Focus back on input after sending
      inputRef.current?.focus()
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

 

  const handleChatClick = (chatId: string) => {
    setCurrentChat(chatId)
    router.push(`/chats/${chatId}`)
  }

  // Group messages by date
  const groupedMessages: { [date: string]: typeof messages } = {}
  messages.forEach((message) => {
    if (message.timestamp?.toDate) {
      const date = format(message.timestamp.toDate(), "MMMM d, yyyy")
      if (!groupedMessages[date]) {
        groupedMessages[date] = []
      }
      groupedMessages[date].push(message)
    }
  })

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex h-[calc(100vh-160px)] overflow-hidden rounded-xl shadow-lg">
          {/* Chat List - Left Column */}
          <div className="w-full max-w-sm border-r border-gray-200 bg-white md:block">
            {/* Chat List Header */}
            <div className="border-b border-gray-100 bg-white p-4">
              {showSearch ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSearch(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border-none bg-gray-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSearch(true)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                    >
                      <Search size={20} />
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Chat List */}
            <div className="h-[calc(100vh-220px)] overflow-y-auto bg-white">
              {chats.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                    <MessageCircle className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">No conversations yet</h3>
                  <p className="mb-6 max-w-md text-gray-600">
                    Connect with billboard owners and advertisers by starting a conversation
                  </p>
                  <button
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-white transition-all hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    <span>Start a conversation</span>
                  </button>
                </div>
              ) : (
                <div>
                  {filteredChats.map((chatItem) => {
                    const isLastMessageMine = chatItem.senderId === currentUser?.uid
                    const isUnread = !chatItem.read && !isLastMessageMine
                    const isActive = chatItem.id === id

                    return (
                      <div
                        key={chatItem.id}
                        className={`group flex cursor-pointer items-center gap-4 border-b border-gray-100 p-4 transition-all hover:bg-gray-50 ${
                          isUnread ? "bg-blue-50 hover:bg-blue-50" : ""
                        } ${isActive ? "bg-gray-100 hover:bg-gray-100" : ""}`}
                        onClick={() => handleChatClick(chatItem.id)}
                      >
                        <div className="relative">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                            {chatItem.otherUser?.profileImage ? (
                              <Image
                                src={chatItem.otherUser.profileImage || "/placeholder.svg"}
                                alt={chatItem.otherUser.username || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                {chatItem.otherUser?.username?.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                         
                          {isUnread && (
                            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-600"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-medium truncate ${
                                isUnread ? "text-blue-700 font-semibold" : "text-gray-900"
                              }`}
                            >
                              {chatItem.otherUser?.username || "User"}
                            </h3>
                            <span className={`text-xs ${isUnread ? "font-medium text-blue-700" : "text-gray-500"}`}>
                              {chatItem.lastTimestamp?.toDate &&
                                formatDistanceToNow(chatItem.lastTimestamp.toDate(), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <p
                              className={`text-sm truncate ${isUnread ? "text-blue-700 font-medium" : "text-gray-600"}`}
                            >
                              {isLastMessageMine && (
                                <span className="mr-1 inline-flex">
                                  <Check size={14} className={chatItem.read ? "text-blue-500" : "text-gray-400"} />
                                  <Check
                                    size={14}
                                    className={`-ml-1 ${chatItem.read ? "text-blue-500" : "text-gray-400"}`}
                                  />
                                </span>
                              )}
                              {chatItem.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Detail - Right Column */}
          <div className="hidden w-full flex-1 flex-col bg-white md:flex">
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm">
                    {otherUser?.profileImage ? (
                      <Image
                        src={otherUser.profileImage || "/placeholder.svg"}
                        alt={otherUser.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                        {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                 
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">{otherUser?.username || "Loading..."}</h2>
                  <p className="text-xs text-gray-500">
                   
                  
          
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                
              
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="h-[calc(100vh-280px)] overflow-y-auto bg-gray-50 p-4">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                    <MessageCircle className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">Start a conversation</h3>
                  <p className="mb-6 max-w-md text-gray-600">
                    Say hello to {otherUser?.username || "this user"} and start chatting!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col space-y-6">
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div className="relative mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">{date}</div>
                      </div>

                      <div className="space-y-3">
                        {dateMessages.map((message, index) => {
                          const isMe = message.senderId === currentUser?.uid
                          const timestamp = message.timestamp?.toDate?.()
                          const showAvatar =
                            index === 0 ||
                            dateMessages[index - 1]?.senderId !== message.senderId ||
                            (timestamp &&
                              dateMessages[index - 1]?.timestamp?.toDate &&
                              timestamp.getTime() - dateMessages[index - 1].timestamp.toDate().getTime() > 300000) // 5 minutes

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                                !showAvatar && !isMe ? "pl-12" : ""
                              }`}
                            >
                              {!isMe && showAvatar && (
                                <div className="mr-2 mt-1 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                                  {otherUser?.profileImage ? (
                                    <Image
                                      src={otherUser.profileImage || "/placeholder.svg"}
                                      alt={otherUser.username || "User"}
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                      {otherUser?.username?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className={`max-w-[75%] ${!isMe && !showAvatar ? "ml-12" : ""} group relative`}>
                                {message.type === "image" ? (
                                  <div
                                    className={`overflow-hidden rounded-2xl ${
                                      isMe
                                        ? "rounded-br-none bg-gradient-to-r from-blue-500 to-blue-600"
                                        : "rounded-bl-none bg-white shadow-sm"
                                    }`}
                                  >
                                    <Image
                                      src={message.fileUrl || "/placeholder.svg"}
                                      alt="Shared image"
                                      width={300}
                                      height={200}
                                      className="object-contain max-h-[300px] w-auto cursor-pointer transition-transform hover:scale-105"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`rounded-2xl px-4 py-3 ${
                                      isMe
                                        ? "rounded-br-none bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                        : "rounded-bl-none bg-white shadow-sm"
                                    }`}
                                  >
                                    <p className="text-sm">{message.message}</p>
                                  </div>
                                )}

                                <div
                                  className={`mt-1 flex items-center text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 ${
                                    isMe ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  {timestamp && <span>{format(timestamp, "h:mm a")}</span>}

                                  {isMe && (
                                    <div className="ml-1 flex">
                                      <Check size={12} className={message.read ? "text-blue-500" : "text-gray-400"} />
                                      <Check
                                        size={12}
                                        className={`-ml-1 ${message.read ? "text-blue-500" : "text-gray-400"}`}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {otherUserTyping && (
                    <div className="flex justify-start">
                      <div className="ml-12 max-w-[75%] rounded-2xl rounded-bl-none bg-white px-4 py-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div
                            className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2">
               

               

               

                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full rounded-full border-none bg-gray-100 py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isUploading}
                  />
                </div>

                {messageText.trim() ? (
                  <button
                    type="submit"
                    disabled={!messageText.trim() || isUploading}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Mobile view - only show chat detail when a chat is selected */}
          <div className="flex w-full flex-col bg-white md:hidden">
            {id ? (
              <>
                {/* Chat header for mobile */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push("/chats")}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          {otherUser?.profileImage ? (
                            <Image
                              src={otherUser.profileImage || "/placeholder.svg"}
                              alt={otherUser.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                       
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-900">{otherUser?.username || "Loading..."}</h2>
                        <p className="text-xs text-gray-500">
                          
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                   
                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                      <Info size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages area for mobile */}
                <div ref={messagesContainerRef} className="h-[calc(100vh-280px)] overflow-y-auto bg-gray-50 p-4">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm text-gray-500">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <MessageCircle className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">Start a conversation</h3>
                      <p className="mb-6 max-w-md text-gray-600">
                        Say hello to {otherUser?.username || "this user"} and start chatting!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-6">
                      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                          <div className="relative mb-4 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                              {date}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {dateMessages.map((message, index) => {
                              const isMe = message.senderId === currentUser?.uid
                              const timestamp = message.timestamp?.toDate?.()
                              const showAvatar =
                                index === 0 ||
                                dateMessages[index - 1]?.senderId !== message.senderId ||
                                (timestamp &&
                                  dateMessages[index - 1]?.timestamp?.toDate &&
                                  timestamp.getTime() - dateMessages[index - 1].timestamp.toDate().getTime() > 300000) // 5 minutes

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                                    !showAvatar && !isMe ? "pl-12" : ""
                                  }`}
                                >
                                  {!isMe && showAvatar && (
                                    <div className="mr-2 mt-1 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                                      {otherUser?.profileImage ? (
                                        <Image
                                          src={otherUser.profileImage || "/placeholder.svg"}
                                          alt={otherUser.username || "User"}
                                          width={40}
                                          height={40}
                                          className="h-10 w-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                          {otherUser?.username?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className={`max-w-[75%] ${!isMe && !showAvatar ? "ml-12" : ""} group relative`}>
                                    {message.type === "image" ? (
                                      <div
                                        className={`overflow-hidden rounded-2xl ${
                                          isMe
                                            ? "rounded-br-none bg-gradient-to-r from-blue-500 to-blue-600"
                                            : "rounded-bl-none bg-white shadow-sm"
                                        }`}
                                      >
                                        <Image
                                          src={message.fileUrl || "/placeholder.svg"}
                                          alt="Shared image"
                                          width={300}
                                          height={200}
                                          className="object-contain max-h-[300px] w-auto cursor-pointer transition-transform hover:scale-105"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className={`rounded-2xl px-4 py-3 ${
                                          isMe
                                            ? "rounded-br-none bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                            : "rounded-bl-none bg-white shadow-sm"
                                        }`}
                                      >
                                        <p className="text-sm">{message.message}</p>
                                      </div>
                                    )}

                                    <div
                                      className={`mt-1 flex items-center text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 ${
                                        isMe ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      {timestamp && <span>{format(timestamp, "h:mm a")}</span>}

                                      {isMe && (
                                        <div className="ml-1 flex">
                                          <Check
                                            size={12}
                                            className={message.read ? "text-blue-500" : "text-gray-400"}
                                          />
                                          <Check
                                            size={12}
                                            className={`-ml-1 ${message.read ? "text-blue-500" : "text-gray-400"}`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {otherUserTyping && (
                        <div className="flex justify-start">
                          <div className="ml-12 max-w-[75%] rounded-2xl rounded-bl-none bg-white px-4 py-3 shadow-sm">
                            <div className="flex space-x-1">
                              <div
                                className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message input for mobile */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-2">
                   


                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full rounded-full border-none bg-gray-100 py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUploading}
                      />
                    </div>

                    {messageText.trim() ? (
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isUploading}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Mic size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Select a conversation</h3>
                <p className="mb-6 max-w-md text-gray-600">Choose a chat from the list or start a new conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
