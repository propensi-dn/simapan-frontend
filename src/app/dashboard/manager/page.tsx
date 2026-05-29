'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import api from '@/lib/axios'

// ── Icons ──────────────────────────────────────────────────────────────────
const LiquidityIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
)
const LoanIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3M3 6v3" />
  </svg>
)
const ShuIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
  </svg>
)

// ── Types ─────────────────────────────────────────────────────────────────
interface DashboardData {
  total_liquidity: number
  total_outstanding_loans: number
  interest_income_total: number
  estimated_shu: number
  npl_count: number
  npl_amount: number
  pending_loans_count: number
  loan_summary?: {
    total_pending: number
    total_approved: number
    total_overdue: number
  }
  resignation_summary?: {
    total_pending: number
    total_approved: number
    total_inactive: number
  }
  resignation_requests?: Array<{
    id: number
    member_name: string
    member_id: string
    request_date: string | null
    status: string
    status_display: string
    estimated_payout: number
  }>
  overdue_summary?: {
    total_overdue: number
    total_amount_overdue: number
    total_critical: number
  }
}

// ── Helper functions ──────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value)
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ManagerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const resignationPreviewLimit = 6

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/manager/loans/dashboard/')
        setData(response.data)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err)
        setError(err.response?.data?.detail || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const userName = 'Budi Santoso'
  const loanSummary = data?.loan_summary
  const loanPending = loanSummary?.total_pending ?? 0
  const loanApproved = loanSummary?.total_approved ?? 0
  const loanOverdue = loanSummary?.total_overdue ?? 0
  const loanTotal = loanPending + loanApproved + loanOverdue
  const pendingRatio = loanTotal > 0 ? loanPending / loanTotal : 0
  const approvedRatio = loanTotal > 0 ? loanApproved / loanTotal : 0
  const overdueRatio = loanTotal > 0 ? loanOverdue / loanTotal : 0
  const liquidityRatio = data && data.total_outstanding_loans > 0
    ? data.total_liquidity / data.total_outstanding_loans
    : 0
  const liquidityStatus = liquidityRatio >= 0.2
    ? 'Aman'
    : liquidityRatio >= 0.1
      ? 'Waspada'
      : 'Perlu perhatian'
  const liquidityProgress = Math.min(liquidityRatio / 0.2, 1)

  return (
    <DashboardLayout role="MANAGER" userName={userName} userID="1092834">
      <DashboardHeader
        variant="default"
        title="Dasbor"
        notifCount={3}
        notifHref="/dashboard/manager/notifications"
      />

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#242F43' }}></div>
              <p className="mt-4" style={{ color: '#8E99A8' }}>Memuat dasbor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p style={{ color: '#991B1B' }}>Error: {error}</p>
          </div>
        ) : data ? (
          <>
            {/* Hero overview */}
            <section
              className="rounded-3xl p-6 mb-8"
              style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 45%, #F1F5F9 100%)',
                border: '1px solid #E2E8F0',
              }}
            >
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Ringkasan Tugas Hari Ini
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2" style={{ color: '#0F172A', fontFamily: 'Montserrat, sans-serif' }}>
                    Fokus hari ini: pengajuan pinjaman, pengunduran anggota, dan risiko portofolio.
                  </h2>
                  <p className="text-sm mt-2" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                    Ringkas, jelas, dan langsung mengarah ke tindakan.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/manager/loans"
                      className="text-sm font-semibold px-4 py-2 rounded-xl"
                      style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                    >
                      Tinjau Pinjaman
                    </Link>
                    <Link
                      href="/dashboard/manager/resignations"
                      className="text-sm font-semibold px-4 py-2 rounded-xl"
                      style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                    >
                      Tinjau Pengunduran
                    </Link>
                    <Link
                      href="/dashboard/manager/credit"
                      className="text-sm font-semibold px-4 py-2 rounded-xl"
                      style={{ backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5F5', fontFamily: 'Inter, sans-serif' }}
                    >
                      Pantau Kredit
                    </Link>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E2E8F0' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Prioritas Cepat
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Pengajuan Pinjaman</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>Butuh review segera</p>
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#0F172A' }}>{data.pending_loans_count}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Pengunduran Anggota</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>Perlu persetujuan</p>
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#0F172A' }}>{data.resignation_summary?.total_pending ?? 0}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Pinjaman Macet</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>Perlu tindak lanjut</p>
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#DC2626' }}>{data.npl_count ?? 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Snapshot cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
              <StatCard
                label="Total Likuiditas"
                value={formatCurrency(data.total_liquidity)}
                badge="+2.4%"
                badgePositive={true}
                icon={<LiquidityIcon />}
                accent="#11447D"
              />
              <StatCard
                label="Total Pinjaman Aktif"
                value={formatCurrency(data.total_outstanding_loans)}
                badge="-1.2%"
                badgePositive={false}
                icon={<LoanIcon />}
                accent="#EF4444"
              />
              <StatCard
                label="Estimasi SHU Saat Ini (Murni)"
                value={formatCurrency(data.estimated_shu)}
                badge="+5.7%"
                badgePositive={true}
                icon={<ShuIcon />}
                accent="#10B981"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      Risiko Portofolio
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: 'Montserrat, sans-serif' }}>
                      Pinjaman Macet
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/manager/credit"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ border: '1px solid #E2E8F0', color: '#475569', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Monitoring
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF1F2' }}>
                    <p className="text-xs" style={{ color: '#9F1239' }}>Jumlah</p>
                    <p className="text-2xl font-bold" style={{ color: '#9F1239' }}>{data.npl_count ?? 0}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#FEF2F2' }}>
                    <p className="text-xs" style={{ color: '#991B1B' }}>Nilai</p>
                    <p className="text-lg font-bold" style={{ color: '#991B1B' }}>{formatCurrency(data.npl_amount ?? 0)}</p>
                  </div>
                </div>
                <p className="text-xs mt-4" style={{ color: '#64748B' }}>
                  Prioritaskan follow-up pada pinjaman dengan tunggakan tertinggi.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      Kesehatan Kas
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: 'Montserrat, sans-serif' }}>
                      Buffer Likuiditas
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/manager/credit"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ border: '1px solid #E2E8F0', color: '#475569', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Monitoring
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: '#64748B' }}>Rasio Likuiditas</p>
                    <p className="text-3xl font-bold" style={{ color: '#0F172A' }}>
                      {formatPercent(liquidityRatio)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: '#64748B' }}>Status</p>
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: liquidityStatus === 'Aman' ? '#DCFCE7' : liquidityStatus === 'Waspada' ? '#FEF9C3' : '#FEE2E2',
                        color: liquidityStatus === 'Aman' ? '#166534' : liquidityStatus === 'Waspada' ? '#92400E' : '#991B1B',
                      }}
                    >
                      {liquidityStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs" style={{ color: '#94A3B8' }}>
                    <span>0%</span>
                    <span>Target 20%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: '#E2E8F0' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${liquidityProgress * 100}%`,
                        background: 'linear-gradient(90deg, #38BDF8 0%, #22C55E 100%)',
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs mt-4" style={{ color: '#64748B' }}>
                  Semakin tinggi buffer, semakin aman untuk menyetujui pinjaman baru.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
              <div className="bg-white rounded-2xl p-6 flex flex-col" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      Status Pengajuan Pinjaman
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: 'Montserrat, sans-serif' }}>
                      Komposisi Pengajuan
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/manager/loans"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ border: '1px solid #E2E8F0', color: '#475569', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Detail
                  </Link>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div
                    className="w-44 h-44 rounded-full"
                    style={{
                      background: `conic-gradient(#1D4ED8 0 ${pendingRatio * 360}deg, #10B981 ${pendingRatio * 360}deg ${(pendingRatio + approvedRatio) * 360}deg, #F59E0B ${(pendingRatio + approvedRatio) * 360}deg 360deg)`
                    }}
                  />
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1D4ED8' }} />
                        <p className="text-sm" style={{ color: '#0F172A' }}>Pending</p>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                        {loanPending} • {formatPercent(pendingRatio)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                        <p className="text-sm" style={{ color: '#0F172A' }}>Disetujui</p>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                        {loanApproved} • {formatPercent(approvedRatio)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                        <p className="text-sm" style={{ color: '#0F172A' }}>Terlambat</p>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                        {loanOverdue} • {formatPercent(overdueRatio)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      Ringkasan Pengunduran
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: '#0F172A', fontFamily: 'Montserrat, sans-serif' }}>
                      Status Penutupan Akun
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/manager/resignations"
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ border: '1px solid #E2E8F0', color: '#475569', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Detail
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
                    <p className="text-xs" style={{ color: '#64748B' }}>Pending</p>
                    <p className="text-xl font-bold" style={{ color: '#0F172A' }}>{data.resignation_summary?.total_pending ?? 0}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F1F5F9' }}>
                    <p className="text-xs" style={{ color: '#64748B' }}>Disetujui</p>
                    <p className="text-xl font-bold" style={{ color: '#0F172A' }}>{data.resignation_summary?.total_approved ?? 0}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#EEF2FF' }}>
                    <p className="text-xs" style={{ color: '#64748B' }}>Inaktif</p>
                    <p className="text-xl font-bold" style={{ color: '#0F172A' }}>{data.resignation_summary?.total_inactive ?? 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  {data.resignation_requests && data.resignation_requests.length > 0 ? (
                    data.resignation_requests.slice(0, resignationPreviewLimit).map((req) => (
                      <div key={req.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{req.member_name}</p>
                          <p className="text-xs" style={{ color: '#64748B' }}>{req.member_id} • {req.status_display}</p>
                        </div>
                        <div className="text-xs" style={{ color: '#64748B' }}>
                          {req.request_date ? new Date(req.request_date).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }}>
                      <p className="text-xs">Belum ada pengajuan pengunduran baru.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </>
        ) : null}
      </main>
    </DashboardLayout>
  )
}