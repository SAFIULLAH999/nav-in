import React, { useState } from 'react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-32 h-32 text-4xl'
  }

  const initials = (name || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'

  if (!src || hasError) {
    return (
      <div className={`bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold ${sizes[size]} ${className}`}>
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || 'Avatar'}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover ${sizes[size]} ${className}`}
    />
  )
}
