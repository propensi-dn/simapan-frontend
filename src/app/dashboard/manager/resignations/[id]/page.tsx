'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getManagerResignationDetail,
  reviewManagerResignation,
  type ManagerResignationDetailResponse,
} from '@/lib/resignations-api'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  APPROVED: { bg: '#DBEAFE', text: '#1E40AF' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
  RESIGNED: { bg: '#F1F5F9', text: '#525E71' },
}

export default function ManagerResignationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [detail, setDetail] = useState<ManagerResignationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getManagerResignationDetail(Number(id))
        setDetail(data)
      } catch {
        setError('Gagal memuat detail pengajuan.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!detail) return
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Mohon isi alasan penolakan terlebih dahulu.')
      return
    }
    setSubmitting(action)
    try {
      const result = await reviewManagerResignation(detail.id, {
        action,
        reason: action === 'reject' ? rejectReason.trim() : undefined,
      })
      toast.success(result.message)
      router.push('/dashboard/manager/resignations')
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Gagal memproses pengajuan.'
      toast.error(message)
    } finally {
      setSubmitting(null)
      setConfirmAction(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="MANAGER" userName="Manajer">
        <DashboardHeader
          variant="detail"
          parentLabel="Resign Approvals"
          parentHref="/dashboard/manager/resignations"
          currentLabel="Detail"
        />
        <div className="p-12 text-center text-sm" style={{ color: '#8E99A8' }}>
          Memuat detail pengajuan...
        </div>
      </DashboardLayout>
    )
  }

  if (error || !detail) {
    return (
      <DashboardLayout role="MANAGER" userName="Manajer">
        <DashboardHeader
          variant="detail"
          parentLabel="Resign Approvals"
          parentHref="/dashboard/manager/resignations"
          currentLabel="Detail"
        />
        <div className="p-12 text-center text-sm" style={{ color: '#EF4444' }}>
          {error || 'Pengajuan tidak ditemukan.'}
        </div>
      </DashboardLayout>
    )
  }

  const st = STATUS_BADGE[detail.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
  const isPending = detail.status === 'PENDING'

  return (
    <DashboardLayout role="MANAGER" userName="Manajer">
      <DashboardHeader
        variant="detail"
        parentLabel="Resign Approvals"
        parentHref="/dashboard/manager/resignations"
        currentLabel={detail.member_name}
      />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Detail Pengajuan Penutupan Akun
          </h2>
          <p
            className="text-sm"
            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
          >
            Tinjau rincian permintaan penutupan akun anggota dan kalkulasi settlement final.
          </p>
        </div>

        <div
          className="bg-white rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ border: '1px solid #F1F5F9' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#525E71" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <div>
              <p
                className="font-bold text-lg"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                {detail.member_name}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: '#8E99A8' }}>
                <span>ID: {detail.member_id || '-'}</span>
                <span>•</span>
                <span>Diajukan: {fmtDate(detail.request_date)}</span>
              </div>
            </div>
          </div>
          <div>
            <p
              className="text-[10px] uppercase font-bold tracking-widest text-right"
              style={{ color: '#8E99A8' }}
            >
              Status
            </p>
            <span
              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold mt-1"
              style={{ backgroundColor: st.bg, color: st.text }}
            >
              {detail.status_display}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-bold text-base"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                1. Bagian Simpanan
              </h3>
              <span
                className="text-[10px] uppercase font-bold tracking-widest"
                style={{ color: '#8E99A8' }}
              >
                Total Simpanan
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#525E71' }}>
                  Simpanan Pokok
                </span>
                <span className="text-sm font-semibold" style={{ color: '#242F43' }}>
                  {fmtRp(detail.snapshot.total_pokok)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#525E71' }}>
                  Simpanan Wajib
                </span>
                <span className="text-sm font-semibold" style={{ color: '#242F43' }}>
                  {fmtRp(detail.snapshot.total_wajib)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#525E71' }}>
                  Simpanan Sukarela
                </span>
                <span className="text-sm font-semibold" style={{ color: '#242F43' }}>
                  {fmtRp(detail.snapshot.total_sukarela)}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-3 mt-3"
                style={{ borderTop: '1px solid #F1F5F9' }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                >
                  Sub-total Simpanan
                </span>
                <span
                  className="text-base font-bold"
                  style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                >
                  {fmtRp(detail.snapshot.total_savings)}
                </span>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-bold text-base"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                2. Bagian Pinjaman
              </h3>
              <span
                className="text-[10px] uppercase font-bold tracking-widest"
                style={{ color: '#8E99A8' }}
              >
                Saldo Pinjaman Terutang
              </span>
            </div>
            {detail.loan_history.filter((l) => Number(l.outstanding_balance) > 0).length === 0 ? (
              <p className="text-sm" style={{ color: '#8E99A8' }}>
                Tidak ada pinjaman dengan saldo terutang.
              </p>
            ) : (
              <div className="space-y-3">
                {detail.loan_history
                  .filter((l) => Number(l.outstanding_balance) > 0)
                  .map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#525E71' }}>
                        {loan.loan_id} ({loan.status_display})
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#242F43' }}>
                        {fmtRp(loan.outstanding_balance)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div
              className="flex items-center justify-between pt-3 mt-3"
              style={{ borderTop: '1px solid #F1F5F9' }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                Sub-total Pinjaman
              </span>
              <span
                className="text-base font-bold"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                {fmtRp(detail.snapshot.total_loan_outstanding)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)' }}
        >
          <p
            className="text-[10px] uppercase font-bold tracking-widest text-center mb-5"
            style={{ color: '#9CA3AF' }}
          >
            Kalkulasi Penyelesaian Akhir
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#9CA3AF' }}>
                Total Simpanan
              </p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {fmtRp(detail.snapshot.total_savings)}
              </p>
            </div>
            <span className="text-2xl" style={{ color: '#9CA3AF' }}>
              −
            </span>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#9CA3AF' }}>
                Total Pinjaman
              </p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {fmtRp(detail.snapshot.total_loan_outstanding)}
              </p>
            </div>
            <span className="text-2xl" style={{ color: '#9CA3AF' }}>
              =
            </span>
            <div className="rounded-xl px-5 py-3 text-center" style={{ backgroundColor: '#374151' }}>
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#9CA3AF' }}>
                Estimasi Payout Final
              </p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {fmtRp(detail.snapshot.estimated_payout)}
              </p>
            </div>
          </div>
          <p className="text-xs text-center mt-5" style={{ color: '#9CA3AF' }}>
            Calculation audited and verified by SI-MAPAN ledger engine
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #F1F5F9' }}
        >
          <h3
            className="font-bold text-base mb-4"
            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            3. Riwayat Pinjaman Anggota
          </h3>
          {detail.loan_history.length === 0 ? (
            <p className="text-sm" style={{ color: '#8E99A8' }}>
              Belum ada riwayat pinjaman.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['LOAN ID', 'AMOUNT', 'OUTSTANDING', 'STATUS', 'TANGGAL'].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.loan_history.map((loan, i) => (
                    <tr
                      key={loan.id}
                      style={{ borderBottom: i < detail.loan_history.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: '#242F43' }}>
                        {loan.loan_id}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#242F43' }}>
                        {fmtRp(loan.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#525E71' }}>
                        {fmtRp(loan.outstanding_balance)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md font-bold"
                          style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
                        >
                          {loan.status_display}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#525E71' }}>
                        {fmtDate(loan.application_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #F1F5F9' }}
        >
          <h3
            className="font-bold text-base mb-4"
            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            4. Tindakan Persetujuan
          </h3>

          {!isPending && (
            <div
              className="rounded-xl p-4 mb-4 text-sm"
              style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}
            >
              Pengajuan ini sudah ber-status <strong>{detail.status_display}</strong>
              {detail.reviewed_at ? ` pada ${fmtDate(detail.reviewed_at)}` : ''}
              {detail.rejection_reason ? `. Alasan penolakan: ${detail.rejection_reason}` : '.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold"
                style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
              >
                Alasan Penolakan (Wajib diisi jika menolak)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={!isPending}
                rows={4}
                placeholder="Jelaskan alasan penolakan secara jelas (mis. saldo pinjaman tidak sesuai, dokumen kurang lengkap)..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none disabled:opacity-50"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction('approve')}
                disabled={!isPending || submitting !== null}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#242F43' }}
              >
                {submitting === 'approve' ? 'Memproses...' : 'Setujui Pengajuan'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction('reject')}
                disabled={!isPending || submitting !== null}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                {submitting === 'reject' ? 'Memproses...' : 'Tolak Pengajuan'}
              </button>
            </div>
          </div>

          <p
            className="text-xs mt-5"
            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
          >
            Setelah disetujui, sistem akan memicu alur pencairan dana payout final. Tindakan ini
            tidak dapat dibatalkan setelah diproses.
          </p>
        </div>
      </main>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={() => submitting === null && setConfirmAction(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              className="font-bold text-lg"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
            >
              {confirmAction === 'approve' ? 'Setujui Pengajuan?' : 'Tolak Pengajuan?'}
            </h4>
            <p className="text-sm mt-2" style={{ color: '#525E71' }}>
              {confirmAction === 'approve'
                ? 'Setelah disetujui, pencairan akan diproses dan akun anggota akan dinonaktifkan setelah dana cair. Tindakan ini tidak dapat dibatalkan.'
                : `Anggota akan menerima notifikasi penolakan dengan alasan: "${rejectReason}".`}
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={submitting !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReview(confirmAction)}
                disabled={submitting !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: confirmAction === 'approve' ? '#242F43' : '#DC2626' }}
              >
                {submitting !== null ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
