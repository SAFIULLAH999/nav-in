'use client'

import { Phone, Video, Info, Smile, Paperclip, Send } from 'lucide-react'
import { motion } from 'framer-motion'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  isOwn: boolean
}

const messages: Message[] = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    content: 'Hey! I saw your post about React performance optimizations. That was really insightful!',
    timestamp: '10:30 AM',
    isOwn: false
  },
  {
    id: '2',
    sender: 'You',
    content: 'Thanks Sarah! I\'m glad you found it helpful. The new concurrent features are definitely game-changing.',
    timestamp: '10:32 AM',
    isOwn: true
  },
  {
    id: '3',
    sender: 'Sarah Johnson',
    content: 'Absolutely! We\'ve been experimenting with them in our latest project. Have you tried the new useDeferredValue hook?',
    timestamp: '10:33 AM',
    isOwn: false
  },
  {
    id: '4',
    sender: 'You',
    content: 'Yes! It\'s been incredibly useful for our search functionality. The user experience is much smoother now.',
    timestamp: '10:35 AM',
    isOwn: true
  }
]

export function ChatWindow() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-8 flex flex-col bg-white"
    >
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            SJ
          </div>
          <div>
            <h3 className="font-semibold">Sarah Johnson</h3>
            <p className="text-sm text-gray-500">Senior Frontend Developer at Google</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Write a message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-12"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Smile className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button className="p-2 bg-primary text-white rounded-full hover:bg-secondary transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.isOwn) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-primary text-white rounded-lg px-4 py-2 mb-1">
            <p className="text-sm">{message.content}</p>
          </div>
          <p className="text-xs text-gray-500 text-right">{message.timestamp}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-xs lg:max-w-md">
        <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 mb-1">
          <p className="text-sm">{message.content}</p>
        </div>
        <p className="text-xs text-gray-500">{message.timestamp}</p>
      </div>
    </div>
  )
}
