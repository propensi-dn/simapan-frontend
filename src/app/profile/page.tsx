'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'
import { User, Mail, Smartphone, MapPin, CreditCard, Lock, Camera } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/members/profile/')
        setProfile(res.data)
      } catch (err) {
        console.error("Gagal memuat profil", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg font-bold text-primary-950">Loading Profile...</div>

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <header className="mb-10">
          <h1 className="text-h3 font-bold text-text-primary">Profil Anggota</h1>
          <div className="w-12 h-1 bg-secondary-500 rounded-full mt-2"></div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN: AVATAR & QUICK ACTIONS --- */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="relative w-full h-full rounded-[32px] overflow-hidden border-4 border-bg shadow-inner">
                  <Image 
                    src={profile?.profile_picture || "/images/avatar-placeholder.png"} 
                    alt="Avatar" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-500 text-primary-950 rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:bg-secondary-400 transition-all">
                  <Camera size={18} />
                </button>
              </div>
              
              <h2 className="text-h4 font-bold text-text-primary mb-1">{profile?.full_name}</h2>
              <p className="text-p3 font-bold text-text-tertiary mb-4 tracking-tight">
                {profile?.member_id ? `#${profile.member_id}` : 'Generating ID...'}
              </p>
              <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-100">
                Active Member
              </span>

              <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                <Link href="/profile/change-password">
                  <Button className="w-full bg-primary-950 text-white hover:bg-primary-800 rounded-xl flex items-center justify-center gap-2">
                    <Lock size={16} /> Ubah Kata Sandi
                  </Button>
                </Link>
              </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: DETAILED INFO --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informasi Pribadi */}
            <section className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <User className="text-secondary-500" size={20} />
                <h3 className="text-p2 font-bold uppercase tracking-[0.2em] text-text-tertiary">Informasi Pribadi</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Member ID</label>
                  <input type="text" value={profile?.member_id} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">NIK (Identity Number)</label>
                  <input type="text" value={profile?.nik} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Email Address</label>
                  <input type="email" value={profile?.email} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nomor Telepon</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    <input type="text" defaultValue={profile?.phone_number} className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Alamat Rumah</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    <input type="text" defaultValue={profile?.home_address} className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none" />
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <Button className="bg-secondary-500 text-primary-950 hover:bg-secondary-400 px-10 rounded-2xl font-bold shadow-lg shadow-secondary-500/20">
                  Simpan Perubahan
                </Button>
              </div>
            </section>

            {/* Informasi Bank */}
            <section className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-secondary-500" size={20} />
                  <h3 className="text-p2 font-bold uppercase tracking-[0.2em] text-text-tertiary">Rekening Bank</h3>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] uppercase font-bold border-gray-200 text-text-secondary hover:bg-bg">+ Tambah</Button>
              </div>
              
              <div className="p-6 bg-bg border border-gray-50 rounded-[24px] flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Nama Bank</p>
                  <p className="text-p3 font-bold text-text-primary">Bank Central Asia (BCA)</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Nomor Rekening</p>
                  <p className="text-p3 font-bold text-text-primary">8290-xxxx-xxxx</p>
                </div>
                <span className="px-4 py-1.5 bg-primary-950 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest">Primary</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}