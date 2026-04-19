'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import LogoutModal from '@/components/layout/LogoutModal'

// ── Icons ──────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)
const SavingsIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
  </svg>
)
const LoanIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)
const ProfileIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)
const VerificationIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
)

const SavingsVerifIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
  </svg>
)
const WithdrawalIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
  </svg>
)
const DisburseIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const InstallmentIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
  </svg>
)
const LoanApprovalIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
  </svg>
)
const ResignIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
)
const CreditIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)
const FinanceIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
)
const LogoutIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

// ── Nav config per role ────────────────────────────
type NavItem = { label: string; href: string; icon: React.ReactNode; group?: string }

const NAV_CONFIG: Record<string, NavItem[]> = {
  MEMBER: [
    { label: 'Dashboard',  href: '/dashboard/member',         icon: <DashboardIcon />, group: 'OVERVIEW' },
    { label: 'Savings',    href: '/dashboard/member/savings', icon: <SavingsIcon />,   group: 'FINANCE' },
    { label: 'Loans',      href: '/dashboard/member/loans',   icon: <LoanIcon />,      group: 'FINANCE' },
    { label: 'Profile',    href: '/dashboard/member/profile', icon: <ProfileIcon />,   group: 'ACCOUNT' },
  ],
  STAFF: [
    { label: 'Dashboard',            href: '/dashboard/staff',               icon: <DashboardIcon />,    group: 'OVERVIEW' },
    // ── MEMBER & SAVINGS ──
    { label: 'Member Verification',  href: '/dashboard/staff/verification',  icon: <VerificationIcon />, group: 'MEMBER & SAVINGS' },
    { label: 'Savings Verification', href: '/dashboard/staff/verifications/savings',       icon: <SavingsVerifIcon />, group: 'MEMBER & SAVINGS' },
    { label: 'Withdrawal Requests',  href: '/dashboard/staff/withdrawals',   icon: <WithdrawalIcon />,   group: 'MEMBER & SAVINGS' },
    // ── LOANS ──
    { label: 'Loan Dashboard',       href: '/dashboard/staff/loans',         icon: <LoanApprovalIcon />, group: 'LOANS' },
    { label: 'Disbursement',         href: '/dashboard/staff/disbursement',  icon: <DisburseIcon />,     group: 'LOANS' },
    { label: 'Installment Payment',  href: '/dashboard/staff/installments',  icon: <InstallmentIcon />,  group: 'LOANS' },
  ],
  MANAGER: [
    { label: 'Dashboard',        href: '/dashboard/manager',               icon: <DashboardIcon />,    group: 'OVERVIEW' },
    { label: 'Loan Approvals',   href: '/dashboard/manager/loans',         icon: <LoanApprovalIcon />, group: 'MANAGERIAL' },
    { label: 'Resign Approvals', href: '/dashboard/manager/resignations',  icon: <ResignIcon />,       group: 'MANAGERIAL' },
    { label: 'Credit Monitoring',href: '/dashboard/manager/credit',        icon: <CreditIcon />,       group: 'REPORTING' },
    { label: 'Financial Reports',href: '/dashboard/manager/finance',       icon: <FinanceIcon />,      group: 'REPORTING' },
  ],
  CHAIRMAN: [
    { label: 'Dashboard',        href: '/dashboard/chairman',              icon: <DashboardIcon />,  group: 'OVERVIEW' },
    { label: 'Financial Reports',href: '/dashboard/chairman/finance',      icon: <FinanceIcon />,    group: 'REPORTING' },
    { label: 'Credit Monitoring',href: '/dashboard/chairman/credit',       icon: <CreditIcon />,     group: 'REPORTING' },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  MEMBER:   'Credit Union System',
  STAFF:    'Staff Portal',
  MANAGER:  'Executive Portal',
  CHAIRMAN: 'Chairman Portal',
}

interface SidebarProps {
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
  userName?: string
  userID?: string
  avatarUrl?: string
}

export default function Sidebar({ role, userName = 'User', userID, avatarUrl }: SidebarProps) {
  const pathname  = usePathname()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const navItems  = NAV_CONFIG[role] || []

  // Group nav items
  const groups: Record<string, NavItem[]> = {}
  navItems.forEach(item => {
    const g = item.group || 'MENU'
    if (!groups[g]) groups[g] = []
    groups[g].push(item)
  })

  // Active check: savings detail pages should also highlight "Savings Verification"
  const isActive = (href: string) => {
    if (href === '/dashboard/staff/verifications/savings') {
      return pathname === href || pathname.startsWith('/dashboard/staff/verifications/savings/')
    }
    if (href === '/dashboard/staff/verification') {
      return pathname === href || pathname.startsWith('/dashboard/staff/verification/')
    }
    if (href === '/dashboard/staff/loans') {
      return pathname === href || pathname.startsWith('/dashboard/staff/loans/')
    }
    if (href === '/dashboard/staff/installments') {
      return pathname === href || pathname.startsWith('/dashboard/staff/installments/')
    }
    return pathname === href
  }

  return (
    <>
      <aside
        className="flex flex-col w-56 h-full flex-shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #F1F5F9' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#242F43' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              SI-MAPAN
            </p>
            <p className="text-xs leading-tight" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              <p
                className="text-xs font-semibold px-2 mb-1.5 tracking-wider"
                style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
              >
                {groupName}
              </p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium"
                      style={{
                        backgroundColor: active ? '#F1F5F9' : 'transparent',
                        color: active ? '#11447D' : '#525E71',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <span style={{ color: active ? '#11447D' : '#8E99A8' }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ backgroundColor: '#FAFAFA' }}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: '#E5E7EB' }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={userName} width={32} height={32} className="object-cover" />
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                {userName}
              </p>
              {userID && (
                <p className="text-xs truncate" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  ID: {userID}
                </p>
              )}
            </div>
            {/* Logout button */}
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: '#8E99A8' }}
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  )
}