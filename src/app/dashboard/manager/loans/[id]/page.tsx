'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getManagerLoanDetail,
  reviewManagerLoan,
  type ManagerLoanDetailResponse,
  type LoanStatus,
} from '@/lib/loans-api'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLE: Record<LoanStatus, { bg: string; text: string }> = {
  PENDING:             { bg: '#FEF3C7', text: '#92400E' },
  APPROVED:            { bg: '#D1FAE5', text: '#065F46' },
  REJECTED:            { bg: '#FEE2E2', text: '#991B1B' },
  ACTIVE:              { bg: '#DBEAFE', text: '#1E40AF' },
  LUNAS:               { bg: '#D1FAE5', text: '#065F46' },
  OVERDUE:             { bg: '#FEE2E2', text: '#991B1B' },
  LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', text: '#92400E' },
}

function ScoreBar({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(100, score))
  const color = normalized >= 80 ? '#10B981' : normalized >= 60 ? '#F59E0B' : '#EF4444'
  const displayScore = Number(normalized.toFixed(1))

  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${normalized}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs" style={{ color: '#8E99A8' }}>{displayScore}/100 eligibility</p>
    </div>
  )
}

function DocumentCard({ title, url }: { title: string; url: string | null }) {
  const isImage = !!url && /\.(png|jpg|jpeg|webp|gif)$/i.test(url)

  return (
    <div className="rounded-2xl p-4" style={{ border: '1px dashed #D1D5DB', backgroundColor: '#FAFAFA' }}>
      <p className="text-xs font-semibold mb-3 uppercase" style={{ color: '#8E99A8' }}>{title}</p>
      {!url ? (
        <p className="text-sm" style={{ color: '#8E99A8' }}>Dokumen belum tersedia</p>
      ) : (
        <div className="space-y-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={title}
              className="w-full h-40 rounded-xl object-cover"
              style={{ border: '1px solid #E5E7EB' }}
            />
          ) : (
            <div className="h-40 rounded-xl flex items-center justify-center text-sm font-semibold"
              style={{ border: '1px solid #E5E7EB', color: '#525E71', backgroundColor: '#FFFFFF' }}>
              Dokumen non-gambar (PDF/File)
            </div>
          )}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ backgroundColor: '#242F43', color: '#fff' }}>
            Lihat Dokumen
          </a>
        </div>
      )}
    </div>
  )
}

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}
        style={{ border: '1px solid #F1F5F9' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 800 }}>
          ✓
        </div>
        <p className="text-center font-bold text-lg mb-2" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
          Status Berhasil Diperbarui
        </p>
        <p className="text-sm text-center mb-5" style={{ color: '#8E99A8' }}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-bold"
          style={{ backgroundColor: '#242F43', color: '#fff' }}>
          OK
        </button>
      </div>
    </div>
  )
}

export default function ManagerLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [data, setData] = useState<ManagerLoanDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const numericId = Number(id)
    if (Number.isNaN(numericId)) {
      setError('ID pinjaman tidak valid.')
      setLoading(false)
      return
    }

    try {
      const res = await getManagerLoanDetail(numericId)
      setData(res)
    } catch {
      setError('Gagal memuat detail pengajuan pinjaman.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleReview(action: 'approve' | 'reject') {
    if (actionLoading || !data) return

    setActionError('')
    setActionSuccess('')

    if (action === 'reject' && !decisionReason.trim()) {
      setActionError('Alasan penolakan wajib diisi sebelum reject.')
      return
    }

    setActionLoading(true)
    try {
      await reviewManagerLoan(Number(id), {
        action,
        reason: action === 'reject' ? decisionReason.trim() : undefined,
      })

      setActionSuccess(action === 'approve' ? 'Pinjaman berhasil di-approve.' : 'Pinjaman berhasil di-reject.')
      setShowSuccessModal(true)
      await load()
    } catch (err: unknown) {
      let msg = 'Gagal menyimpan keputusan pinjaman.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { reason?: string; error?: string } } }).response
        msg = response?.data?.reason || response?.data?.error || msg
      }
      setActionError(String(msg))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout role="MANAGER" userName="Manager" userID="MGR-0001">
      <DashboardHeader
        variant="detail"
        parentLabel="Loan Approvals"
        parentHref="/dashboard/manager/loans"
        currentLabel={data?.loan.loan_id || `Review #${id}`}
        notifCount={0}
      />

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
            {error}
            <button onClick={load} className="ml-2 underline font-semibold" style={{ color: '#11447D' }}>
              Coba lagi
            </button>
          </div>
        ) : data && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-6">
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h2 className="font-bold text-3xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Loan Application Details
                </h2>
                <p className="text-sm mb-5" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Submitted by {data.loan.member_name} on {fmtDate(data.loan.application_date)}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Requested Amount</p>
                    <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {fmtRp(data.loan.amount)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Tenor</p>
                    <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {data.loan.tenor} Months
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Loan Category</p>
                    <p className="text-xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {data.loan.category_display}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Description</p>
                    <p className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                      {data.loan.description || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base mb-4" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Collateral Verification
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DocumentCard title="Foto Jaminan / Aset" url={data.loan.collateral_image_url} />
                  <DocumentCard title="Slip Gaji" url={data.loan.salary_slip_url} />
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-base" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                    Riwayat Pinjaman Sebelumnya
                  </h3>
                </div>
                {data.member_previous_loans.length === 0 ? (
                  <div className="px-5 py-10 text-sm text-center" style={{ color: '#8E99A8' }}>
                    Belum ada riwayat pinjaman sebelumnya.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['Loan ID', 'Amount', 'Status', 'Action'].map(col => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.member_previous_loans.map((loan, i) => {
                          const st = STATUS_STYLE[loan.status] || STATUS_STYLE.PENDING
                          return (
                            <tr key={loan.id} style={{ borderBottom: i < data.member_previous_loans.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                              <td className="px-4 py-3 text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                                {loan.loan_id}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                                {fmtRp(loan.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold"
                                  style={{ backgroundColor: st.bg, color: st.text }}>
                                  {loan.status_display}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/dashboard/manager/loans/${loan.id}`}
                                  className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold"
                                  style={{ backgroundColor: '#242F43', color: '#fff' }}>
                                  View Detail
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
            </div>

            <div className="col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-2xl mb-1" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Member Financial Health
                </h3>
                <p className="text-sm mb-5" style={{ color: '#8E99A8' }}>
                  Internal analysis and historical data.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Total Savings</p>
                    <p className="font-bold text-2xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {fmtRp(data.loan.total_savings)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Credit Score</p>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-2xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {data.loan.credit_score.score}
                      </p>
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: '#F3F4F6', color: '#525E71' }}>
                        {data.loan.credit_score.label}
                      </span>
                    </div>
                    <ScoreBar score={((data.loan.credit_score.score - 300) / 550) * 100} />
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Eligibility Scorecard</p>
                    <p className="text-lg font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {data.scorecard.eligibility_score}
                    </p>
                  </div>
                  <ScoreBar score={data.scorecard.eligibility_score} />
                  <ul className="mt-3 space-y-1.5">
                    {data.scorecard.indicators.map((item, idx) => (
                      <li key={`${item.label}-${idx}`} className="text-sm flex items-center justify-between" style={{ color: '#525E71' }}>
                        <span>{item.label}</span>
                        <span className="font-semibold" style={{ color: '#242F43' }}>{String(item.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base mb-3" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Automated Risk Assessment
                </h3>
                <ul className="space-y-2.5">
                  {data.risk_assessment.map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className="flex items-start gap-2 text-sm" style={{ color: '#525E71' }}>
                      <span className="mt-0.5 font-bold" style={{ color: item.passed ? '#10B981' : '#EF4444' }}>
                        {item.passed ? '✓' : '!'}
                      </span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {data.loan.status === 'PENDING' && (
                <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid #F1F5F9' }}>
                  <div>
                    <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8E99A8' }}>
                      Reason For Decision *
                    </p>
                    <textarea
                      rows={3}
                      value={decisionReason}
                      onChange={e => setDecisionReason(e.target.value)}
                      placeholder="Provide a detailed justification for your approval or rejection..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{
                        border: '1px solid #E5E7EB',
                        color: '#242F43',
                        backgroundColor: '#FAFAFA',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>

                  {actionError && (
                    <p className="text-sm" style={{ color: '#EF4444' }}>{actionError}</p>
                  )}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview('reject')}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                      style={{ border: '1px solid #242F43', color: '#242F43' }}>
                      REJECT APPLICATION
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview('approve')}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#111827' }}>
                      APPROVE LOAN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showSuccessModal && (
        <SuccessModal
          message={actionSuccess || 'Status pinjaman telah diperbarui.'}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </DashboardLayout>
  )
}
