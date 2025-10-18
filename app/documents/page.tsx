'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { CollaborativeEditor } from '@/components/CollaborativeEditor'
import { DocumentList } from '@/components/DocumentList'
import { useLiveblocks } from '@/components/providers/LiveblocksProvider'

export default function DocumentsPage() {
  const { enterRoom, leaveRoom, isConnected } = useLiveblocks()
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    // Load user's documents
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleDocumentSelect = (documentId: string) => {
    if (selectedDocument) {
      leaveRoom(`document-${selectedDocument}`)
    }
    setSelectedDocument(documentId)
    enterRoom(`document-${documentId}`)
  }

  const handleDocumentCreate = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Untitled Document',
          content: ''
        })
      })

      if (response.ok) {
        const newDoc = await response.json()
        setDocuments(prev => [newDoc.document, ...prev])
        handleDocumentSelect(newDoc.document.id)
      }
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto flex pt-16">
        <LeftSidebar />

        <main className="flex-1 max-w-4xl mx-4 lg:mx-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text">Collaborative Documents</h1>
                <p className="text-text-muted">Work together in real-time</p>
              </div>

              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    Real-time collaboration features unavailable
                  </p>
                </div>
              )}
            </div>

            {/* Document Selection */}
            <DocumentList
              documents={documents}
              selectedDocument={selectedDocument}
              onDocumentSelect={handleDocumentSelect}
              onDocumentCreate={handleDocumentCreate}
            />

            {/* Document Editor */}
            {selectedDocument ? (
              <CollaborativeEditor
                documentId={selectedDocument}
                onDocumentUpdate={(content) => {
                  // Auto-save functionality
                  console.log('Document updated:', content)
                }}
              />
            ) : (
              <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">Select a document to start collaborating</h3>
                <p className="text-text-muted mb-6">Choose an existing document or create a new one to begin real-time collaboration.</p>
                <button
                  onClick={handleDocumentCreate}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Create New Document
                </button>
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}