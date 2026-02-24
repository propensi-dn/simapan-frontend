'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'About', href: '/#about' },
  { label: 'Check Status', href: '/status' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <header className="w-full sticky top-0 z-40" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #f3f4f6' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="SI-MAPAN Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-bold text-base tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            SI-MAPAN
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: pathname === link.href ? '#11447D' : '#525E71', fontFamily: 'Inter, sans-serif' }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}