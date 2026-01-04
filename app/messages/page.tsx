'use client'

import React, { useState, useRef, useEffect } from 'react'

import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, Circle, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSocket } from '@/components/SocketProvider'
import { UserPresenceIndicator } from '@/components/UserPresenceIndicator'

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'text' | 'image' | 'file'
}

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    avatar: string
    title: string
    isOnline: boolean
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export default function MessagesPage() {
  const { socket, isConnected, isServerless, sendMessage, joinConversation, leaveConversation, onMessage, onUserOnline, onUserOffline } = useSocket()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.find(m => m.id === message.id)
        if (exists) return prev
        return [...prev, message]
      })

      // Update conversations list
      setConversations(prev => prev.map(conv => {
        if (conv.user.id === message.senderId || conv.user.id === message.receiverId) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageTime: new Date(message.timestamp).toLocaleTimeString()
          }
        }
        return conv
      }))
    }

    const handleUserOnline = (data: { userId: string }) => {
      setConversations(prev => prev.map(conv =>
        conv.user.id === data.userId
          ? { ...conv, participant: { ...conv.participant, isOnline: true } }
          : conv
      ))
    }

    const handleUserOffline = (data: { userId: string }) => {
      setConversations(prev => prev.map(conv =>
        conv.user.id === data.userId
          ? { ...conv, participant: { ...conv.participant, isOnline: false } }
          : conv
      ))
    }

    const handleConversationLoaded = (messages: any[]) => {
      setMessages(messages)
    }

    const handleUserTyping = (data: { userId: string, isTyping: boolean }) => {
      if (data.userId === selectedConversation?.user.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          if (data.isTyping) {
            newSet.add(data.userId)
          } else {
            newSet.delete(data.userId)
          }
          return newSet
        })
      }
    }

    onMessage(handleNewMessage)
    onUserOnline(handleUserOnline)
    onUserOffline(handleUserOffline)

    // Listen for conversation loading response
    socket.on('conversation_loaded', handleConversationLoaded)

    // Listen for typing indicators
    socket.on('user_typing', handleUserTyping)

    return () => {
      socket.off('conversation_loaded', handleConversationLoaded)
      socket.off('user_typing', handleUserTyping)
    }
  }, [socket, onMessage, onUserOnline, onUserOffline, selectedConversation])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (otherUserId: string) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (!token) return

      const response = await fetch(`/api/messages/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const filteredConversations = conversations.filter((conv: any) =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation || !isConnected) return

    try {
      setSendingMessage(true)

      // Send message via socket
      sendMessage(selectedConversation.user.id, messageInput.trim())
      setMessageInput('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleConversationSelect = (conversation: any) => {
    // Leave previous conversation room
    if (selectedConversation) {
      leaveConversation(selectedConversation.user.id)
    }

    setSelectedConversation(conversation)

    // Join new conversation room
    joinConversation(conversation.user.id)

    // Load messages via socket
    if (socket && isConnected) {
      socket.emit('load_conversation', conversation.user.id)
    } else {
      // Fallback to HTTP API if socket not connected
      loadMessages(conversation.user.id)
    }
  }

  const handleTyping = () => {
    if (!selectedConversation || !socket || !isConnected) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing_start', selectedConversation.user.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing_stop', selectedConversation.user.id)
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)
    handleTyping()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Serverless Environment Warning */}
      {isServerless && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Serverless Mode:</strong> Real-time messaging is not available in this deployment environment.
                Messages will be sent via HTTP requests instead.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-6 h-screen flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-border bg-card">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="overflow-y-auto h-full">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.participant.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <UserPresenceIndicator userId={conversation.participant.id} size="sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-text truncate">
                        {conversation.participant.name}
                      </h3>
                      <span className="text-xs text-text-muted">
                        {conversation.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-sm text-text-muted truncate mb-1">
                      {conversation.lastMessage}
                    </p>

                    <p className="text-xs text-text-muted">
                      {conversation.participant.title}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.participant.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <UserPresenceIndicator userId={selectedConversation.participant.id} size="md" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-text">
                      {selectedConversation.participant.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-text-muted">
                        {selectedConversation.participant.isOnline ? 'Online' : 'Offline'}
                      </p>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-text-muted" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-text-muted" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === 'current' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === 'current'
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-text'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === 'current' ? 'text-white/70' : 'text-text-muted'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-text px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-text-muted">typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 bottom-2 p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <Smile className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-text-muted" />
                  </button>

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-surface/30">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">Select a conversation</h3>
                <p className="text-text-muted">Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
