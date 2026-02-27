import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFDFF' }}>
      <Navbar />
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            SI-MAPAN
          </h1>
          <p className="mb-8" style={{ color: '#525E71' }}>
            Sistem Informasi Manajemen Koperasi
          </p>
          <Link href="/login"
            className="px-6 py-3 rounded-xl text-white font-bold transition-all"
            style={{ backgroundColor: '#11447D', fontFamily: 'Montserrat, sans-serif' }}>
            Login
          </Link>
        </div>
      </main>
    </div>
  )
}