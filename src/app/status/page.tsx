'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  PENDING:  { label: 'Menunggu Verifikasi', color: '#92400E', bg: '#FEF3C7', desc: 'Data kamu sedang dalam antrian review oleh petugas.' },
  VERIFIED: { label: 'Terverifikasi',       color: '#1E40AF', bg: '#DBEAFE', desc: 'Data kamu sudah diverifikasi. Silakan lakukan pembayaran simpanan pokok.' },
  ACTIVE:   { label: 'Aktif',               color: '#065F46', bg: '#D1FAE5', desc: 'Kamu sudah menjadi anggota aktif koperasi.' },
  REJECTED: { label: 'Ditolak',             color: '#991B1B', bg: '#FEE2E2', desc: 'Pengajuan kamu ditolak. Silakan hubungi petugas untuk informasi lebih lanjut.' },
}

export default function StatusPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ email: string; status: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await api.get(`/members/status/?email=${encodeURIComponent(email)}`)
      setResult(res.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Email tidak ditemukan')
      } else {
        toast.error('Terjadi kesalahan, coba lagi')
      }
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const config = result ? STATUS_CONFIG[result.status] : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFDFF' }}>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Cek Status Pendaftaran
          </h1>
          <p className="text-sm" style={{ color: '#8E99A8' }}>
            Masukkan email yang kamu gunakan saat mendaftar
          </p>
        </div>

        <form onSubmit={handleCheck} className="bg-white rounded-2xl p-8" style={{ border: '1px solid #f3f4f6' }}>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="input-base mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            {loading ? 'Memeriksa...' : 'Cek Status'}
          </button>
        </form>

        {/* Result */}
        {result && config && (
          <div className="mt-6 bg-white rounded-2xl p-8 animate-slide-up" style={{ border: '1px solid #f3f4f6' }}>
            <p className="text-sm mb-3" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Status untuk <strong style={{ color: '#242F43' }}>{result.email}</strong>
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm mb-3"
              style={{ backgroundColor: config.bg, color: config.color, fontFamily: 'Inter, sans-serif' }}>
              {config.label}
            </div>
            <p className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
              {config.desc}
            </p>
          </div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: '#9ca3af' }}>
          Belum punya akun?{' '}
          <a href="/register" style={{ color: '#11447D', fontWeight: 600 }}>Daftar sekarang</a>
        </p>
      </main>
    </div>
  )
}