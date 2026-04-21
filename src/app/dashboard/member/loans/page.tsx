'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'
import {
  getLoanOverview,
  type Loan,
  type LoanSummary,
  type LoanStatus,
} from '@/lib/loans-api'
import { useRouter } from 'next/navigation'

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Constants ─────────────────────────────────────────────────────────────

const LOAN_STATUS: Record<LoanStatus, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:             { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: 'Pending' },
  APPROVED:            { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Approved' },
  REJECTED:            { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Rejected' },
  ACTIVE:              { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Active' },
  LUNAS:               { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Lunas' },
  OVERDUE:             { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Overdue' },
  LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Lunas (After Overdue)' },
}

const CREDIT_SCORE_COLOR: Record<string, { bar: string; text: string }> = {
  Poor:      { bar: '#EF4444', text: '#991B1B' },
  Fair:      { bar: '#F59E0B', text: '#92400E' },
  Good:      { bar: '#10B981', text: '#065F46' },
  Excellent: { bar: '#11447D', text: '#11447D' },
}

const STATUS_FILTERS = [
  { key: '',                   label: 'Semua' },
  { key: 'ACTIVE',             label: 'Active' },
  { key: 'PENDING',            label: 'Pending' },
  { key: 'APPROVED',           label: 'Approved' },
  { key: 'OVERDUE',            label: 'Overdue' },
  { key: 'LUNAS',              label: 'Lunas' },
]

// ── Sub-components ────────────────────────────────────────────────────────

function SummaryCard({
  label, children, accent = '#11447D',
}: {
  label: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-2"
      style={{ border: '1px solid #F1F5F9' }}>
      <p className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{label}</p>
      <div style={{ color: accent }}>{children}</div>
    </div>
  )
}

function CreditScoreBar({ score, label }: { score: number; label: string }) {
  const colors = CREDIT_SCORE_COLOR[label] ?? CREDIT_SCORE_COLOR.Fair
  const pct = ((score - 300) / (850 - 300)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-3xl" style={{ fontFamily: 'Montserrat, sans-serif', color: colors.text }}>
          {score}
        </span>
        <span className="text-sm font-semibold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: colors.bar + '20', color: colors.text }}>
          {label}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: colors.bar }} />
      </div>
      <p className="text-xs" style={{ color: '#8E99A8' }}>Score range: 300 – 850</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LoanOverviewPage() {
  const router = useRouter()
  const [summary,      setSummary]      = useState<LoanSummary | null>(null)
  const [loans,        setLoans]        = useState<Loan[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText,   setSearchText]   = useState('')
  const [searchQ,      setSearchQ]      = useState('')
  const [memberStatus, setMemberStatus] = useState<string | null>(null)
  const [hasBadDebt,   setHasBadDebt]   = useState(false)
  const [blockModal,   setBlockModal]   = useState<'inactive' | 'bad_debt' | null>(null)


  // profile for sidebar
  const [profile, setProfile] = useState<{ full_name: string; member_id: string | null; profile_picture: string | null } | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(r => {
      setProfile(r.data)
      setMemberStatus(r.data.status)
    }).catch(() => {})

    api.get('/loans/create/').then(r => {
      setHasBadDebt(r.data.has_bad_debt)
    }).catch(() => {})
  }, [])

  function handleAjukanPinjaman() {
    if (hasBadDebt) { setBlockModal('bad_debt'); return }
    if (memberStatus !== 'ACTIVE') { setBlockModal('inactive'); return }
    router.push('/dashboard/member/loans/apply')
}

  const load = useCallback(async (status: string, q: string) => {
    setLoading(true); setError('')
    try {
      const res = await getLoanOverview({
        status: status || undefined,
        search: q || undefined,
      })
      setSummary(res.summary)
      setLoans(res.loans)
    } catch {
      setError('Gagal memuat data pinjaman. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(statusFilter, searchQ) }, [statusFilter, searchQ]) // eslint-disable-line

  return (
    <DashboardLayout
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={profile?.member_id ? `#${profile.member_id}` : ''}
      avatarUrl={profile?.profile_picture || undefined}
    >
      <DashboardHeader variant="default" title="Pinjaman" notifCount={0} />

      <main className="flex-1 p-8 space-y-6">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl mb-1"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Loan Overview
            </h2>
            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Manage and track your active loan applications and payments.
            </p>
          </div>
          <button
            onClick={handleAjukanPinjaman}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Montserrat, sans-serif' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajukan Pinjaman
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-5">

            {/* Total Outstanding */}
            <SummaryCard label="Total Sisa Hutang" accent="#242F43">
              <p className="font-bold text-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {fmtRp(summary.total_outstanding)}
              </p>
            </SummaryCard>

            {/* Next Due Date */}
            <SummaryCard label="Next Payment Due Date" accent="#F2A025">
              {summary.next_due_date ? (
                <div className="space-y-2">
                  <p className="font-bold text-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {fmtDate(summary.next_due_date)}
                  </p>
                  <p className="text-sm" style={{ color: '#8E99A8' }}>
                    Bill: {fmtRp(summary.next_due_amount ?? 0)}
                  </p>
                  <Link
                    href="/dashboard/member/loans/pay"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}
                  >
                    Bayar Sekarang →
                  </Link>
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#8E99A8' }}>Tidak ada tagihan aktif</p>
              )}
            </SummaryCard>

            {/* Credit Score */}
            <SummaryCard label="Credit Score">
              <CreditScoreBar
                score={summary.credit_score.score}
                label={summary.credit_score.label}
              />
            </SummaryCard>
          </div>
        )}

        {/* Loan Table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>

          {/* Toolbar */}
          <div className="px-6 py-3 flex flex-wrap items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: statusFilter === f.key ? '#242F43' : '#F1F5F9',
                    color: statusFilter === f.key ? '#fff' : '#525E71',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-gray-200" />

            {/* Search */}
            <form onSubmit={e => { e.preventDefault(); setSearchQ(searchText) }}
              className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input type="text" placeholder="Search Loan ID..."
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif', backgroundColor: '#FAFAFA' }}
                />
              </div>
              <button type="submit"
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#242F43', color: '#fff' }}>
                Cari
              </button>
              {searchQ && (
                <button type="button"
                  onClick={() => { setSearchText(''); setSearchQ('') }}
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  Reset
                </button>
              )}
            </form>

            <span className="ml-auto text-xs" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif' }}>
              {loans.length} pinjaman
            </span>
          </div>

          {/* Table body */}
          {error ? (
            <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
              {error}&nbsp;
              <button onClick={() => load(statusFilter, searchQ)}
                className="underline font-semibold" style={{ color: '#11447D' }}>Coba lagi</button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : loans.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm" style={{ color: '#8E99A8' }}>
                {searchQ ? `Tidak ada pinjaman untuk "${searchQ}"` : 'Belum ada pinjaman.'}
              </p>
              {!searchQ && (
                <button onClick={handleAjukanPinjaman}
                  className="inline-block text-sm font-bold underline"
                  style={{ color: '#11447D' }}>
                  Ajukan pinjaman pertama →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['LOAN ID', 'LOAN CATEGORY', 'PRINCIPAL AMOUNT', 'REMAINING', 'STATUS', 'ACTIONS'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, i) => {
                    const st = LOAN_STATUS[loan.status] ?? LOAN_STATUS.PENDING
                    return (
                      <tr key={loan.id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < loans.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-sm"
                            style={{ color: '#11447D' }}>
                            #{loan.loan_id}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                          {loan.category_display}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-sm"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                            {fmtRp(loan.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-sm"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                            {fmtRp(loan.outstanding_balance)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: st.bg, color: st.text, fontFamily: 'Inter, sans-serif' }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: st.dot }} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/member/loans/${loan.id}`}
                            className="text-sm font-bold transition-opacity hover:opacity-60"
                            style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                            View Detail →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8E99A8" strokeWidth={2}
            className="flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Please ensure your mandatory savings are up to date before applying for a new loan.
            Loans with &quot;Pending&quot; status usually take 1–3 business days for initial review by the board.
          </p>
        </div>

        {blockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: blockModal === 'bad_debt' ? '#FEE2E2' : '#FEF3C7' }}>
                {blockModal === 'bad_debt' ? (
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                {blockModal === 'bad_debt' ? 'Pengajuan Tidak Dapat Dilakukan' : 'Keanggotaan Belum Aktif'}
              </h3>
              <p className="text-sm mb-6 leading-relaxed"
                style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                {blockModal === 'bad_debt'
                  ? 'Anda memiliki riwayat kredit macet. Pengajuan pinjaman baru tidak dapat dilakukan hingga kredit macet diselesaikan. Hubungi admin koperasi untuk informasi lebih lanjut.'
                  : 'Keanggotaan Anda belum aktif. Pastikan simpanan pokok sudah diverifikasi oleh petugas untuk mengaktifkan keanggotaan.'}
              </p>
              {blockModal === 'inactive' && (
                <button
                  onClick={() => { setBlockModal(null); router.push('/dashboard/member/savings') }}
                  className="w-full py-3 rounded-xl font-bold text-sm mb-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  Lihat Status Simpanan
                </button>
              )}
              <button onClick={() => setBlockModal(null)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50"
                style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                Tutup
              </button>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  )
}