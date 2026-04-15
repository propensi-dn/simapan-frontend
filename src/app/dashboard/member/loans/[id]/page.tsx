'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'
import { getLoanDetail, type LoanDetail, type Installment, type InstallmentStatus } from '@/lib/loans-api'

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

const INSTALLMENT_STATUS: Record<InstallmentStatus, { bg: string; text: string; dot: string; label: string }> = {
  UNPAID:  { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: 'Unpaid' },
  PENDING: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Pending' },
  PAID:    { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Paid' },
}

const STATUS_FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'UNPAID', label: 'Unpaid' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'PAID', label: 'Paid' },
]

// ── Proof Modal ───────────────────────────────────────────────────────────

function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F1F5F9' }}>
          <p className="font-bold text-sm"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Bukti Transfer
          </p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            style={{ color: '#8E99A8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Bukti Transfer"
            className="w-full rounded-xl object-contain"
            style={{ maxHeight: 400 }} />
          <a href={url} download target="_blank" rel="noreferrer"
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#11447D', color: '#fff' }}>
            ⬇ Download
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()

  const [loan,         setLoan]         = useState<LoanDetail | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [proofUrl,     setProofUrl]     = useState<string | null>(null)

  // profile for sidebar
  const [profile, setProfile] = useState<{ full_name: string; member_id: string | null; profile_picture: string | null } | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(r => setProfile(r.data)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getLoanDetail(Number(id))
      setLoan(data)
    } catch {
      setError('Gagal memuat data pinjaman.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const filteredInstallments = loan?.installments.filter(ins =>
    statusFilter ? ins.status === statusFilter : true
  ) ?? []

  // export CSV
  function exportCSV() {
    if (!loan) return
    const headers = ['No', 'Due Date', 'Amount', 'Principal', 'Interest', 'Status']
    const rows = loan.installments.map(ins => [
      ins.installment_number,
      fmtDate(ins.due_date),
      ins.amount,
      ins.principal_component,
      ins.interest_component,
      ins.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${loan.loan_id}-installments.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={profile?.member_id ? `#${profile.member_id}` : ''}
      avatarUrl={profile?.profile_picture || undefined}
    >
      <DashboardHeader
        variant="detail"
        parentLabel="Pinjaman"
        parentHref="/dashboard/member/loans"
        currentLabel={loan ? `#${loan.loan_id}` : 'Detail Pinjaman'}
        notifCount={0}
      />

      <main className="flex-1 p-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
            {error}&nbsp;
            <button onClick={load} className="underline font-semibold"
              style={{ color: '#11447D' }}>Coba lagi</button>
          </div>
        ) : loan && (
          <>
            {/* Loan Header */}
            <div className="bg-white rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
              style={{ border: '1px solid #F1F5F9' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#F1F5F9' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8E99A8" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-xl"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Loan ID: #{loan.loan_id}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                      style={{
                        backgroundColor: loan.status === 'ACTIVE' ? '#D1FAE5'
                          : loan.status === 'OVERDUE' ? '#FEE2E2'
                          : loan.status === 'LUNAS' ? '#DBEAFE'
                          : '#F3F4F6',
                        color: loan.status === 'ACTIVE' ? '#065F46'
                          : loan.status === 'OVERDUE' ? '#991B1B'
                          : loan.status === 'LUNAS' ? '#1E40AF'
                          : '#6B7280',
                      }}>
                      {loan.status_display}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Total Principal: {fmtRp(loan.amount)} &nbsp;·&nbsp; Term: {loan.tenor} Months
                  </p>
                </div>
              </div>
              <button onClick={() => router.push('/dashboard/member/loans')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                ← Back to Loan Index
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-5">
              {/* Outstanding Balance */}
              <div className="bg-white rounded-2xl p-6 space-y-3"
                style={{ border: '1px solid #F1F5F9' }}>
                <p className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Outstanding Balance
                </p>
                <p className="font-bold text-3xl"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  {fmtRp(loan.outstanding_balance)}
                </p>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${100 - loan.progress_percent}%`,
                        backgroundColor: '#242F43',
                      }} />
                  </div>
                  <p className="text-xs" style={{ color: '#8E99A8' }}>
                    {(100 - loan.progress_percent).toFixed(0)}% of principal remaining
                  </p>
                </div>
              </div>

              {/* Next Due Date */}
              <div className="bg-white rounded-2xl p-6 space-y-3"
                style={{ border: '1px solid #F1F5F9' }}>
                <p className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Next Due Date
                </p>
                {loan.next_due_date ? (
                  <>
                    <p className="font-bold text-3xl"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      {fmtDate(loan.next_due_date)}
                    </p>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                        stroke="#8E99A8" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm" style={{ color: '#8E99A8' }}>
                        Bill: {fmtRp(loan.next_installment_amount ?? 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: '#8E99A8' }}>
                    {loan.status === 'LUNAS' ? 'Pinjaman sudah lunas ✓' : 'Tidak ada tagihan aktif'}
                  </p>
                )}
              </div>
            </div>

            {/* Installment Schedule Table */}
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #F1F5F9' }}>
              {/* Table header */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Installment Schedule
                </h3>
                <div className="flex items-center gap-2">
                  {/* Filter */}
                  <div className="flex gap-1">
                    {STATUS_FILTERS.map(f => (
                      <button key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: statusFilter === f.key ? '#242F43' : '#F1F5F9',
                          color: statusFilter === f.key ? '#fff' : '#525E71',
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Export CSV */}
                  <button onClick={exportCSV}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ border: '1px solid #E5E7EB' }}
                    title="Download Full Statement">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                      stroke="#525E71" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['MONTH/NO', 'DUE DATE', 'INSTALLMENT AMOUNT', 'STATUS', 'ACTIONS'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstallments.map((ins, i) => {
                      const st = INSTALLMENT_STATUS[ins.status]
                      return (
                        <tr key={ins.id}
                          className="hover:bg-[#FAFAFA] transition-colors"
                          style={{ borderBottom: i < filteredInstallments.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                          <td className="px-5 py-4 text-sm font-semibold text-center w-24"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                            {ins.installment_number}
                          </td>
                          <td className="px-5 py-4 text-sm"
                            style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                            {fmtDate(ins.due_date)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-sm"
                              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                              {fmtRp(ins.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: st.dot }} />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {ins.status === 'PAID' && ins.transfer_proof ? (
                              <button
                                onClick={() => setProofUrl(ins.transfer_proof!)}
                                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                                style={{ border: '1px solid #E5E7EB' }}
                                title="Lihat bukti transfer">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                                  stroke="#525E71" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            ) : ins.status === 'UNPAID' && ins.installment_number === (
                              loan.installments.find(x => x.status !== 'PAID')?.installment_number
                            ) ? (
                              <button
                                onClick={() => router.push('/dashboard/member/loans/pay')}
                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                                style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                                Pay Now
                              </button>
                            ) : ins.status === 'UNPAID' ? (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                                stroke="#D1D5DB" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredInstallments.length === 0 && (
                <div className="py-12 text-center text-sm" style={{ color: '#8E99A8' }}>
                  Tidak ada cicilan dengan filter ini.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Proof Modal */}
      {proofUrl && (
        <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />
      )}
    </DashboardLayout>
  )
}