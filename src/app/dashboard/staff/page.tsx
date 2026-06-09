'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import api from '@/lib/axios'
import { useUserProfile } from '@/hooks/useUserProfile'

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
  return `Rp ${num.toLocaleString('id-ID')}`
}


// ── Category & Status styles ────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  MEMBER:  { bg: '#DBEAFE', text: '#1E40AF' },
  SAVINGS: { bg: '#D1FAE5', text: '#065F46' },
  LOAN:    { bg: '#FEF3C7', text: '#92400E' },
}

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'Menunggu':           { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', label: 'PENDING' },
  'Disetujui':          { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'APPROVED' },
  'Menunggu Pencairan': { bg: '#FFEDD5', text: '#C2410C', dot: '#F97316', label: 'PENDING DISBURSEMENT' },
}

// ── Mock data ──────────────────────────────────────────────────────────────
type TaskCategory = 'MEMBER' | 'SAVINGS' | 'LOAN'

const MOCK_TASKS: {
  id: string
  category: TaskCategory
  subject: string
  status: 'Pending' | 'In Progress' | 'Completed'
  action: string
  href: string
}[] = [
  { id: 'T-8801', category: 'MEMBER',     subject: 'New Registration: Budi Santoso',   status: 'Pending',     action: 'Verify',   href: '/dashboard/staff/verification/1' },
  { id: 'T-8802', category: 'SAVINGS',    subject: 'Deposit Verification: Rp 500.000', status: 'In Progress', action: 'Check',    href: '/dashboard/staff/verification/2' },
  { id: 'T-8803', category: 'LOAN',       subject: 'Disbursement: Small Biz Grant',    status: 'Pending',     action: 'Disburse', href: '/dashboard/staff/disbursement/3' },
  { id: 'T-8805', category: 'MEMBER',     subject: 'KYC Update: Siti Aminah',           status: 'Pending',     action: 'Verify',   href: '/dashboard/staff/verification/5' },
]

// ── Page ──────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const [data, setData]   = useState<StaffDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const TASKS_PER_PAGE = 10

  const { userName } = useUserProfile()
  const firstName = userName.split(' ')[0]

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const dashRes = await api.get<StaffDashboardData>('/dashboards/staff/')
        if (cancelled) return
        setData(dashRes.data)
      } catch {
        if (!cancelled) setError('Gagal memuat data dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout role="STAFF">

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

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Members"     value="124"       subtitle="Pending Members" icon={<MemberIcon />}   accent="#11447D" />
          <StatCard label="Savings"     value="Rp 15M"    subtitle="To Verify"       icon={<SavingsIcon />}  accent="#10B981" />
          <StatCard label="Loans"       value="Rp 45.2M"  subtitle="To Disburse"     icon={<LoanIcon />}     accent="#F2A025" />
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
                        {(() => {
                          const st = STATUS_BADGE[task.status] ?? { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: task.status }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
                              style={{ backgroundColor: st.bg, color: st.text, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                              {st.label}
                            </span>
                          )
                        })()}
                      </td>

                      {/* Tindakan */}
                      <td className="px-6 py-4">
                        <Link
                          href={task.link}
                          className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
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
          {(() => {
            const allTasks = data?.recent_tasks ?? []
            const totalPages = Math.max(1, Math.ceil(allTasks.length / TASKS_PER_PAGE))

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
                style={{ borderTop: '1px solid #F1F5F9', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
              >
                <span>Halaman {currentPage} dari {totalPages} • {allTasks.length} total data</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: '#525E71',
                    }}
                  >
                    ‹
                  </button>
                  {pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: '#525E71',
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