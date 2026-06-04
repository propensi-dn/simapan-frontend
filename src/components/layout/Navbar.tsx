'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Cek Status', href: '/status' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <header className="w-full sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/logo.png"
            alt="SI-MAPAN Logo"
            width={40}
            height={40}
            className="rounded-lg"
            style={{ width: '40px', height: '40px' }}
          />
          <span className="font-bold text-h5 tracking-tight text-text-primary">
            SI-MAPAN
          </span>
        </Link>

        {/* Menu Links - Desktop */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="text-p2 font-medium transition-all duration-200 hover:text-primary-500"
              style={{ 
                color: pathname === link.href ? '#11447D' : '#525E71',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Register Button & Hamburger - Desktop/Tablet/Mobile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/login" className="hidden sm:block text-p2 font-bold text-text-primary hover:text-primary-500 mr-2">
            Masuk
          </Link>
          <Link href="/register">
            <Button 
              size="sm" 
              className="rounded-xl px-4 sm:px-6 bg-secondary-500 hover:bg-secondary-300 active:bg-secondary-600 text-text-primary text-xs sm:text-sm"
            >
              Daftar
            </Button>
          </Link>

          {/* Hamburger Button for Mobile */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 md:hidden text-text-primary hover:bg-gray-100 rounded-lg transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-4 px-6 shadow-lg animate-slide-down absolute left-0 right-0 top-20 z-50">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-p2 font-medium py-2 border-b border-gray-50 last:border-0 transition-all duration-200 hover:text-primary-500"
                style={{ 
                  color: pathname === link.href ? '#11447D' : '#525E71',
                }}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Button (for screens smaller than sm where 'Masuk' is hidden from the header) */}
            <div className="flex flex-col gap-3 pt-4 sm:hidden">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button 
                  variant="outline"
                  fullWidth
                  className="rounded-xl border-primary-950 text-primary-950 hover:bg-primary-50 text-xs py-2"
                >
                  Masuk
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}