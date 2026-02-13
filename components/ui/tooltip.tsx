'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface TooltipProviderProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  side = 'top', 
  align = 'center',
  className 
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const getTooltipPosition = () => {
    switch (side) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    }
  }

  const getTooltipAlign = () => {
    switch (align) {
      case 'start':
        return side === 'top' || side === 'bottom' ? 'items-start' : 'justify-start'
      case 'end':
        return side === 'top' || side === 'bottom' ? 'items-end' : 'justify-end'
      default:
        return 'items-center'
    }
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isOpen && content && (
        <div 
          className={cn(
            "absolute z-50 px-3 py-2 text-sm font-medium text-white bg-black rounded-md shadow-lg",
            "pointer-events-none",
            getTooltipPosition(),
            getTooltipAlign(),
            className
          )}
        >
          {content}
          <div className="absolute w-2 h-2 bg-black transform rotate-45"></div>
        </div>
      )}
    </div>
  )
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild = false }) => {
  return asChild ? <>{children}</> : <div>{children}</div>
}

export const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  side = 'top', 
  align = 'center',
  className 
}) => {
  return (
    <div className={cn(
      "px-3 py-2 text-sm font-medium text-white bg-black rounded-md shadow-lg",
      className
    )}>
      {children}
    </div>
  )
}