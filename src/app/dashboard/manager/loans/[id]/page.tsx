'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
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
      <p className="text-xs" style={{ color: '#8E99A8' }}>{displayScore}/100 kelayakan</p>
    </div>
  )
}

function InstallmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    PAID: { bg: '#111827', text: '#FFFFFF' },
    PENDING: { bg: '#FFF7ED', text: '#C2410C' },
    UNPAID: { bg: '#F3F4F6', text: '#6B7280' },
  }

  const style = styles[status] || { bg: '#F3F4F6', text: '#6B7280' }

  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: style.bg, color: style.text, fontFamily: 'Inter, sans-serif' }}
    >
      {status}
    </span>
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
              Dokumen non-gambar (PDF/Berkas)
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
          Tutup
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
  const [installmentPage, setInstallmentPage] = useState(1)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)

  const installmentPageSize = 8

  const monitoring = data?.monitoring || null
  const isReadOnlyMonitoring = Boolean(monitoring)
  const cleanedRejectionReason = data?.loan.rejection_reason?.trim() || ''

  const totalInstallmentPages = useMemo(() => {
    if (!monitoring) return 1
    return Math.max(1, Math.ceil(monitoring.installments.length / installmentPageSize))
  }, [monitoring])

  const pagedInstallments = useMemo(() => {
    if (!monitoring) return []
    const start = (installmentPage - 1) * installmentPageSize
    return monitoring.installments.slice(start, start + installmentPageSize)
  }, [monitoring, installmentPage])

  const showingFrom = useMemo(() => {
    if (!monitoring || monitoring.installments.length === 0) return 0
    return (installmentPage - 1) * installmentPageSize + 1
  }, [monitoring, installmentPage])

  const showingTo = useMemo(() => {
    if (!monitoring || monitoring.installments.length === 0) return 0
    return Math.min(installmentPage * installmentPageSize, monitoring.installments.length)
  }, [monitoring, installmentPage])

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
      setInstallmentPage(1)
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
      setActionError('Alasan penolakan wajib diisi sebelum menolak.')
      return
    }

    setActionLoading(true)
    try {
      await reviewManagerLoan(Number(id), {
        action,
        reason: action === 'reject' ? decisionReason.trim() : undefined,
      })

      setActionSuccess(action === 'approve' ? 'Pinjaman berhasil disetujui.' : 'Pinjaman berhasil ditolak.')
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

  function openProof(url: string | null) {
    if (!url) return
    setProofUrl(url)
    setProofModalOpen(true)
  }

  return (
    <DashboardLayout role="MANAGER" userName="Manajer" userID="MGR-0001">
      <DashboardHeader
        variant="detail"
        parentLabel="Persetujuan Pinjaman"
        parentHref="/dashboard/manager/loans"
        currentLabel={data?.loan.loan_id || `Tinjau #${id}`}
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
          isReadOnlyMonitoring ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-[30px] font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                    #{data.loan.loan_id} - {data.loan.member_name}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Detail pinjaman aktif (read-only)
                  </p>
                </div>
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: (STATUS_STYLE[data.loan.status] || STATUS_STYLE.PENDING).bg,
                    color: (STATUS_STYLE[data.loan.status] || STATUS_STYLE.PENDING).text,
                  }}
                >
                  {data.loan.status_display}
                </span>
              </div>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    PROGRES PEMBAYARAN
                  </p>
                  <div className="flex items-end justify-between">
                    <div className="w-full pr-4">
                      <div className="h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, monitoring.payment_progress_percent))}%`, backgroundColor: '#111827' }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        {monitoring.paid_installments} dari {monitoring.total_installments} bulan sudah dibayar
                      </p>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {monitoring.payment_progress_percent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    SISA PINJAMAN
                  </p>
                  <p className="text-4xl font-bold" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
                    {fmtRp(monitoring.outstanding_balance)}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Pokok pinjaman belum lunas
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    JATUH TEMPO BERIKUTNYA
                  </p>
                  <p className="text-4xl font-bold" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
                    {fmtDate(monitoring.next_due_date)}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Siklus {monitoring.paid_installments}/{monitoring.total_installments}
                  </p>
                </div>
              </section>

              <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                    Jadwal Cicilan Lengkap
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                        {['BULAN', 'JATUH TEMPO', 'NOMINAL', 'STATUS', 'AKSI'].map((head) => (
                          <th
                            key={head}
                            className="px-6 py-3 text-left text-[11px] font-semibold"
                            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {pagedInstallments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                            Belum ada data cicilan.
                          </td>
                        </tr>
                      ) : (
                        pagedInstallments.map((row, index) => (
                          <tr key={row.id} style={{ borderBottom: index < pagedInstallments.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                            <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                              {row.installment_number}
                            </td>
                            <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                              {fmtDate(row.due_date)}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                              {fmtRp(row.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <InstallmentStatusBadge status={row.status} />
                            </td>
                            <td className="px-6 py-4">
                              {row.status === 'PAID' && row.transfer_proof_url ? (
                                <button
                                  type="button"
                                  onClick={() => openProof(row.transfer_proof_url)}
                                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                                  style={{ backgroundColor: '#111827', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                                >
                                  Lihat Bukti
                                </button>
                              ) : (
                                <span className="text-sm" style={{ color: '#B0BAC5' }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Menampilkan {showingFrom} sampai {showingTo} dari {monitoring.installments.length} data
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInstallmentPage(prev => Math.max(1, prev - 1))}
                      disabled={installmentPage <= 1}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md disabled:opacity-40"
                      style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
                    >
                      {'<'}
                    </button>
                    <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                      {installmentPage} / {totalInstallmentPages}
                    </span>
                    <button
                      onClick={() => setInstallmentPage(prev => Math.min(totalInstallmentPages, prev + 1))}
                      disabled={installmentPage >= totalInstallmentPages}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md disabled:opacity-40"
                      style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
                    >
                      {'>'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-6">
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h2 className="font-bold text-3xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Detail Pengajuan Pinjaman
                </h2>
                <p className="text-sm mb-5" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Diajukan oleh {data.loan.member_name} pada {fmtDate(data.loan.application_date)}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Nominal Pengajuan</p>
                    <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {fmtRp(data.loan.amount)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Tenor</p>
                    <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {data.loan.tenor} Bulan
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Kategori Pinjaman</p>
                    <p className="text-xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {data.loan.category_display}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Deskripsi</p>
                    <p className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                      {data.loan.description || '-'}
                    </p>
                  </div>
                  {data.loan.status === 'REJECTED' && (
                    <div>
                      <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Alasan Penolakan</p>
                      <p className="text-sm" style={{ color: '#991B1B', fontFamily: 'Inter, sans-serif' }}>
                        {cleanedRejectionReason || 'Alasan penolakan tidak tersimpan pada data pinjaman ini.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base mb-4" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Verifikasi Jaminan
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
                          {['ID PINJAMAN', 'NOMINAL', 'STATUS', 'AKSI'].map(col => (
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
                                  Lihat Detail
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
                  Kondisi Finansial Anggota
                </h3>
                <p className="text-sm mb-5" style={{ color: '#8E99A8' }}>
                  Analisis internal dan data historis.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Total Simpanan</p>
                    <p className="font-bold text-2xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      {fmtRp(data.loan.total_savings)}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Skor Kredit</p>
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
                    <p className="text-xs font-semibold uppercase" style={{ color: '#8E99A8' }}>Skor Kelayakan</p>
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
                  Penilaian Risiko Otomatis
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
                      Alasan Keputusan *
                    </p>
                    <textarea
                      rows={3}
                      value={decisionReason}
                      onChange={e => setDecisionReason(e.target.value)}
                      placeholder="Tulis alasan detail untuk keputusan persetujuan/penolakan..."
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
                      TOLAK PENGAJUAN
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview('approve')}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#111827' }}>
                      SETUJUI PINJAMAN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        )}
      </main>

      {showSuccessModal && (
        <SuccessModal
          message={actionSuccess || 'Status pinjaman telah diperbarui.'}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {proofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProofModalOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                Bukti Transfer Cicilan
              </h3>
              <button type="button" onClick={() => setProofModalOpen(false)} style={{ color: '#8E99A8' }}>
                x
              </button>
            </div>
            <div className="p-4">
              {proofUrl?.toLowerCase().endsWith('.pdf') ? (
                <div className="space-y-3">
                  <div className="text-sm" style={{ color: '#374151' }}>
                    Dokumen PDF
                  </div>
                  <a
                    href={proofUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-semibold"
                    style={{ color: '#11447D' }}
                  >
                    Buka PDF di tab baru
                  </a>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofUrl || ''} alt="Bukti Transfer" className="max-h-[70vh] mx-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
