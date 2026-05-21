'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import api from '@/lib/axios'

// ── Types ──────────────────────────────────────────────────────────────────

interface Task {
  task_id: string
  category: string
  subject: string
  status: string
  action: string
  link: string
}

interface StaffDashboardData {
  total_pending_members: number
  total_pending_savings_count: number
  total_pending_savings_amount: string
  total_approved_loans_count: number
  total_approved_loans_amount: string
  total_pending_installments_count: number
  total_pending_installments_amount: string
  total_completed_withdrawals: number
  total_pending_withdrawals: number
  total_approved_refunds: number
  total_approved_resignations: number
  recent_tasks: Task[]
}

interface StaffProfile {
  full_name: string
  member_id: string | null
  email?: string
}

// ── Icons ──────────────────────────────────────────────────────────────────

const MemberIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
)

const SavingsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
  </svg>
)

const LoanIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3M3 6v3" />
  </svg>
)

const InstallmentIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
  </svg>
)

const RefundIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
)

const ResignIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
)

const WithdrawalIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Rp 0'
  if (num >= 1_000_000_000) {
    const m = num / 1_000_000_000
    return `Rp ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (num >= 1_000_000) {
    const jt = num / 1_000_000
    return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}Jt`
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)}Rb`
  }
  return `Rp ${num.toLocaleString('id-ID')}`
}

// ── Category & Status styles ────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  ANGGOTA:      { bg: '#DBEAFE', text: '#1E40AF' },
  SIMPANAN:     { bg: '#D1FAE5', text: '#065F46' },
  PINJAMAN:     { bg: '#FEF3C7', text: '#92400E' },
  ANGSURAN:     { bg: '#EDE9FE', text: '#5B21B6' },
  PENARIKAN:    { bg: '#CFFAFE', text: '#155E75' },
  PENGEMBALIAN: { bg: '#FEE2E2', text: '#991B1B' },
  PENUTUPAN:    { bg: '#FFEDD5', text: '#9A3412' },
}

const STATUS_DOT: Record<string, string> = {
  'Menunggu':           '#9CA3AF',
  'Disetujui':          '#F59E0B',
  'Menunggu Pencairan': '#FB923C',
}

// ── Skeleton Card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl p-6 animate-pulse"
      style={{ border: '1px solid #F1F5F9' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#F1F5F9' }} />
      </div>
      <div className="h-3 rounded w-20 mb-2" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-6 rounded w-28 mb-1" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-3 rounded w-24" style={{ backgroundColor: '#F1F5F9' }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const [data, setData]         = useState<StaffDashboardData | null>(null)
  const [profile, setProfile]   = useState<StaffProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const TASKS_PER_PAGE = 10

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [dashRes, profileRes] = await Promise.allSettled([
          api.get<StaffDashboardData>('/dashboards/staff/'),
          api.get<StaffProfile>('/members/profile/'),
        ])

        if (cancelled) return

        if (dashRes.status === 'fulfilled') {
          setData(dashRes.value.data)
        } else {
          setError('Gagal memuat data dashboard.')
        }

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data)
        }
      } catch {
        if (!cancelled) setError('Terjadi kesalahan jaringan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  const userName = profile?.full_name ?? 'Staff'
  const userID   = profile?.member_id ?? undefined
  const firstName = userName.split(' ')[0]

  return (
    <DashboardLayout role="STAFF" userName={userName} userID={userID}>

      <DashboardHeader
        variant="default"
        title="Dashboard"
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">

        {/* Welcome */}
        <div className="mb-6">
          <h2
            className="font-bold text-xl sm:text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Dashboard Staff
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Selamat datang, {firstName}. Berikut tugas yang perlu Anda tindaklanjuti hari ini.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'Inter, sans-serif' }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── Row 1: 4 cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* 1 — Pending Members */}
              <StatCard
                label="Verifikasi Anggota"
                value={String(data?.total_pending_members ?? 0)}
                subtitle="Perlu ditindaklanjuti"
                icon={<MemberIcon />}
                accent="#11447D"
              />

              {/* 2 — Pending Savings */}
              <StatCard
                label="Verifikasi Simpanan"
                value={formatRupiah(data?.total_pending_savings_amount ?? '0')}
                subtitle={`${data?.total_pending_savings_count ?? 0} transaksi menunggu verifikasi`}
                icon={<SavingsIcon />}
                accent="#10B981"
              />

              {/* 3 — Approved Loans (to disburse) */}
              <StatCard
                label="Pencairan Pinjaman"
                value={formatRupiah(data?.total_approved_loans_amount ?? '0')}
                subtitle={`${data?.total_approved_loans_count ?? 0} pinjaman siap dicairkan`}
                icon={<LoanIcon />}
                accent="#F2A025"
              />

              {/* 4 — Pending Installments */}
              <StatCard
                label="Verifikasi Angsuran"
                value={formatRupiah(data?.total_pending_installments_amount ?? '0')}
                subtitle={`${data?.total_pending_installments_count ?? 0} pembayaran menunggu verifikasi`}
                icon={<InstallmentIcon />}
                accent="#8B5CF6"
              />
            </>
          )}
        </div>

        {/* ── Row 2: 3 cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* 5 — Pending Withdrawals */}
              <StatCard
                label="Penarikan Menunggu"
                value={String(data?.total_pending_withdrawals ?? 0)}
                subtitle="Penarikan perlu diproses"
                icon={<WithdrawalIcon />}
                accent="#06B6D4"
              />

              {/* 6 — Approved Refunds (pending disbursement) */}
              <StatCard
                label="Pengembalian Dana"
                value={String(data?.total_approved_refunds ?? 0)}
                subtitle="Perlu dicairkan staff"
                icon={<RefundIcon />}
                accent="#EF4444"
              />

              {/* 7 — Approved Resignations */}
              <StatCard
                label="Penutupan Akun"
                value={String(data?.total_approved_resignations ?? 0)}
                subtitle="Disetujui manajer, perlu diproses"
                icon={<ResignIcon />}
                accent="#F59E0B"
              />
            </>
          )}
        </div>

        {/* ── Today's Tasks Summary ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>

          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
            >
              Tugas Terbaru
            </h3>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['ID TUGAS', 'KATEGORI', 'KETERANGAN', 'STATUS', 'TINDAKAN'].map(col => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allTasks = data?.recent_tasks ?? []
                const paginated = allTasks.slice(
                  (currentPage - 1) * TASKS_PER_PAGE,
                  currentPage * TASKS_PER_PAGE
                )

                if (allTasks.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-sm text-center"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                      >
                        Tidak ada tugas yang perlu ditindaklanjuti.
                      </td>
                    </tr>
                  )
                }

                return paginated.map((task, i) => {
                  const catStyle = CATEGORY_STYLE[task.category] ?? { bg: '#F1F5F9', text: '#525E71' }
                  return (
                    <tr
                      key={task.task_id}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    >
                      {/* ID Tugas */}
                      <td className="px-6 py-4">
                        <span
                          className="text-sm font-medium"
                          style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}
                        >
                          {task.task_id}
                        </span>
                      </td>

                      {/* Badge kategori */}
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-md tracking-wide"
                          style={{
                            backgroundColor: catStyle.bg,
                            color: catStyle.text,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {task.category}
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                      >
                        {task.subject}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: STATUS_DOT[task.status] ?? '#9CA3AF' }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                          >
                            {task.status}
                          </span>
                        </div>
                      </td>

                      {/* Tindakan */}
                      <td className="px-6 py-4">
                        <Link
                          href={task.link}
                          className="text-sm font-bold transition-colors hover:opacity-70"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          {task.action}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>

          {/* Footer pagination */}
          {(data?.recent_tasks ?? []).length > 0 && (() => {
            const allTasks = data?.recent_tasks ?? []
            const totalPages = Math.ceil(allTasks.length / TASKS_PER_PAGE)
            const start = (currentPage - 1) * TASKS_PER_PAGE + 1
            const end   = Math.min(currentPage * TASKS_PER_PAGE, allTasks.length)

            const pages: (number | '...')[] = []
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(1)
              if (currentPage > 3) pages.push('...')
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
              if (currentPage < totalPages - 2) pages.push('...')
              pages.push(totalPages)
            }

            return (
              <div
                className="px-6 py-3 flex items-center justify-between text-sm"
                style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
              >
                <span>Menampilkan {start}–{end} dari {allTasks.length} tugas</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: currentPage === 1 ? '#D1D5DB' : '#525E71',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ‹
                  </button>
                  {pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: p === currentPage ? '#242F43' : 'transparent',
                          color: p === currentPage ? '#FFFFFF' : '#525E71',
                          border: p === currentPage ? 'none' : '1px solid #E5E7EB',
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: currentPage === totalPages ? '#D1D5DB' : '#525E71',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            )
          })()}
        </div>

      </main>
    </DashboardLayout>
  )
}