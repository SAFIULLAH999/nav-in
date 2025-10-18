'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLiveblocks } from '@/components/providers/LiveblocksProvider'
import { useOthers, useUpdateMyPresence } from '@liveblocks/react'
import { motion } from 'framer-motion'

interface CollaborativeEditorProps {
  documentId: string
  onDocumentUpdate?: (content: string) => void
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  onDocumentUpdate
}) => {
  const { isConnected } = useLiveblocks()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('Untitled Document')
  const [isSaving, setIsSaving] = useState(false)

  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()

  // Handle cursor position and user activity
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        updateMyPresence({
          cursor: {
            x: range.getBoundingClientRect().left,
            y: range.getBoundingClientRect().top
          },
          lastSeen: Date.now()
        })
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateMyPresence])

  // Load document content
  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setContent(data.document.content || '')
        setTitle(data.document.title || 'Untitled Document')
      }
    } catch (error) {
      console.error('Error loading document:', error)
    }
  }

  const handleContentChange = useCallback(async (newContent: string) => {
    setContent(newContent)
    onDocumentUpdate?.(newContent)

    // Auto-save functionality
    if (!isSaving) {
      setIsSaving(true)
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
        if (!token) return

        await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: newContent,
            title
          })
        })
      } catch (error) {
        console.error('Error saving document:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }, [documentId, title, isSaving, onDocumentUpdate])

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle)

    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return

      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          title: newTitle
        })
      })
    } catch (error) {
      console.error('Error saving document title:', error)
    }
  }, [documentId, content])

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      {/* Editor Header */}
      <div className="p-4 border-b border-border bg-surface">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none text-text flex-1"
            placeholder="Document title..."
          />

          <div className="flex items-center space-x-4">
            {/* Live Cursors */}
            {isConnected && others.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-2 px-2 py-1 bg-primary/10 rounded"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-text-muted">
                  {user.info?.name || 'Anonymous'}
                </span>
              </div>
            ))}

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-text-muted">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Save Status */}
            {isSaving && (
              <span className="text-sm text-text-muted">Saving...</span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your collaborative document..."
          className="w-full h-96 p-6 bg-transparent border-none outline-none resize-none text-text"
          style={{ minHeight: '400px' }}
        />

        {/* Live Cursors Overlay */}
        {isConnected && others.map((user) => {
          const cursor = user.presence?.cursor as { x: number; y: number } | undefined
          return cursor && (
            <motion.div
              key={user.id}
              className="absolute pointer-events-none z-10"
              initial={{
                x: cursor.x,
                y: cursor.y
              }}
              animate={{
                x: cursor.x,
                y: cursor.y
              }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="bg-primary text-white px-2 py-1 rounded text-xs">
                {user.info?.name || 'Anonymous'}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Editor Footer */}
      <div className="p-4 border-t border-border bg-surface">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center space-x-4">
            <span>Real-time collaboration powered by Liveblocks</span>
            {others.length > 0 && (
              <span>• {others.length} user{others.length > 1 ? 's' : ''} online</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors">
              Share
            </button>
            <button className="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}