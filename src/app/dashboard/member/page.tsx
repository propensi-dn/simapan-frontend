'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import api from '@/lib/axios'

// ── Placeholder icons ──────────────────────────────────────────────────────
const SavingsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
)

const LoanIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

const StatusIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
)

// ── Mock data  ──────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 'TRX-SV-0001', date: 'Oct 24, 2023', description: 'Monthly Mandatory Deposit', type: 'CREDIT', amount: 'Rp 100.000' },
  { id: 'TRX-INS-0012', date: 'Oct 20, 2023', description: 'Loan Installment #LN-2023-001', type: 'DEBIT', amount: 'Rp 250.000' },
  { id: 'TRX-SV-0002', date: 'Oct 15, 2023', description: 'Voluntary Deposit', type: 'CREDIT', amount: 'Rp 500.000' },
]

export default function MemberDashboardPage() {
  const [profile, setProfile] = useState<{ full_name: string; member_id: string | null; profile_picture: string | null } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/members/profile/')
        setProfile(res.data)
      } catch (err) {
        console.error('Gagal memuat profil', err)
      }
    }
    fetchProfile()
  }, [])

  const userName = profile?.full_name || 'Member'
  const memberId = profile?.member_id ? `#${profile.member_id}` : ''

  return (
    <DashboardLayout role="MEMBER" userName={userName} userID={memberId}>
      <DashboardHeader variant="default" title="Dashboard" notifCount={2} />

      <main className="flex-1 p-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Welcome back, {userName.split(' ')[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Here&apos;s a summary of your financial status as of today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Total Savings"
            value="Rp 12.450.000"
            badge="+0.0%"
            badgePositive={true}
            icon={<SavingsIcon />}
            accent="#11447D"
          />
          <StatCard
            label="Remaining Loan"
            value="Rp 4.200.000"
            icon={<LoanIcon />}
            accent="#F2A025"
          />
          <StatCard
            label="Member Status"
            value="Active"
            icon={<StatusIcon />}
            accent="#10B981"
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Recent Transactions
            </h3>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['DATE', 'DESCRIPTION', 'TYPE', 'AMOUNT'].map(col => (
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
              {MOCK_TRANSACTIONS.map((tx, i) => (
                <tr
                  key={tx.id}
                  style={{ borderBottom: i < MOCK_TRANSACTIONS.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                >
                  <td className="px-6 py-4 text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    {tx.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                    {tx.description}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: tx.type === 'CREDIT' ? '#D1FAE5' : '#FEE2E2',
                        color: tx.type === 'CREDIT' ? '#065F46' : '#991B1B',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-sm font-bold"
                    style={{
                      color: tx.type === 'CREDIT' ? '#10B981' : '#EF4444',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {tx.type === 'DEBIT' ? '- ' : '+ '}{tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </DashboardLayout>
  )
}