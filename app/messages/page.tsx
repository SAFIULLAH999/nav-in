'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Search, Send, Phone, Video, MoreVertical, Smile, Paperclip, Circle, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversations: Conversation[] = [
    {
      id: '1',
      participant: {
        id: '1',
        name: 'Alice Johnson',
        avatar: '/avatars/alice.jpg',
        title: 'UX Designer at DesignCo',
        isOnline: true
      },
      lastMessage: 'Thanks for the feedback on the design!',
      lastMessageTime: '2 min ago',
      unreadCount: 2,
      messages: [
        {
          id: '1',
          senderId: '1',
          content: 'Hey! I saw your post about the new design system. It looks amazing!',
          timestamp: '10:30 AM',
          isRead: true,
          type: 'text'
        },
        {
          id: '2',
          senderId: 'current',
          content: 'Thank you! I put a lot of work into it. The new color palette really makes a difference.',
          timestamp: '10:32 AM',
          isRead: true,
          type: 'text'
        },
        {
          id: '3',
          senderId: '1',
          content: 'Thanks for the feedback on the design!',
          timestamp: '2 min ago',
          isRead: false,
          type: 'text'
        }
      ]
    },
    {
      id: '2',
      participant: {
        id: '2',
        name: 'Bob Smith',
        avatar: '/avatars/bob.jpg',
        title: 'Frontend Developer at WebCorp',
        isOnline: false
      },
      lastMessage: 'Can we schedule a call to discuss the project?',
      lastMessageTime: '1 hour ago',
      unreadCount: 0,
      messages: []
    }
  ]

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation) return

    // TODO: Implement message sending
    console.log('Sending message:', messageInput)
    setMessageInput('')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-20 h-screen flex">
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
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.participant.name.charAt(0)}
                    </div>
                    {conversation.participant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
                    )}
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
                    {selectedConversation.participant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-text">
                      {selectedConversation.participant.name}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {selectedConversation.participant.isOnline ? 'Online' : 'Offline'}
                    </p>
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
                {selectedConversation.messages.map((message) => (
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
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
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
                    disabled={!messageInput.trim()}
                    className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
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
