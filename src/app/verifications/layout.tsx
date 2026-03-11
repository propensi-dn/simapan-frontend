'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRole } from '@/lib/auth'

export default function VerificationsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const role = getRole()
    if (!role || !['STAFF', 'MANAGER', 'CHAIRMAN'].includes(role)) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {children}
    </div>
  )
}