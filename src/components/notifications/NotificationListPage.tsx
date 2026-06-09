'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  type NotificationListItem,
  type NotificationType,
} from '@/lib/notifications-api'

// ═══════════════════════════════════════════════════════════════════════════
// PBI-14: Lihat Daftar Notifikasi
// Fitur tambahan di file ini:
//   1. Search bar untuk filter berdasarkan kata di title / message
//   2. Multi-select checkbox + tombol "Tandai Terpilih Dibaca"
//   3. Filter kategori (tabs) & "Tandai Semua Dibaca" — fitur lama dipertahankan
//
// PBI-15: Lihat Detail Notifikasi → ada di file terpisah
//   (NotificationDetailPage.tsx). Notifikasi otomatis ditandai sudah dibaca
//   ketika halaman detail dibuka (lihat getNotificationDetail di notifications-api).
// ═══════════════════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Type badge config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { bg: string; text: string; dot: string; label: string; icon: string }
> = {
  REGISTRATION: {
    bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6',
    label: 'Registrasi', icon: '👤',
  },
  SAVING: {
    bg: '#D1FAE5', text: '#065F46', dot: '#10B981',
    label: 'Simpanan', icon: '🏦',
  },
  LOAN: {
    bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B',
    label: 'Pinjaman', icon: '💰',
  },
  RESIGNATION: {
    bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444',
    label: 'Pengunduran Diri', icon: '🚪',
  },
  GENERAL: {
    bg: '#F1F5F9', text: '#475569', dot: '#94A3B8',
    label: 'Umum', icon: '📢',
  },
}

const TYPE_FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'REGISTRATION', label: 'Registrasi' },
  { key: 'SAVING', label: 'Simpanan' },
  { key: 'LOAN', label: 'Pinjaman' },
  { key: 'RESIGNATION', label: 'Pengunduran Diri' },
  { key: 'GENERAL', label: 'Umum' },
]

// ── Icons ─────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const BellSlashIcon = () => (
  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.143 17.082a24.248 24.248 0 003.844.398c2.538 0 4.96-.44 7.199-1.247a1 1 0 00-.548-1.779c-.247-.012-.494-.037-.74-.072M9.143 17.082C8.394 15.83 8 14.337 8 12.75V12c0-1.657-.448-3.21-1.23-4.547M9.143 17.082L3 21m0 0l2.563-2.563M21 21l-4.5-4.5M3 3l18 18M15 12c0-.847-.105-1.668-.302-2.449M9.268 7.5A6.75 6.75 0 0115 12" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.25 21a.75.75 0 00.12 1.484A1.5 1.5 0 0112 22.5a1.5 1.5 0 001.48-1.27" />
  </svg>
)

const CheckAllIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

// ── Notification row item ─────────────────────────────────────────────────

function NotificationRow({
  item,
  selected,
  onToggleSelect,
  onClick,
  onDelete,
}: {
  item: NotificationListItem
  selected: boolean
  onToggleSelect: (id: number) => void
  onClick: (id: number) => void
  onDelete: (id: number) => void
}) {
  const [hovered, setHovered]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await deleteNotification(item.id)
      onDelete(item.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      className="relative flex items-stretch"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid #F1F5F9',
        backgroundColor: selected ? '#EFF6FF' : (item.is_read ? 'transparent' : '#F0F6FF'),
      }}
    >
      {/* Checkbox utk multi-select */}
      <label
        className="flex items-center justify-center px-4 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          className="w-4 h-4 cursor-pointer"
          style={{ accentColor: '#11447D' }}
        />
      </label>

      <button
        onClick={() => onClick(item.id)}
        className="flex-1 text-left px-2 py-4 flex items-start gap-4 transition-colors hover:bg-[#FAFAFA] focus:outline-none"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* Icon bubble */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ backgroundColor: cfg.bg }}
        >
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p
              className="text-sm leading-snug"
              style={{
                color: '#242F43',
                fontFamily: 'Inter, sans-serif',
                fontWeight: item.is_read ? 400 : 600,
              }}
            >
              {item.title}
            </p>
            {!item.is_read && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#11447D' }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'Inter, sans-serif' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
              {cfg.label}
            </span>
            <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {timeAgo(item.created_at)}
            </span>
          </div>
        </div>

        {/* Chevron — disembunyiin saat hover supaya delete button keliatan */}
        <svg
          className="mt-1 flex-shrink-0 transition-opacity"
          style={{ opacity: hovered ? 0 : 1 }}
          width="14" height="14" fill="none" viewBox="0 0 24 24"
          stroke="#D1D5DB" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-40"
        style={{
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          backgroundColor: '#FEE2E2',
          color: '#EF4444',
          transition: 'opacity 0.15s ease',
        }}
        title="Hapus notifikasi"
      >
        {deleting ? (
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="4" strokeOpacity="0.25"/>
            <path fill="#EF4444" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <TrashIcon />
        )}
      </button>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────

export interface NotificationListPageProps {
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
  detailBasePath: string // e.g. '/dashboard/member/notifications'
}

// ── Main page component ───────────────────────────────────────────────────

export default function NotificationListPage({
  role,
  detailBasePath,
}: NotificationListPageProps) {
  const router = useRouter()

  const [notifications, setNotifications] = useState<NotificationListItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [typeFilter, setTypeFilter]       = useState('ALL')
  const [markingAll, setMarkingAll]       = useState(false)

  // PBI-14: state utk search bar (filter berdasarkan kata di title / message)
  const [searchQuery, setSearchQuery]     = useState('')

  // PBI-14: state utk multi-select checkbox
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set())
  const [markingSelected, setMarkingSelected] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getNotifications(
        typeFilter !== 'ALL' ? { type: typeFilter as NotificationType } : undefined
      )
      setNotifications(res.results)
      // bersihkan selection setiap reload supaya gak nyangkut ke id basi
      setSelectedIds(new Set())
    } catch {
      setError('Gagal memuat notifikasi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    load()
  }, [load])

  // PBI-14: gabungkan filter kategori (server-side) dengan search (client-side)
  // Pencarian gak case-sensitive, cek di title & message.
  const visibleNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return notifications
    return notifications.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q)
    )
  }, [notifications, searchQuery])

  const unreadCount = notifications.filter(n => !n.is_read).length
  const selectedCount = selectedIds.size

  // Checkbox "Select All" di header berlaku utk yg lagi visible aja
  const allVisibleSelected =
    visibleNotifications.length > 0 &&
    visibleNotifications.every(n => selectedIds.has(n.id))

  const handleClickNotification = (id: number) => {
    router.push(`${detailBasePath}/${id}`)
  }

  const handleDeleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      // Uncheck semua yg visible
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleNotifications.forEach(n => next.delete(n.id))
        return next
      })
    } else {
      // Check semua yg visible
      setSelectedIds(prev => {
        const next = new Set(prev)
        visibleNotifications.forEach(n => next.add(n.id))
        return next
      })
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // silent fail — reload akan sync
    } finally {
      setMarkingAll(false)
    }
  }

  // PBI-14: tandai notifikasi yg di-check sebagai sudah dibaca.
  // Pakai markNotificationRead per-id dalam Promise.all biar simple
  // (gak perlu endpoint batch baru di BE).
  const handleMarkSelectedRead = async () => {
    if (selectedCount === 0) return
    const ids = Array.from(selectedIds)
    // Skip yg udah read biar gak buang request
    const unreadIds = ids.filter(id => {
      const n = notifications.find(x => x.id === id)
      return n && !n.is_read
    })

    setMarkingSelected(true)
    try {
      await Promise.all(unreadIds.map(id => markNotificationRead(id)))
      setNotifications(prev =>
        prev.map(n => (selectedIds.has(n.id) ? { ...n, is_read: true } : n))
      )
      setSelectedIds(new Set())
    } catch {
      // silent fail — reload akan sync
    } finally {
      setMarkingSelected(false)
    }
  }

  const dashboardHref = `/dashboard/${role.toLowerCase()}`

  return (
    <DashboardLayout role={role}>
      <DashboardHeader
        variant="detail"
        parentLabel="Dashboard"
        parentHref={dashboardHref}
        currentLabel="Notifikasi"
        notifCount={0}
        notifHref={`${detailBasePath}`}
      />

      <main className="flex-1 p-8">
        {/* Page title row */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2
              className="font-bold text-2xl mb-1"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
            >
              Notifikasi
            </h2>
            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* PBI-14: Tombol Tandai Terpilih — muncul kalau ada yg di-check */}
            {selectedCount > 0 && (
              <button
                onClick={handleMarkSelectedRead}
                disabled={markingSelected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: '#11447D', fontFamily: 'Inter, sans-serif' }}
              >
                <CheckAllIcon />
                {markingSelected
                  ? 'Menandai...'
                  : `Tandai ${selectedCount} Dibaca`}
              </button>
            )}

            {/* Tombol Tandai SEMUA — fitur lama */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#525E71',
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: '#FAFAFA',
                }}
              >
                <CheckAllIcon />
                {markingAll ? 'Menandai...' : 'Tandai Semua Dibaca'}
              </button>
            )}
          </div>
        </div>

        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #F1F5F9' }}
        >
          {/* PBI-14: Search bar utk filter berdasarkan kata di title/message */}
          <div
            className="px-6 py-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <div
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}
            >
              <span style={{ color: '#8E99A8' }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Cari notifikasi (judul atau isi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ color: '#8E99A8' }}
                  title="Bersihkan pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Type filter tabs — fitur lama dipertahankan */}
          <div
            className="flex overflow-x-auto"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            {TYPE_FILTER_OPTIONS.map(opt => {
              const active = typeFilter === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(opt.key)}
                  className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                  style={{
                    color: active ? '#11447D' : '#8E99A8',
                    borderBottom: active ? '2px solid #11447D' : '2px solid transparent',
                    marginBottom: -1,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* PBI-14: Bar "Pilih Semua" — cuma muncul kalau ada notifikasi visible */}
          {!loading && !error && visibleNotifications.length > 0 && (
            <div
              className="px-6 py-2.5 flex items-center gap-3"
              style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: '#11447D' }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  {allVisibleSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                </span>
              </label>
              {selectedCount > 0 && (
                <span className="text-xs" style={{ color: '#8E99A8' }}>
                  · {selectedCount} dipilih
                </span>
              )}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }}
              />
            </div>
          ) : error ? (
            <div
              className="py-16 text-center text-sm"
              style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}
            >
              {error}
              <button
                onClick={load}
                className="ml-2 underline font-semibold"
                style={{ color: '#11447D' }}
              >
                Coba lagi
              </button>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div style={{ color: '#D1D5DB' }}>
                <BellSlashIcon />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                {searchQuery
                  ? `Tidak ada notifikasi yang cocok dengan "${searchQuery}"`
                  : `Tidak ada notifikasi${typeFilter !== 'ALL' ? ' untuk kategori ini' : ''}`}
              </p>
            </div>
          ) : (
            <div>
              {visibleNotifications.map(item => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={handleToggleSelect}
                  onClick={handleClickNotification}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </div>
          )}

          {/* Footer count */}
          {!loading && !error && visibleNotifications.length > 0 && (
            <div
              className="px-6 py-3 text-xs"
              style={{
                borderTop: '1px solid #F1F5F9',
                color: '#8E99A8',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Menampilkan {visibleNotifications.length} dari {notifications.length} notifikasi
              {searchQuery && ` · pencarian: "${searchQuery}"`}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
