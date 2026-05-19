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

// ── Helper functions ──────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  // Format date for older entries
  return date.toLocaleDateString('en-GB')
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
      const key = item.month
      byYearMonth.set(key, { value: item.value, count: item.count })
    }
  }

  const labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
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

// ── Page ──────────────────────────────────────────────────────────────────
export default function ManagerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendMode, setTrendMode] = useState<'6m' | '1y'>('6m')
  const pendingPreviewLimit = 8

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
  const trendData = trendMode === '6m' ? data?.portfolio_trend_6m : data?.portfolio_trend_1y
  const normalizedTrendData = buildTrendSeries(trendMode, trendData)
  const hasTrendData = normalizedTrendData.some(d => d.value > 0 || d.count > 0)
  const MAX_BAR = normalizedTrendData.length > 0 ? Math.max(...normalizedTrendData.map(d => d.value)) : 100

  return (
    <DashboardLayout role="MANAGER" userName={userName} userID="1092834">
      <DashboardHeader
        variant="default"
        title="Dashboard"
        notifCount={3}
        notifHref="/dashboard/manager/notifications"
      />

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#242F43' }}></div>
              <p className="mt-4" style={{ color: '#8E99A8' }}>Loading dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p style={{ color: '#991B1B' }}>Error: {error}</p>
          </div>
        ) : data ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              <StatCard
                label="Total Liquidity"
                value={formatCurrency(data.total_liquidity)}
                badge="+2.4%"
                badgePositive={true}
                icon={<LiquidityIcon />}
                accent="#11447D"
              />
              <StatCard
                label="Total Outstanding Loans"
                value={formatCurrency(data.total_outstanding_loans)}
                badge="-1.2%"
                badgePositive={false}
                icon={<LoanIcon />}
                accent="#EF4444"
              />
              <StatCard
                label="Current SHU Estimate (Pure)"
                value={formatCurrency(data.estimated_shu)}
                badge="+5.7%"
                badgePositive={true}
                icon={<ShuIcon />}
                accent="#10B981"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mb-8">
              <StatCard
                label="NPL Count"
                value={String(data.npl_count ?? 0)}
                badge="overdue loans"
                badgePositive={false}
                icon={<LoanIcon />}
                accent="#DC2626"
              />
              <StatCard
                label="NPL Amount"
                value={formatCurrency(data.npl_amount ?? 0)}
                badge="at risk"
                badgePositive={false}
                icon={<LoanIcon />}
                accent="#B91C1C"
              />
            </div>

            {/* 2-col layout */}
            <div className="grid grid-cols-3 gap-5">
              {/* Left — Pending Loans + Bar Chart */}
              <div className="col-span-2 flex flex-col gap-5">
                {/* Pending Loan Approvals */}
                <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Pending Loan Approvals ({data.pending_loans_count})
                    </h3>
                    <Link
                      href="/dashboard/manager/loans"
                      className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                    >
                      View All
                    </Link>
                  </div>
                  {data.pending_loans && data.pending_loans.length > 0 ? (
                    <>
                      <ul className="divide-y">
                        {data.pending_loans.slice(0, pendingPreviewLimit).map((loan) => (
                          <li key={loan.loan_id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                              <div className="font-semibold" style={{ color: '#242F43' }}>{loan.member_name || loan.loan_id}</div>
                              <div className="text-sm text-gray-500">{loan.loan_id} • {formatCurrency(loan.amount)}</div>
                            </div>
                            <div className="text-sm text-gray-500">{loan.application_date ? new Date(loan.application_date).toLocaleDateString() : ''}</div>
                          </li>
                        ))}
                      </ul>
                      <p className="px-6 py-3 text-xs" style={{ color: '#8E99A8' }}>
                        Lihat seluruh pengajuan di halaman Pending Loan.
                      </p>
                    </>
                  ) : (
                    <div className="px-6 py-4 text-center" style={{ color: '#8E99A8' }}>
                      <p className="text-sm">No pending approvals</p>
                    </div>
                  )}
                </div>

                {/* Portfolio Performance Bar Chart */}
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Portfolio Performance Trend
                    </h3>
                    <div className="flex items-center gap-1">
                      {['6M', '1Y'].map((v) => (
                        <button
                          key={v}
                          onClick={() => setTrendMode(v === '6M' ? '6m' : '1y')}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: (v === '6M' && trendMode === '6m') || (v === '1Y' && trendMode === '1y') ? '#242F43' : 'transparent',
                            color: (v === '6M' && trendMode === '6m') || (v === '1Y' && trendMode === '1y') ? '#fff' : '#8E99A8',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 h-36">
                    {hasTrendData ? (
                      normalizedTrendData.map((d) => (
                        <div key={d.month} className="flex-1 flex flex-col items-center h-full self-stretch">
                          <div className="flex items-end h-full w-full">
                            <div
                              className="w-full rounded-t-md transition-all hover:opacity-80"
                              title={`${d.month}: ${d.count} loans, Rp ${d.value}M`}
                              style={{
                                height: MAX_BAR > 0 ? `${(d.value / MAX_BAR) * 100}%` : '5%',
                                backgroundColor: '#242F43',
                                minHeight: '3px',
                              }}
                            />
                          </div>
                          <span className="text-xs mt-1" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif', fontSize: '9px' }}>
                            {d.month}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full text-center text-sm" style={{ color: '#8E99A8' }}>
                        No data available for this period
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Recent Activities */}
              <div className="flex flex-col gap-5">
                {/* Recent Activities */}
                <div className="bg-white rounded-2xl p-6 flex-1 flex flex-col" style={{ border: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-base mb-5" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                    Recent Credit Activities
                  </h3>
                  <div className="space-y-4">
                    {data.recent_activities && data.recent_activities.length > 0 ? (
                      data.recent_activities.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 pb-3" style={{ borderBottom: i < data.recent_activities.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                            style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
                          >
                            {a.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                              {a.title}
                            </p>
                            <p className="text-xs line-clamp-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                              {a.detail}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif' }}>
                              {formatTimeAgo(a.time)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm" style={{ color: '#8E99A8' }}>No recent activities</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </DashboardLayout>
  )
}