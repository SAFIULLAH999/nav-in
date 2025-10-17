import { MessageSidebar } from '@/components/MessageSidebar'
import { ChatWindow } from '@/components/ChatWindow'

export default function MessagesPage() {
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-12 h-[600px]">
        <MessageSidebar />
        <ChatWindow />
      </div>
    </div>
  )
}
