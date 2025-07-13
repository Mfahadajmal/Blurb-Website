"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle, Check, Search, ArrowLeft, Plus } from "lucide-react"
import Navbar from "@/components/navbar"
import { useChat } from "@/contexts/chat-context"
import { useState, useEffect } from "react"

export default function ChatsPage() {
  const router = useRouter()
  const { chats, loading, setCurrentChat, currentUser } = useChat()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredChats, setFilteredChats] = useState(chats)
  const [showSearch, setShowSearch] = useState(false)

  // Filter chats based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const filtered = chats.filter((chat) => chat.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredChats(filtered)
  }, [searchQuery, chats])

  const handleChatClick = (chatId: string) => {
    setCurrentChat(chatId)
    router.push(`/chats/${chatId}`)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Header */}
          <div className="relative border-b border-gray-100 bg-white p-4">
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
          <div className="h-[calc(100vh-200px)] overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading conversations...</p>
                </div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {searchQuery ? "No matching conversations" : "No conversations yet"}
                </h3>
                <p className="mb-6 max-w-md text-gray-600">
                  {searchQuery
                    ? "Try searching with a different term"
                    : "Connect with billboard owners and advertisers by starting a conversation"}
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
                {filteredChats.map((chat) => {
                  const isLastMessageMine = chat.lastSenderId === currentUser?.uid
                  const isUnread = !chat.read && !isLastMessageMine

                  return (
                    <div
                      key={chat.id}
                      className={`group flex cursor-pointer items-center gap-4 border-b border-gray-100 p-4 transition-all hover:bg-white ${
                        isUnread ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleChatClick(chat.id)}
                    >
                      <div className="relative">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                          {chat.otherUser?.profileImage ? (
                            <Image
                              src={chat.otherUser.profileImage || "/placeholder.svg"}
                              alt={chat.otherUser.username || "User"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {chat.otherUser?.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        {isUnread && (
                          <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-white bg-blue-600"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-medium truncate ${
                              isUnread ? "text-blue-700 font-semibold" : "text-gray-900"
                            }`}
                          >
                            {chat.otherUser?.username || "User"}
                          </h3>
                          <span className={`text-xs ${isUnread ? "font-medium text-blue-700" : "text-gray-500"}`}>
                            {chat.lastTimestamp?.toDate &&
                              formatDistanceToNow(chat.lastTimestamp.toDate(), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <p className={`text-sm truncate ${isUnread ? "text-blue-700 font-medium" : "text-gray-600"}`}>
                            {isLastMessageMine && (
                              <span className="mr-1 inline-flex">
                                <Check size={14} className={chat.read ? "text-blue-500" : "text-gray-400"} />
                                <Check size={14} className={`-ml-1 ${chat.read ? "text-blue-500" : "text-gray-400"}`} />
                              </span>
                            )}
                            {chat.lastMessage}
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
      </div>
    </>
  )
}
