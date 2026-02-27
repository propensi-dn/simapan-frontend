'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { logout } from '@/lib/auth'

// Logout icon
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      router.push('/')
    } catch {
      // logout() sudah handle redirect, tapi kalau gagal tetap redirect
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<LogoutIcon />}
      title="Konfirmasi Keluar"
      description="Apakah Anda yakin ingin keluar dari sistem SI-MAPAN? Pastikan semua data transaksi telah tersimpan."
      cancelLabel="Batal"
      confirmLabel="Ya, Keluar"
      confirmVariant="primary"
      onConfirm={handleLogout}
      loading={loading}
      size="sm"
    />
  )
}
