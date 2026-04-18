'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'
// Menggunakan lucide-react untuk icon yang modern dan ringan
import { Wallet, Banknote, Landmark, HelpCircle, ShieldCheck } from 'lucide-react'

// 1. Mapping Icon: Menghubungkan teks dari Django Admin ke Komponen Icon
const iconMap: Record<string, any> = {
  'pi-wallet': Wallet,
  'pi-money-bill': Banknote,
  'pi-landmark': Landmark,
  'pi-shield': ShieldCheck,
};

export default function LandingPage() {
  const [hero, setHero] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true)
        const [heroRes, servicesRes] = await Promise.all([
          api.get('/config/hero/'),
          api.get('/config/services/')
        ])
        
        setHero(heroRes.data)
        setServices(servicesRes.data)
        setError(false)
      } catch (err) {
        console.error("Gagal memuat konten:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchLandingData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-950 rounded-full animate-spin"></div>
          <p className="text-p2 font-bold text-primary-950 tracking-wide">Memuat SI-MAPAN...</p>
        </div>
      </div>
    )
  }

  if (error || !hero) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-center px-6">
        <div className="max-w-md">
          <h1 className="text-h3 font-bold text-error mb-4">Konten tidak tersedia</h1>
          <p className="text-p2 text-text-secondary mb-8">
            Maaf, kami sedang mengalami kendala teknis dalam memuat informasi utama. Silakan coba beberapa saat lagi.
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

      <main>
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h1 className="text-h2 leading-tight text-text-primary">
              {hero.title}
            </h1>
            <h1 className="text-h2 leading-tight mb-6 text-text-accent">
              {hero.brand_name}
            </h1>
            <p className="text-p2 text-text-secondary mb-10 max-w-lg leading-relaxed">
              {hero.description}
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-xl px-10 bg-primary-950 hover:bg-primary-500 active:bg-primary-950 text-white">
                {hero.cta_text || 'Daftar sebagai Anggota'}
              </Button>
            </Link>
          </div>
          
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl bg-gray-100">
            <Image
              src={hero.hero_image || "/images/stockfamily.png"}
              alt="SI-MAPAN Hero"
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* --- DYNAMIC SERVICES SECTION --- */}
        <section id="services" className="bg-white py-20 border-t border-gray-50">
          <div className="max-w-6xl mx-auto px-12 text-center"> 
            <div className="mb-12">
              <h2 className="text-h3 text-text-primary mb-3">Layanan Kami</h2>
              <div className="w-16 h-1 bg-primary-950 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.length > 0 ? (
                services.map((service, index) => {
                  // 2. Logika Pemilihan Icon
                  const IconComponent = iconMap[service.icon_name] || HelpCircle;

                  return (
                    <div key={index} className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all text-left group">
                      <div className="w-12 h-12 bg-bg-sections rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition-colors">
                        {/* Merender icon secara dinamis */}
                        <IconComponent className="w-6 h-6 text-text-secondary group-hover:text-primary-600 transition-colors" />
                      </div>
                      <h3 className="text-h4 text-text-primary mb-3 font-bold">{service.title}</h3>
                      <p className="text-p2 text-text-secondary leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-2 text-text-tertiary">Informasi layanan sedang diperbarui.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary-950 text-white py-20 mt-10">
        <div className="max-w-6xl mx-auto px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-primary-900 pt-16">
            <div className="flex flex-col gap-6">
              <h3 className="text-h4 font-bold text-white uppercase tracking-tight">SI-MAPAN</h3>
              <p className="text-p3 text-primary-100 opacity-70 leading-relaxed max-w-xs">
                Digitalisasi pengelolaan keuangan untuk masyarakat yang lebih sejahtera.
              </p>
            </div>
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Navigasi</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70">
                <li><Link href="/" className="hover:text-white transition-all">Beranda</Link></li>
                <li><Link href="/about" className="hover:text-white transition-all">Tentang Kami</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-all">FAQ</Link></li>
              </ul>
            </div>
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Portal Anggota</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70">
                <li><Link href="/status" className="hover:text-white transition-all">Cek Status</Link></li>
                <li><Link href="/login" className="hover:text-white transition-all">Masuk Anggota</Link></li>
                <li><Link href="/register" className="hover:text-white transition-all">Daftar</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full mt-20 pt-8 border-t border-primary-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-p3 text-primary-300 opacity-60">
              © 2026 Sistem SI-MAPAN. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}