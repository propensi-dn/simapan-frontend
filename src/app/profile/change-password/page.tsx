'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    try {
      await api.post('/users/change-password/', formData)
      router.push('/profile')
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan.")
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-xl">
        <h1 className="text-h4 font-bold text-text-primary mb-8 text-center">Ubah Kata Sandi</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-p3 mb-6 font-bold">{error}</div>}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-text-tertiary">Old Password</label>
            <input 
              type="password" 
              required 
              onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
              className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-100" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-text-tertiary">New Password</label>
            <input 
              type="password" 
              required 
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-100" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-text-tertiary">Confirm Password</label>
            <input 
              type="password" 
              required 
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-100" 
            />
          </div>
          
          <div className="pt-4 space-y-3">
            <Button type="submit" className="w-full bg-primary-950 text-white rounded-xl py-4">Pembarui Kata Sandi</Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full rounded-xl py-4 border-gray-200">Batal</Button>
          </div>
        </form>
      </div>
    </div>
  )
}