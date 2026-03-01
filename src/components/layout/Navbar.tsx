'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Button from '@/components/ui/Button'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Check Status', href: '/status' },
]

export default function Navbar() {
  const pathname = usePathname()
  
  return (
    <header className="w-full sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-12 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/logo.png"
            alt="SI-MAPAN Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="font-bold text-h5 tracking-tight text-text-primary">
            SI-MAPAN
          </span>
        </Link>

        {/* Menu Links */}
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

        {/* Register Button */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/login" className="hidden sm:block text-p2 font-bold text-text-primary hover:text-primary-500 mr-2">
            Login
          </Link>
          <Link href="/register">
            <Button 
              size="sm" 
              className="rounded-xl px-6 bg-secondary-500 hover:bg-secondary-300 active:bg-secondary-600 text-text-primary"
            >
              Register
            </Button>
          </Link>
        </div>

      </div>
    </header>
  )
}