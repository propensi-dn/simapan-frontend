'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

const VALUES = [
  { 
    title: 'Integritas', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  { 
    title: 'Transparansi', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  { 
    title: 'Kekeluargaan', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    title: 'Inovasi', 
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
]

export default function AboutPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        setLoading(true)
        const res = await api.get('/config/about/')
        setData(res.data)
        setError(false)
      } catch (err) {
        console.error("Gagal memuat konten about:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAboutContent()
  }, [])

  // 1. Handling Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-950 rounded-full animate-spin"></div>
          <p className="text-p2 font-bold text-primary-950 tracking-wide">Loading SI-MAPAN...</p>
        </div>
      </div>
    )
  }

  // 2. Handling Error State (Sesuai PBI: Content unavailable)
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-center px-6">
        <div className="max-w-md">
          <h1 className="text-h3 font-bold text-error mb-4">Content unavailable</h1>
          <p className="text-p2 text-text-secondary mb-8">
            Maaf, konten Visi & Misi tidak dapat dimuat saat ini. Silakan periksa koneksi Anda atau hubungi admin.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="border-primary-950 text-primary-950"
          >
            Refresh Halaman
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="pb-20">
        {/* --- HERO SECTION: Minimalist Style --- */}
        <section className="relative w-full h-[350px] flex items-center justify-center bg-primary-950 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <div className="relative z-10 text-center px-6">
            <h1 className="text-h2 md:text-h1 text-white font-bold mb-4 tracking-tight">
              Tentang <span className="text-secondary-300">SI-MAPAN</span>
            </h1>
            <div className="w-24 h-1.5 bg-secondary-500 mx-auto rounded-full" />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-12 -mt-16 relative z-20">
          {/* --- VISI & MISI: Raised Cards (Dynamic from API) --- */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 hover:translate-y-[-4px] transition-all duration-300">
              <h2 className="text-h3 text-text-primary mb-6 font-bold">Visi</h2>
              <p className="text-p2 text-text-secondary leading-relaxed">
                {data.vision}
              </p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 hover:translate-y-[-4px] transition-all duration-300">
              <h2 className="text-h3 text-text-primary mb-6 font-bold">Misi</h2>
              <p className="text-p2 text-text-secondary leading-relaxed">
                {data.mission}
              </p>
            </div>
          </div>

          {/* --- LEGALITAS --- */}
          <section className="bg-white rounded-[40px] p-12 md:p-16 shadow-sm border border-gray-100 mb-24 text-center">
            <h2 className="text-h3 text-text-primary mb-2 font-bold">Legalitas & Perizinan</h2>
            <p className="text-p3 text-text-tertiary uppercase tracking-widest mb-12">Terdaftar dan diawasi oleh otoritas terkait</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Kemenkop UKM', sub: 'No. Reg: XXX/XXXX/2023' },
                { label: 'Izin Operasional', sub: 'AHU-XXXXX.AH.01.2023' },
                { label: 'Sertifikasi NIK', sub: 'Valid Terverifikasi' }
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-bg-sections flex items-center justify-center text-text-secondary mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h4 className="font-bold text-text-primary mb-1">{item.label}</h4>
                  <p className="text-[10px] text-text-tertiary">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* --- NILAI UTAMA --- */}
          <section className="text-center">
            <h2 className="text-h2 text-text-primary mb-4 font-bold">Nilai-Nilai Utama</h2>
            <div className="w-16 h-1 bg-primary-950 mx-auto rounded-full mb-16" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {VALUES.map((val, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-text-tertiary group-hover:border-primary-500 group-hover:text-primary-500 transition-all duration-300 mb-4">
                    {val.icon}
                  </div>
                  <span className="font-bold text-text-primary tracking-wide uppercase text-p3">{val.title}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-primary-950 text-white py-20 mt-10">
        <div className="max-w-6xl mx-auto px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col gap-6">
              <h3 className="text-h4 font-bold text-white uppercase tracking-tight">SI-MAPAN</h3>
              <p className="text-p3 text-primary-100 opacity-70 leading-relaxed max-w-xs">
                Digitalizing financial management for a more prosperous community.
              </p>
            </div>
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Navigation</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70 font-medium">
                <li><Link href="/" className="hover:text-white transition-all">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition-all">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-all">FAQ</Link></li>
              </ul>
            </div>
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Member Portal</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70 font-medium">
                <li><Link href="/status" className="hover:text-white transition-all">Check Status</Link></li>
                <li><Link href="/login" className="hover:text-white transition-all">Member Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-all">Register</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full mt-20 pt-8 border-t border-primary-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-p3 text-primary-300 opacity-60">
              © 2026 SI-MAPAN System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}