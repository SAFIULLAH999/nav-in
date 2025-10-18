'use client'

import React from 'react'
import { Plus, FileText, Users, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface Document {
  id: string
  title: string
  content: string
  authorId: string
  collaborators?: string[]
  lastModified: string
  isPublic: boolean
}

interface DocumentListProps {
  documents: Document[]
  selectedDocument: string | null
  onDocumentSelect: (documentId: string) => void
  onDocumentCreate: () => void
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocument,
  onDocumentSelect,
  onDocumentCreate
}) => {
  return (
    <div className="bg-card rounded-xl shadow-soft border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text">Your Documents</h2>
        <button
          onClick={onDocumentCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No documents yet. Create your first collaborative document!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDocumentSelect(document.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDocument === document.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {document.isPublic && (
                    <div title="Public document">
                      <Users className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(document.lastModified).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-medium text-text mb-2 line-clamp-2">
                {document.title || 'Untitled Document'}
              </h3>

              <p className="text-sm text-text-muted line-clamp-2 mb-3">
                {document.content?.substring(0, 100) || 'No content yet...'}
              </p>

              {document.collaborators && document.collaborators.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-text-muted">
                  <Users className="w-3 h-3" />
                  <span>{document.collaborators.length} collaborators</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}