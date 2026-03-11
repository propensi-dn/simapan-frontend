'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'


// ── Icons ──────────────────────────────────────────────────────────────────
const MemberIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
)
const SavingsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
  </svg>
)
const LoanIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3M3 6v3" />
  </svg>
)
const WithdrawIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ── Category badge styles ──────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  MEMBER:     { bg: '#DBEAFE', text: '#1E40AF' },
  SAVINGS:    { bg: '#D1FAE5', text: '#065F46' },
  LOAN:       { bg: '#FEF3C7', text: '#92400E' },
  WITHDRAWAL: { bg: '#F3E8FF', text: '#6B21A8' },
}

const STATUS_DOT: Record<string, string> = {
  'Pending':     '#9CA3AF',
  'In Progress': '#F59E0B',
  'Completed':   '#10B981',
}

// ── Mock data ──────────────────────────────────────────────────────────────
type TaskCategory = 'MEMBER' | 'SAVINGS' | 'LOAN' | 'WITHDRAWAL'

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
  { id: 'T-8804', category: 'WITHDRAWAL', subject: 'Request: Emergency Fund',           status: 'Completed',   action: 'View',     href: '/dashboard/staff/withdrawals/4' },
  { id: 'T-8805', category: 'MEMBER',     subject: 'KYC Update: Siti Aminah',           status: 'Pending',     action: 'Verify',   href: '/dashboard/staff/verification/5' },
]

// ── Page ──────────────────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  // TODO: fetch dari /api/dashboards/staff/ dan user session
  const userName = 'Budi Santoso'

  return (
    <DashboardLayout role="STAFF" userName={userName} userID="STAFF-0001">

      <DashboardHeader
        variant="default"
        title="Dashboard"
        notifCount={5}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Good morning, {userName.split(' ')[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Here&apos;s what needs your attention today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Members"     value="124"       subtitle="Pending Members" icon={<MemberIcon />}   accent="#11447D" />
          <StatCard label="Savings"     value="Rp 15M"    subtitle="To Verify"       icon={<SavingsIcon />}  accent="#10B981" />
          <StatCard label="Loans"       value="Rp 45.2M"  subtitle="To Disburse"     icon={<LoanIcon />}     accent="#F2A025" />
          <StatCard label="Withdrawals" value="38"         subtitle="New Requests"    icon={<WithdrawIcon />} accent="#8B5CF6" />
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Today&apos;s Tasks Summary
            </h3>
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
            >
              Export CSV
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['TASK ID', 'CATEGORY', 'SUBJECT', 'STATUS', 'ACTION'].map(col => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TASKS.map((task, i) => {
                const catStyle = CATEGORY_STYLE[task.category]
                return (
                  <tr key={task.id}
                    style={{ borderBottom: i < MOCK_TASKS.length - 1 ? '1px solid #F8FAFC' : 'none' }}>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium" style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                        {task.id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-md tracking-wide"
                        style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: 'Inter, sans-serif' }}
                      >
                        {task.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                      {task.subject}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[task.status] }} />
                        <span className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                          {task.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Link href={task.href} className="text-sm font-bold transition-colors hover:opacity-70"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {task.action}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-3 flex items-center justify-between text-sm"
            style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            <span>Showing 5 of 24 tasks</span>
            <div className="flex items-center gap-1">
              {['‹', '1', '2', '›'].map((p, idx) => (
                <button key={idx}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: p === '1' ? '#242F43' : 'transparent',
                    color: p === '1' ? '#FFFFFF' : '#525E71',
                    border: p === '1' ? 'none' : '1px solid #E5E7EB',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  )
}