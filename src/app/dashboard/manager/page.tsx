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
  pending_loans?: Array<{
    loan_id: string
    member_name: string | null
    amount: number
    application_date: string | null
    status: string
  }>
  portfolio_trend_6m: Array<{ month: string; date: string; value: number; count: number }>
  portfolio_trend_1y: Array<{ month: string; date: string; value: number; count: number }>
  recent_activities: Array<{
    icon: string
    title: string
    detail: string
    time: string
    type: string
  }>
}

interface ManagerProfile {
  full_name: string
  member_id: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'baru saja'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`

  return date.toLocaleDateString('id-ID')
}

function buildTrendSeries(
  mode: '6m' | '1y',
  trendData: Array<{ month: string; date: string; value: number; count: number }> | undefined
) {
  const monthsBack = mode === '6m' ? 6 : 12
  const now = new Date()
  const base = trendData || []
  const byYearMonth = new Map<string, { value: number; count: number }>()

  for (const item of base) {
    if (item.date) {
      const d = new Date(item.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      byYearMonth.set(key, { value: item.value, count: item.count })
      continue
    }
    if (item.month) {
      byYearMonth.set(item.month, { value: item.value, count: item.count })
    }
  }

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const series = [] as Array<{ month: string; date: string; value: number; count: number }>

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = labels[d.getMonth()]
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const item = byYearMonth.get(key) || byYearMonth.get(label)
    series.push({
      month: label,
      date: d.toISOString(),
      value: item?.value ?? 0,
      count: item?.count ?? 0,
    })
  }

  return series
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse" style={{ border: '1px solid #F1F5F9' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#F1F5F9' }} />
      </div>
      <div className="h-3 rounded w-20 mb-2" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-6 rounded w-28 mb-1" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-3 rounded w-24" style={{ backgroundColor: '#F1F5F9' }} />
    </div>
  )
}

function SkeletonBlock({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-white rounded-2xl animate-pulse"
      style={{ border: '1px solid #F1F5F9', height }}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [profile, setProfile] = useState<ManagerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [trendMode, setTrendMode] = useState<'6m' | '1y'>('6m')

  const pendingPreviewLimit = 8

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [dashRes, profileRes] = await Promise.allSettled([
          api.get<DashboardData>('/manager/loans/dashboard/'),
          api.get<ManagerProfile>('/members/profile/'),
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

  const userName  = profile?.full_name ?? 'Manajer'
  const userID    = profile?.member_id ?? undefined
  const firstName = userName.split(' ')[0]

  const trendData           = trendMode === '6m' ? data?.portfolio_trend_6m : data?.portfolio_trend_1y
  const normalizedTrendData = buildTrendSeries(trendMode, trendData)
  const hasTrendData        = normalizedTrendData.some(d => d.value > 0 || d.count > 0)
  const MAX_BAR             = normalizedTrendData.length > 0 ? Math.max(...normalizedTrendData.map(d => d.value)) : 100

  return (
    <DashboardLayout role="MANAGER" userName={userName} userID={userID}>
      <DashboardHeader
        variant="default"
        title="Dashboard"
        notifCount={3}
        notifHref="/dashboard/manager/notifications"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">

        {/* Welcome */}
        <div className="mb-6">
          <h2
            className="font-bold text-xl sm:text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Dashboard Manajer
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Selamat datang, {firstName}. Berikut ringkasan portofolio pinjaman dan kinerja keuangan.
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

        {/* ── Baris 1: 3 stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Likuiditas"
                value={formatRupiah(data?.total_liquidity ?? 0)}
                subtitle="Saldo kas yang tersedia"
                icon={<LiquidityIcon />}
                accent="#11447D"
              />
              <StatCard
                label="Total Pinjaman Aktif"
                value={formatRupiah(data?.total_outstanding_loans ?? 0)}
                subtitle="Outstanding pinjaman berjalan"
                icon={<LoanIcon />}
                accent="#EF4444"
              />
              <StatCard
                label="Estimasi SHU"
                value={formatRupiah(data?.estimated_shu ?? 0)}
                subtitle="Perkiraan SHU periode ini"
                icon={<ShuIcon />}
                accent="#10B981"
              />
            </>
          )}
        </div>

        {/* ── Baris 2: 2 stat cards (NPL) ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Jumlah NPL"
                value={String(data?.npl_count ?? 0)}
                subtitle="Pinjaman melewati jatuh tempo"
                icon={<LoanIcon />}
                accent="#DC2626"
              />
              <StatCard
                label="Nominal NPL"
                value={formatRupiah(data?.npl_amount ?? 0)}
                subtitle="Total nilai pinjaman bermasalah"
                icon={<LoanIcon />}
                accent="#B91C1C"
              />
            </>
          )}
        </div>

        {/* ── Konten utama: 2 kolom ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Kiri: Pending + Bar chart */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Pengajuan Pinjaman Menunggu */}
            {loading ? (
              <SkeletonBlock height={240} />
            ) : (
              <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                  <h3
                    className="font-bold text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                  >
                    Pengajuan Pinjaman Menunggu ({data?.pending_loans_count ?? 0})
                  </h3>
                  <Link
                    href="/dashboard/manager/loans"
                    className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                  >
                    Lihat Semua
                  </Link>
                </div>

                {data?.pending_loans && data.pending_loans.length > 0 ? (
                  <>
                    <ul className="divide-y">
                      {data.pending_loans.slice(0, pendingPreviewLimit).map((loan) => (
                        <li key={loan.loan_id} className="px-6 py-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                              {loan.member_name || loan.loan_id}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                              {loan.loan_id} &bull; {formatRupiah(loan.amount)}
                            </div>
                          </div>
                          <div className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                            {loan.application_date
                              ? new Date(loan.application_date).toLocaleDateString('id-ID')
                              : '—'}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="px-6 py-3 text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      Lihat seluruh pengajuan di halaman Pinjaman Menunggu.
                    </p>
                  </>
                ) : (
                  <div className="px-6 py-8 text-center text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Tidak ada pengajuan yang menunggu persetujuan.
                  </div>
                )}
              </div>
            )}

            {/* Tren Kinerja Portofolio — Bar Chart */}
            {loading ? (
              <SkeletonBlock height={200} />
            ) : (
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="font-bold text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                  >
                    Tren Kinerja Portofolio
                  </h3>
                  <div className="flex items-center gap-1">
                    {(['6B', '1T'] as const).map((label) => {
                      const mode = label === '6B' ? '6m' : '1y'
                      const active = trendMode === mode
                      return (
                        <button
                          key={label}
                          onClick={() => setTrendMode(mode)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: active ? '#242F43' : 'transparent',
                            color: active ? '#fff' : '#8E99A8',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-36">
                  {hasTrendData ? (
                    normalizedTrendData.map((d) => (
                      <div key={d.month} className="flex-1 flex flex-col items-center h-full self-stretch">
                        <div className="flex items-end h-full w-full">
                          <div
                            className="w-full rounded-t-md transition-all hover:opacity-80"
                            title={`${d.month}: ${d.count} pinjaman, ${formatRupiah(d.value)}`}
                            style={{
                              height: MAX_BAR > 0 ? `${(d.value / MAX_BAR) * 100}%` : '5%',
                              backgroundColor: '#242F43',
                              minHeight: '3px',
                            }}
                          />
                        </div>
                        <span
                          className="text-xs mt-1"
                          style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif', fontSize: '9px' }}
                        >
                          {d.month}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      Tidak ada data untuk periode ini.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kanan: Aktivitas Kredit Terbaru */}
          {loading ? (
            <SkeletonBlock height={480} />
          ) : (
            <div className="bg-white rounded-2xl p-6 flex flex-col" style={{ border: '1px solid #F1F5F9' }}>
              <h3
                className="font-bold text-base mb-5"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
              >
                Aktivitas Kredit Terbaru
              </h3>
              <div className="space-y-4">
                {data?.recent_activities && data.recent_activities.length > 0 ? (
                  data.recent_activities.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3"
                      style={{ borderBottom: i < data.recent_activities.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
                      >
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          {a.title}
                        </p>
                        <p
                          className="text-xs line-clamp-2"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                        >
                          {a.detail}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif' }}
                        >
                          {formatTimeAgo(a.time)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      Tidak ada aktivitas terbaru.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>
    </DashboardLayout>
  )
}
