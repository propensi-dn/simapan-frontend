'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'

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

// ── Loan type badge styles ─────────────────────────────────────────────────
const LOAN_TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  Emergency:  { bg: '#FEE2E2', text: '#991B1B' },
  Investment: { bg: '#D1FAE5', text: '#065F46' },
  Consumer:   { bg: '#DBEAFE', text: '#1E40AF' },
  Education:  { bg: '#FEF3C7', text: '#92400E' },
}

// ── Mock data ──────────────────────────────────────────────────────────────
const PENDING_LOANS = [
  { member: 'Budi Santoso', amount: 'Rp 50.000.000',  type: 'Emergency',  date: '2023-10-24' },
  { member: 'Siti Aminah',  amount: 'Rp 150.000.000', type: 'Investment', date: '2023-10-23' },
  { member: 'Ahmad Fauzi',  amount: 'Rp 25.000.000',  type: 'Consumer',   date: '2023-10-23' },
  { member: 'Dewi Lestari', amount: 'Rp 75.000.000',  type: 'Education',  date: '2023-10-22' },
]

const RISK_PROFILE = [
  { label: 'Current (No arrears)',     pct: 92, color: '#10B981' },
  { label: 'Substandard (30-90 days)', pct: 5,  color: '#F59E0B' },
  { label: 'Doubtful (90-180 days)',   pct: 2,  color: '#F97316' },
  { label: 'Loss (>180 days)',         pct: 1,  color: '#EF4444' },
]

const RECENT_ACTIVITIES = [
  { icon: '+',  title: 'New Loan Disbursed',        detail: 'Rp 120.000.000 - Siti Aminah', time: '10 minutes ago' },
  { icon: '↓',  title: 'Payment Received',          detail: 'Rp 1.250.000 - John Doe',      time: '2 hours ago' },
  { icon: '⊘',  title: 'Membership Resign Request', detail: 'Anton Sugiono - ID: CU-9283',   time: 'Yesterday' },
]

const BAR_DATA = [
  { month: 'JAN', value: 30 }, { month: 'FEB', value: 45 }, { month: 'MAR', value: 38 },
  { month: 'APR', value: 55 }, { month: 'MAY', value: 70 }, { month: 'JUN', value: 82 },
  { month: 'JUL', value: 50 }, { month: 'AUG', value: 40 }, { month: 'SEP', value: 60 },
  { month: 'OCT', value: 75 }, { month: 'NOV', value: 65 }, { month: 'DEC', value: 80 },
]
const MAX_BAR = Math.max(...BAR_DATA.map(d => d.value))

// ── Page ──────────────────────────────────────────────────────────────────
export default function ManagerDashboardPage() {
  // TODO: fetch dari /api/dashboards/manager/ dan user session
  const userName = 'Budi Santoso'

  return (
    <DashboardLayout role="MANAGER" userName={userName} userID="1092834">

      <DashboardHeader
        variant="default"
        title="Executive Overview"
        notifCount={3}
        notifHref="/dashboard/manager/notifications"
      />

      <main className="flex-1 p-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Total Liquidity"
            value="Rp 4.250.000.000"
            badge="+2.4%"
            badgePositive={true}
            icon={<LiquidityIcon />}
            accent="#11447D"
          />
          <StatCard
            label="Total Outstanding Loans"
            value="Rp 12.800.000.000"
            badge="-1.2%"
            badgePositive={false}
            icon={<LoanIcon />}
            accent="#EF4444"
          />
          <StatCard
            label="Current SHU Estimate"
            value="Rp 850.400.000"
            badge="+5.7%"
            badgePositive={true}
            icon={<ShuIcon />}
            accent="#10B981"
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
                  Pending Loan Approvals
                </h3>
                <Link
                  href="/dashboard/manager/loans"
                  className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  View All
                </Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['MEMBER NAME', 'AMOUNT REQUESTED', 'LOAN TYPE', 'DATE', 'ACTION'].map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PENDING_LOANS.map((loan, i) => {
                    const typeStyle = LOAN_TYPE_STYLE[loan.type] || { bg: '#F3F4F6', text: '#525E71' }
                    return (
                      <tr key={i} style={{ borderBottom: i < PENDING_LOANS.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <td className="px-6 py-3 text-sm font-medium" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                          {loan.member}
                        </td>
                        <td className="px-6 py-3 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                          {loan.amount}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: typeStyle.bg, color: typeStyle.text, fontFamily: 'Inter, sans-serif' }}
                          >
                            {loan.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                          {loan.date}
                        </td>
                        <td className="px-6 py-3">
                          <Link
                            href="/dashboard/manager/loans/1"
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all"
                            style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Portfolio Performance Bar Chart */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Portfolio Performance Trend
                </h3>
                <div className="flex items-center gap-1">
                  {['6M', '1Y'].map((v, i) => (
                    <button key={v}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: i === 0 ? '#242F43' : 'transparent',
                        color: i === 0 ? '#fff' : '#8E99A8',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-36">
                {BAR_DATA.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${(d.value / MAX_BAR) * 100}%`,
                        backgroundColor: d.month === 'JUN' ? '#242F43' : '#E5E7EB',
                      }}
                    />
                    <span className="text-xs" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif', fontSize: '9px' }}>
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Risk Profile + Recent Activities */}
          <div className="flex flex-col gap-5">

            {/* Risk Profile */}
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-base mb-5" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                Risk Profile Overview
              </h3>
              <div className="space-y-4">
                {RISK_PROFILE.map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>{r.label}</span>
                      <span className="text-xs font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>{r.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 flex-1" style={{ border: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-base mb-5" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                Recent Credit Activities
              </h3>
              <div className="space-y-4">
                {RECENT_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
                    >
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>{a.title}</p>
                      <p className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{a.detail}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif' }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full mt-5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-colors"
                style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
              >
                VIEW ACTIVITY LOG
              </button>
            </div>

          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}