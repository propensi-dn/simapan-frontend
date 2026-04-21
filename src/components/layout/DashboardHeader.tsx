'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/axios'

// ── Icons ──────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const BackIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

// ── Role → notif href map ──────────────────────────────────────
const ROLE_NOTIF_HREF: Record<string, string> = {
  MEMBER:   '/dashboard/member/notifications',
  STAFF:    '/dashboard/staff/notifications',
  MANAGER:  '/dashboard/manager/notifications',
  CHAIRMAN: '/dashboard/chairman/notifications',
}

// ── Live unread count bell button ──────────────────────────────
function NotifButton({ href }: { href?: string }) {
  const [count, setCount]               = useState(0)
  const [resolvedHref, setResolvedHref] = useState('/notifications') // safe default for SSR

  useEffect(() => {
    // Read cookie only on client to avoid hydration mismatch
    const role = Cookies.get('user_role') ?? ''
    setResolvedHref(href ?? ROLE_NOTIF_HREF[role] ?? '/notifications')

    let cancelled = false
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count/')
        if (!cancelled) setCount(data.unread_count ?? 0)
      } catch {
        // silent
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [href])

  return (
    <Link
      href={resolvedHref}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
      style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
    >
      <BellIcon />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold px-1"
          style={{ backgroundColor: '#EF4444', fontSize: '10px', fontFamily: 'Inter, sans-serif' }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

// ── Types ──────────────────────────────────────────────────────
interface HeaderDefaultProps {
  variant: 'default'
  title: ReactNode
  notifCount?: number   // kept for backward compat but ignored — live fetch is used
  notifHref?: string
}

interface HeaderDetailProps {
  variant: 'detail'
  parentLabel: string
  parentHref: string
  currentLabel: string
  notifCount?: number
  notifHref?: string
}

interface HeaderFormProps {
  variant: 'form'
  title: string
  backLabel?: string
  backHref?: string
  notifCount?: number
  notifHref?: string
}

type DashboardHeaderProps = HeaderDefaultProps | HeaderDetailProps | HeaderFormProps

// ── Main component ─────────────────────────────────────────────
export default function DashboardHeader(props: DashboardHeaderProps) {
  const router = useRouter()

  const baseStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #F1F5F9',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '12px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  if (props.variant === 'default') {
    return (
      <header style={baseStyle}>
        <h1
          className="font-bold text-base flex-1"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
        >
          {props.title}
        </h1>
        <NotifButton href={props.notifHref} />
      </header>
    )
  }

  if (props.variant === 'detail') {
    return (
      <header style={baseStyle}>
        <div className="flex items-center gap-2 flex-1">
          <Link
            href={props.parentHref}
            className="text-sm transition-colors hover:text-gray-600"
            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
          >
            {props.parentLabel}
          </Link>
          <span style={{ color: '#D1D5DB' }}>
            <ChevronIcon />
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
          >
            {props.currentLabel}
          </span>
        </div>
        <NotifButton href={props.notifHref} />
      </header>
    )
  }

  if (props.variant === 'form') {
    const handleBack = () => {
      if (props.backHref) router.push(props.backHref)
      else router.back()
    }

    return (
      <header style={baseStyle}>
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
            style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
          >
            <BackIcon />
            <span>{props.backLabel || 'Back'}</span>
          </button>
          <div className="w-px h-4" style={{ backgroundColor: '#E5E7EB' }} />
          <span
            className="text-sm font-semibold"
            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            {props.title}
          </span>
        </div>
        <NotifButton href={props.notifHref} />
      </header>
    )
  }

  return null
}