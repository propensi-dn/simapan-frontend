'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main>
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <h1 className="text-h2 leading-tight text-text-primary">
              Empowering Your Financial Future with
            </h1>
            <h1 className="text-h2 leading-tight mb-6 text-text-accent">
              SI-MAPAN
            </h1>
            <p className="text-p2 text-text-secondary mb-10 max-w-lg leading-relaxed">
              A secure and transparent platform for managing community savings and loans. 
              Access financial services with ease and clarity.
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-xl px-10 bg-primary-950 hover:bg-primary-500 active:bg-primary-950">
                Register as Member
              </Button>
            </Link>
          </div>
          
          {/* Hero Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/stockfamily.jpg"
              alt="Happy Family using SI-MAPAN"
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* --- OUR SERVICES SECTION --- */}
        <section id="services" className="bg-white py-20 border-t border-gray-50">
          {/* Menggunakan px-12 atau px-16 sesuai permintaanmu untuk margin samping yang lebih lega */}
          <div className="max-w-6xl mx-auto px-12 text-center"> 
            <div className="mb-12">
              <h2 className="text-h3 text-text-primary mb-3">Our Services</h2>
              <div className="w-16 h-1 bg-primary-950 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Savings Card */}
              <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 bg-bg-sections rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-text-primary mb-3">Savings</h3>
                <p className="text-p2 text-text-secondary leading-relaxed">
                  Securely grow your wealth with our flexible savings programs. Monitor your balance and history in real-time through our digital dashboard.
                </p>
              </div>

              {/* Loans Card */}
              <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 bg-bg-sections rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-text-primary mb-3">Loans</h3>
                <p className="text-p2 text-text-secondary leading-relaxed">
                  Access affordable credit for your business or personal needs. Transparent application process with quick status tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER SECTION --- */}
      <footer className="bg-primary-950 text-white py-20 mt-10">
        <div className="max-w-6xl mx-auto px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            
            {/* Kolom 1: Brand & Info */}
            <div className="flex flex-col gap-6">
              <h3 className="text-h4 font-bold text-white uppercase tracking-tight">SI-MAPAN</h3>
              <p className="text-p3 text-primary-100 opacity-70 leading-relaxed max-w-xs">
                Digitalizing financial management for a more prosperous community.
              </p>
            </div>

            {/* Kolom 2: Navigation */}
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Navigation</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70">
                <li><Link href="/" className="hover:text-white transition-all">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition-all">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-all">FAQ</Link></li>
              </ul>
            </div>

            {/* Kolom 3: Member Portal */}
            <div className="flex flex-col gap-6 md:pl-10">
              <h4 className="text-p3 font-bold tracking-[0.2em] uppercase text-white">Member Portal</h4>
              <ul className="space-y-4 text-primary-100 text-p3 opacity-70">
                <li><Link href="/status" className="hover:text-white transition-all">Check Status</Link></li>
                <li><Link href="/login" className="hover:text-white transition-all">Member Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-all">Register</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar*/}
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