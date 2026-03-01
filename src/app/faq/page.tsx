'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

export default function FAQPage() {
  const [faqList, setFaqList] = useState<any[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        // Memanggil endpoint faq yang sudah didaftarkan di config/urls.py
        const res = await api.get('/config/faq/')
        setFaqList(res.data)
        setError(false)
      } catch (err) {
        console.error("Gagal memuat FAQ:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
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
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-center px-6">
        <div className="max-w-md">
          <h1 className="text-h3 font-bold text-error mb-4">Content unavailable</h1>
          <p className="text-p2 text-text-secondary mb-8">
            Maaf, daftar pertanyaan tidak dapat dimuat saat ini. Silakan coba beberapa saat lagi.
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

      <main className="pb-24">
        {/* --- HEADER SECTION --- */}
        <section className="max-w-4xl mx-auto px-12 pt-20 pb-16 text-center">
          <h1 className="text-h2 text-text-primary mb-4">Pusat Bantuan</h1>
          <p className="text-p2 text-text-secondary leading-relaxed">
            Temukan jawaban untuk pertanyaan yang paling sering diajukan mengenai layanan SI-MAPAN.
          </p>
        </section>

        {/* --- FAQ ACCORDION (Dynamic from API) --- */}
        <section className="max-w-3xl mx-auto px-12 mb-24">
          <div className="space-y-4">
            {faqList.length > 0 ? (
              faqList.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-sm hover:shadow-md"
                >
                  <button
                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left"
                  >
                    <span className="font-bold text-text-primary text-p2">{item.question}</span>
                    <svg 
                      className={`w-5 h-5 text-text-tertiary transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div 
                    className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${activeIndex === index ? 'max-h-96 pb-8' : 'max-h-0'}`}
                  >
                    <p className="text-text-secondary text-p2 leading-relaxed border-t border-gray-50 pt-6">
                      {item.answer}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-text-tertiary italic">Belum ada pertanyaan yang tersedia.</p>
            )}
          </div>
        </section>

        {/* --- HUBUNGI KAMI SECTION --- */}
        <section className="max-w-6xl mx-auto px-12 mb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-h3 text-text-primary mb-4">Hubungi Kami</h2>
              <p className="text-text-secondary mb-10 leading-relaxed">
                Tim dukungan kami siap membantu Anda setiap Senin - Jumat pukul 08:00 - 17:00 WIB.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-bg-sections flex items-center justify-center text-text-secondary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Whatsapp</p>
                    <p className="font-bold text-text-primary">+62 812-3456-7890</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-bg-sections flex items-center justify-center text-text-secondary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Email</p>
                    <p className="font-bold text-text-primary">support@si-mapan.id</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Real Iframe */}
            <div className="relative aspect-square md:aspect-video bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126214.40562046686!2d115.14187033708308!3d-8.672504757143264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd2409b0e5e80db%3A0xe27334e8ccb9374a!2sDenpasar%2C%20Denpasar%20City%2C%20Bali!5e0!3m2!1sen!2sid!4v1772384249046!5m2!1sen!2sid" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20">
                <p className="text-[10px] text-text-tertiary uppercase font-bold mb-0.5">Kantor Pusat</p>
                <p className="text-p3 text-text-primary font-bold">Denpasar</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary-950 text-white py-20 mt-10">
        <div className="max-w-6xl mx-auto px-12">
          <div className="text-center mb-24 animate-fade-in">
            <h2 className="text-h3 font-bold mb-4">Masih punya pertanyaan? Hubungi kami</h2>
            <p className="text-p2 text-primary-100 opacity-80 mb-5 mx-auto leading-relaxed font-semibold">
              Admin kami siap menjawab segala keraguan Anda mengenai pendaftaran dan produk koperasi SI-MAPAN.
            </p>
            <Link href="https://wa.me/6281234567890" target="_blank">
              <Button 
                size="lg" 
                className="bg-secondary-500 text-primary-950 hover:bg-secondary-200 active:bg-secondary-300 rounded-2xl px-12 py-4 h-auto text-p2 font-bold shadow-xl transition-all"
              >
                CHAT ADMIN
              </Button>
            </Link>
          </div>
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