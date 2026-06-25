'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/sign-up')
  }, [router])

  return null
}
