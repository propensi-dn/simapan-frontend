'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getPendingInstallmentPaymentDetail,
  StaffInstallmentPaymentDetail,
  verifyPendingInstallmentPayment,
} from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { ExternalLink, FileText, UserRound, Calculator } from 'lucide-react'

const formatCurrency = (value: string): string => {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return value
  }
}

const formatDateTime = (value: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StaffInstallmentReviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const installmentId = useMemo(() => Number(params.id), [params.id])

  const [detail, setDetail] = useState<StaffInstallmentPaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const maybeMessage = (error as { response?: { data?: { error?: unknown } } }).response?.data?.error
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        return maybeMessage
      }
    }
    return fallback
  }

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(installmentId)) {
      toast.error('ID cicilan tidak valid')
      router.push('/dashboard/staff/installments')
      return
    }

    try {
      setLoading(true)
      const data = await getPendingInstallmentPaymentDetail(installmentId)
      setDetail(data)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat detail pembayaran cicilan'))
      router.push('/dashboard/staff/installments')
    } finally {
      setLoading(false)
    }
  }, [installmentId, router])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleApprove = async () => {
    if (!detail) return
    try {
      setSubmitting(true)
      await verifyPendingInstallmentPayment(detail.id, { action: 'approve' })
      toast.success('Pembayaran cicilan berhasil disetujui')
      router.push('/dashboard/staff/installments')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal menyetujui pembayaran cicilan'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!detail) return
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    try {
      setSubmitting(true)
      await verifyPendingInstallmentPayment(detail.id, {
        action: 'reject',
        rejection_reason: rejectionReason.trim(),
      })
      toast.success('Pembayaran cicilan berhasil ditolak')
      router.push('/dashboard/staff/installments')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal menolak pembayaran cicilan'))
    } finally {
      setSubmitting(false)
    }
  }

  const canVerify = detail?.status === 'PENDING'

  const headerTitle = useMemo(() => {
    if (!detail) return 'Pembayaran Cicilan'

    return (
      <span className="text-sm font-normal" style={{ fontFamily: 'Inter, sans-serif', color: '#8E99A8' }}>
        <Link href="/dashboard/staff/installments" className="hover:underline">
          Pembayaran Cicilan
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/dashboard/staff/loans/${detail.loan_pk}/detail`} className="hover:underline">
          {detail.loan_id}
        </Link>
        <span className="mx-2">›</span>
        <span className="font-semibold" style={{ color: '#242F43' }}>
          Bulan {detail.installment_number}
        </span>
      </span>
    )
  }, [detail])

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-0001">
      <DashboardHeader
        variant="default"
        title={headerTitle}
      />

      <main className="flex-1 p-8 bg-[#F8FAFC] min-h-screen">
        {loading ? (
          <section className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <p className="text-gray-600">Memuat detail...</p>
          </section>
        ) : detail ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[32px] font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Detail Verifikasi: #{detail.loan_id}
              </h1>
              <span
                className="inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-md"
                style={{
                  backgroundColor: detail.status === 'PENDING' ? '#FEF3C7' : detail.status === 'PAID' ? '#D1FAE5' : '#FEE2E2',
                  color: detail.status === 'PENDING' ? '#92400E' : detail.status === 'PAID' ? '#065F46' : '#991B1B',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {detail.status === 'PENDING' ? 'MENUNGGU VERIFIKASI' : detail.status === 'PAID' ? 'TERVERIFIKASI' : 'DITOLAK'}
              </span>
            </div>

            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Diterima pada {formatDateTime(detail.submitted_at)}
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 bg-white rounded-2xl p-4" style={{ border: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base flex items-center gap-2" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                    <FileText size={16} /> Bukti Transfer yang Diunggah
                  </h3>
                  {detail.transfer_proof_url && (
                    <a
                      href={detail.transfer_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: '#11447D' }}
                    >
                      Buka <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                <div className="rounded-xl p-4" style={{ border: '1px dashed #D1D5DB', minHeight: 520, backgroundColor: '#FAFAFA' }}>
                  {detail.transfer_proof_url ? (
                    detail.transfer_proof_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="h-full flex items-center justify-center">
                        <a
                          href={detail.transfer_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                          style={{ border: '1px solid #D1D5DB', color: '#11447D', backgroundColor: '#FFFFFF' }}
                        >
                          <FileText size={16} /> Buka Bukti PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={detail.transfer_proof_url}
                        alt="Transfer Receipt"
                        className="w-full h-full object-contain rounded-lg"
                        style={{ maxHeight: 480 }}
                      />
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: '#9CA3AF' }}>
                      Bukti transfer tidak tersedia.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                    <UserRound size={16} /> Data yang Diisi Anggota
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs" style={{ color: '#8E99A8' }}>
                    <div>
                      <p>NAMA LENGKAP</p>
                      <p className="font-semibold text-sm mt-1" style={{ color: '#242F43' }}>{detail.member_name}</p>
                    </div>
                    <div>
                      <p>ID PINJAMAN</p>
                      <p className="font-semibold text-sm mt-1" style={{ color: '#242F43' }}>{detail.loan_id}</p>
                    </div>
                    <div>
                      <p>ID ANGGOTA</p>
                      <p className="font-semibold text-sm mt-1" style={{ color: '#242F43' }}>{detail.member_id || '-'}</p>
                    </div>
                    <div>
                      <p>TGL SUBMIT</p>
                      <p className="font-semibold text-sm mt-1" style={{ color: '#242F43' }}>{formatDateTime(detail.submitted_at)}</p>
                    </div>
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <p className="text-xs" style={{ color: '#8E99A8' }}>NOMINAL PAID</p>
                    <p className="text-[40px] leading-none font-bold mt-1" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
                      {formatCurrency(detail.amount)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
                  <h3 className="font-semibold text-base mb-4 flex items-center gap-2" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                    <Calculator size={16} /> Perhitungan Otomatis Sistem
                  </h3>

                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#F9FAFB' }}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#6B7280' }}>Porsi Pokok</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>{formatCurrency(detail.principal_component)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#6B7280' }}>Bunga &amp; Biaya</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>{formatCurrency(detail.interest_component)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                      <span className="text-xs font-bold" style={{ color: '#8E99A8' }}>TOTAL KREDIT</span>
                      <span className="text-2xl font-bold" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCurrency(detail.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {showRejectInput && (
                  <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #FECACA' }}>
                    <label className="text-xs font-semibold block mb-2" style={{ color: '#991B1B' }}>
                      Alasan Penolakan (wajib)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      rows={3}
                      placeholder="Contoh: nominal tidak sesuai bukti transfer"
                      className="w-full p-3 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #FECACA', backgroundColor: '#FFF1F2' }}
                    />
                  </div>
                )}

                <button
                  onClick={handleApprove}
                  disabled={submitting || !canVerify}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#111827' }}
                >
                  Konfirmasi &amp; Update Saldo
                </button>

                <button
                  onClick={handleReject}
                  disabled={submitting || !canVerify}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ border: '1px solid #D1D5DB', color: '#6B7280', backgroundColor: '#FFFFFF' }}
                >
                  Tolak Bukti
                </button>

                {!canVerify && (
                  <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                    Pembayaran ini sudah diproses ({detail.status_display}).
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </DashboardLayout>
  )
}
