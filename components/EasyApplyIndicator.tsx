'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Zap, Globe, Mail, Smartphone } from 'lucide-react'

interface EasyApplyIndicatorProps {
  jobId: string
  isEasyApply: boolean
  externalUrl?: string
  applicationMethod?: string
  onApply?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export const EasyApplyIndicator: React.FC<EasyApplyIndicatorProps> = ({
  jobId,
  isEasyApply,
  externalUrl,
  applicationMethod = 'EXTERNAL',
  onApply,
  size = 'md'
}) => {
  const getApplicationMethodIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />
      case 'PHONE':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getApplicationMethodLabel = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return 'Apply by Email'
      case 'PHONE':
        return 'Apply by Phone'
      default:
        return 'External Application'
    }
  }

  if (isEasyApply) {
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center space-x-1">
          <Zap className="w-3 h-3 text-green-600" />
          <span className="text-xs font-medium">Easy Apply</span>
        </Badge>
        
        <Button
          size={size === 'sm' ? 'sm' : 'default'}
          className="bg-primary hover:bg-primary/90 text-white font-medium"
          onClick={onApply}
        >
          <Zap className="w-4 h-4 mr-2" />
          Apply Now
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center space-x-1">
        {getApplicationMethodIcon(applicationMethod)}
        <span className="text-xs font-medium">
          {getApplicationMethodLabel(applicationMethod)}
        </span>
      </Badge>
      
      {externalUrl && (
        <Button
          size={size === 'sm' ? 'sm' : 'default'}
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={() => window.open(externalUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Go to Website
        </Button>
      )}
    </div>
  )
}

// Component for displaying application method in job listings
export const JobApplicationMethod: React.FC<{
  isEasyApply: boolean
  externalUrl?: string
  applicationMethod?: string
}> = ({
  isEasyApply,
  externalUrl,
  applicationMethod = 'EXTERNAL'
}) => {
  if (isEasyApply) {
    return (
      <div className="flex items-center space-x-2">
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <span className="flex items-center space-x-1 text-xs">
            <Zap className="w-3 h-3" />
            <span>Easy Apply</span>
          </span>
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <span className="flex items-center space-x-1 text-xs">
          {getApplicationMethodIcon(applicationMethod)}
          <span>{getApplicationMethodLabel(applicationMethod)}</span>
        </span>
      </Badge>
      
      {externalUrl && (
        <ExternalLink className="w-4 h-4 text-blue-600 hover:text-blue-800 cursor-pointer" />
      )}
    </div>
  )
}

// Helper function to get application method icon
const getApplicationMethodIcon = (method: string) => {
  switch (method) {
    case 'EMAIL':
      return <Mail className="w-4 h-4" />
    case 'PHONE':
      return <Smartphone className="w-4 h-4" />
    default:
      return <Globe className="w-4 h-4" />
  }
}

// Helper function to get application method label
const getApplicationMethodLabel = (method: string) => {
  switch (method) {
    case 'EMAIL':
      return 'Apply by Email'
    case 'PHONE':
      return 'Apply by Phone'
    default:
      return 'External Application'
  }
}