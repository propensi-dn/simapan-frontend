'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getNotificationDetail, type Notification, type NotificationType } from '@/lib/notifications-api'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TYPE_CONFIG: Record<
  NotificationType,
  { bg: string; text: string; border: string; label: string; icon: string; iconBg: string }
> = {
  REGISTRATION: {
    bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE',
    label: 'Registrasi', icon: '👤', iconBg: '#DBEAFE',
  },
  SAVING: {
    bg: '#F0FDF4', text: '#065F46', border: '#A7F3D0',
    label: 'Simpanan', icon: '🏦', iconBg: '#D1FAE5',
  },
  LOAN: {
    bg: '#FFFBEB', text: '#92400E', border: '#FDE68A',
    label: 'Pinjaman', icon: '💰', iconBg: '#FEF3C7',
  },
  WITHDRAWAL: {
    bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF',
    label: 'Penarikan', icon: '📤', iconBg: '#F3E8FF',
  },
  RESIGNATION: {
    bg: '#FFF1F2', text: '#991B1B', border: '#FECACA',
    label: 'Pengunduran Diri', icon: '🚪', iconBg: '#FEE2E2',
  },
  GENERAL: {
    bg: '#F8FAFC', text: '#475569', border: '#E2E8F0',
    label: 'Umum', icon: '📢', iconBg: '#F1F5F9',
  },
}

export interface NotificationDetailPageProps {
  id: number
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
  userName?: string
  userID?: string
  listBasePath: string 
}

export default function NotificationDetailPage({
  id,
  role,
  userName,
  userID,
  listBasePath,
}: NotificationDetailPageProps) {
  const router = useRouter()

  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotificationDetail(id)
      setNotification(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 404) {
        setError('Notifikasi tidak ditemukan.')
      } else {
        setError('Gagal memuat notifikasi. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const cfg = notification
    ? (TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.GENERAL)
    : TYPE_CONFIG.GENERAL

  return (
    <DashboardLayout role={role} userName={userName} userID={userID}>
      <DashboardHeader
        variant="detail"
        parentLabel="Notifikasi"
        parentHref={listBasePath}
        currentLabel="Detail Notifikasi"
        notifCount={0}
        notifHref={listBasePath}
      />

      <main className="flex-1 p-8">

        {loading ? (
          <div className="flex justify-center py-24">
            <div
              className="w-9 h-9 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }}
            />
          </div>
        ) : error ? (
          <div
            className="py-24 text-center"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>
            <button
              onClick={() => router.push(listBasePath)}
              className="text-sm font-semibold underline"
              style={{ color: '#11447D' }}
            >
              ← Kembali ke daftar notifikasi
            </button>
          </div>
        ) : notification && (
          <div className="max-w-2xl mx-auto">

            {/* Card */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #F1F5F9' }}
            >
              {/* Colored top banner */}
              <div
                className="px-8 py-6"
                style={{
                  backgroundColor: cfg.bg,
                  borderBottom: `1px solid ${cfg.border}`,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: cfg.iconBg }}
                  >
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <span
                      className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-2"
                      style={{ backgroundColor: cfg.iconBg, color: cfg.text, fontFamily: 'Inter, sans-serif' }}
                    >
                      {cfg.label}
                    </span>

                    {/* Title */}
                    <h2
                      className="font-bold text-xl leading-snug"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                    >
                      {notification.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-8 py-6">
                {/* Read status */}
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#10B981' }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}
                  >
                    Sudah dibaca
                  </span>
                  <span style={{ color: '#E5E7EB' }}>·</span>
                  <span
                    className="text-xs"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                  >
                    {formatDateTime(notification.created_at)}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 }} />

                {/* Message */}
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  {notification.message}
                </div>
              </div>

              {/* Footer / CTA */}
              <div
                className="px-8 py-5 flex items-center justify-between gap-4"
                style={{ borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}
              >
                <button
                  onClick={() => router.push(listBasePath)}
                  className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-60"
                  style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  <svg
                    width="16" height="16" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Kembali ke Daftar Notifikasi
                </button>

                {/* Redirect CTA — only shown if redirect_url is set */}
                {notification.redirect_url && (
                  <button
                    onClick={() => router.push(notification.redirect_url)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#11447D', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Selengkapnya
                    <svg
                      width="14" height="14" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}