'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  desc: string
  icon: string
}> = {
  NOT_FOUND: {
    label: 'Belum Terdaftar',
    color: '#374151',
    bg: '#F3F4F6',
    desc: 'Email ini belum terdaftar di sistem SI-MAPAN. Pastikan penulisan email sudah benar atau silakan melakukan pendaftaran.',
    icon: '🔍',
  },
  PENDING: {
    label: 'Menunggu Verifikasi',
    color: '#92400E',
    bg: '#FEF3C7',
    desc: 'Data kamu sedang dalam antrian review oleh petugas koperasi. Mohon tunggu konfirmasi melalui email.',
    icon: '⏳',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    color: '#1E40AF',
    bg: '#DBEAFE',
    desc: 'Data kamu sudah diverifikasi. Silakan login dan lakukan pembayaran simpanan pokok untuk mengaktifkan akun.',
    icon: '✅',
  },
  ACTIVE: {
    label: 'Aktif',
    color: '#065F46',
    bg: '#D1FAE5',
    desc: 'Kamu sudah menjadi anggota aktif koperasi. Silakan login untuk mengakses dashboard.',
    icon: '🎉',
  },
  REJECTED: {
    label: 'Ditolak',
    color: '#991B1B',
    bg: '#FEE2E2',
    desc: 'Pengajuan kamu ditolak. Silakan hubungi petugas untuk informasi lebih lanjut.',
    icon: '❌',
  },
  INACTIVE: {
    label: 'Tidak Aktif',
    color: '#374151',
    bg: '#F3F4F6',
    desc: 'Akun kamu sudah tidak aktif. Silakan hubungi petugas untuk informasi lebih lanjut.',
    icon: '🚫',
  },
}

function StatusContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ email: string; status: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async (emailToCheck: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/members/status/?email=${encodeURIComponent(emailToCheck)}`)
      setResult(res.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Jika email tidak ditemukan, tampilkan card status NOT_FOUND
        setResult({ email: emailToCheck, status: 'NOT_FOUND' })
      } else {
        toast.error('Terjadi kesalahan, coba lagi')
        setResult(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setEmail(emailFromUrl)
      checkStatus(emailFromUrl)
    }
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) checkStatus(email)
  }

  const config = result ? STATUS_CONFIG[result.status] : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFDFF' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="font-bold text-2xl mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Cek Status Pendaftaran
          </h1>
          <p className="text-sm" style={{ color: '#8E99A8' }}>
            Masukkan email yang kamu gunakan saat mendaftar
          </p>
        </div>

        {/* Form Input Email */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8"
          style={{ border: '1px solid #f3f4f6' }}>
          <label className="block text-sm font-semibold mb-1.5"
            style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
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

        {/* Result Card (Muncul setelah klik cek status) */}
        {result && config && (
          <div className="mt-6 bg-white rounded-2xl p-8 animate-in fade-in slide-in-from-top-4 duration-300"
            style={{ border: '1px solid #f3f4f6' }}>
            <p className="text-sm mb-4" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Status untuk{' '}
              <strong style={{ color: '#242F43' }}>{result.email}</strong>
            </p>

            {/* Badge status */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full font-bold text-sm"
                style={{ backgroundColor: config.bg, color: config.color, fontFamily: 'Inter, sans-serif' }}>
                {config.label}
              </span>
            </div>

            {/* Deskripsi Status */}
            <p className="text-sm leading-relaxed" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
              {config.desc}
            </p>

            {/* Tombol Aksi Sesuai Status */}
            <div className="mt-6 flex flex-col gap-3">
              {result.status === 'NOT_FOUND' && (
                <>
                  <a href="/register"
                    className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center transition-all bg-primary-950 hover:bg-primary-500">
                    Daftar Sekarang
                  </a>
                  <button
                    onClick={() => checkStatus(result.email)}
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all disabled:opacity-50 border border-gray-200 text-gray-600 hover:bg-gray-50">
                    {loading ? 'Memeriksa...' : 'Coba Lagi'}
                  </button>
                </>
              )}

              {(result.status === 'VERIFIED' || result.status === 'ACTIVE') && (
                <a href="/login"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center transition-all"
                  style={{ backgroundColor: '#11447D', fontFamily: 'Montserrat, sans-serif' }}>
                  Login Sekarang
                </a>
              )}

              {result.status === 'REJECTED' && (
                <a href="mailto:support@si-mapan.com"
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all"
                  style={{
                    border: '1.5px solid #242F43',
                    color: '#242F43',
                    fontFamily: 'Montserrat, sans-serif',
                  }}>
                  Hubungi Petugas
                </a>
              )}

              {(result.status === 'PENDING' || result.status === 'INACTIVE') && (
                <button
                  onClick={() => checkStatus(result.email)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all disabled:opacity-50"
                  style={{
                    border: '1.5px solid #d1d5db',
                    color: '#525E71',
                    fontFamily: 'Montserrat, sans-serif',
                  }}>
                  {loading ? 'Memeriksa...' : 'Refresh Status'}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: '#9ca3af' }}>
          Belum punya akun?{' '}
          <a href="/register" style={{ color: '#11447D', fontWeight: 600 }}>
            Daftar sekarang
          </a>
        </p>
      </main>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBFDFF' }}>
        <p style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
      </div>
    }>
      <StatusContent />
    </Suspense>
  )
}