'use client'

import { Search, MessageCircle, Phone, Video, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
}

const conversations: Conversation[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'SJ',
    lastMessage: 'Thanks for sharing that article! Very helpful insights.',
    timestamp: '2m ago',
    unread: 2
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: 'MC',
    lastMessage: 'Are you available for a quick call tomorrow?',
    timestamp: '1h ago',
    unread: 0
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: 'ER',
    lastMessage: 'The design looks great! Just one small change...',
    timestamp: '3h ago',
    unread: 1
  }
]

export function MessageSidebar() {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="col-span-4 border-r border-gray-200 bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search messages"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="overflow-y-auto h-full">
        {conversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))}
      </div>
    </motion.div>
  )
}

function ConversationItem({ conversation }: { conversation: Conversation }) {
  return (
    <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.avatar}
          </div>
          {conversation.unread > 0 && (
            <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate">{conversation.name}</h3>
            <span className="text-xs text-gray-500">{conversation.timestamp}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
        </div>
        <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
