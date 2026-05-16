'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  createResignationRequest,
  getResignationSettlement,
  getMyResignation,
  type ResignationSettlement,
  type ResignationRequestDetail,
} from '@/lib/resignations-api'
import api from '@/lib/axios'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDateLong = (date: Date) =>
  date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu Review Manajer' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', label: 'Disetujui' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Ditolak' },
  RESIGNED: { bg: '#F1F5F9', text: '#525E71', label: 'Akun Sudah Ditutup' },
}

const PiggyIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#11447D" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
  </svg>
)

const LoanIconLine = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#525E71" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

const InfoIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
)

export default function MemberResignationsPage() {
  const [settlement, setSettlement] = useState<ResignationSettlement | null>(null)
  const [existing, setExisting] = useState<ResignationRequestDetail | null>(null)
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [settlementData, myData] = await Promise.all([
          getResignationSettlement(),
          getMyResignation(),
        ])
        setSettlement(settlementData)
        setExisting(myData.request)
      } catch (err) {
        console.error('Gagal memuat data resignation', err)
        setError('Gagal memuat data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
      try {
        const profileData = await api.get('/members/profile/').then((r) => r.data)
        setProfile(profileData)
      } catch {
        // profile failure is non-fatal
      }
    }
    load()
  }, [])

  const handleConfirm = async () => {
    if (!settlement) return

    if (!settlement.can_resign) {
      toast.error('Total pinjaman melebihi total simpanan. Lunasi pinjaman terlebih dahulu.')
      return
    }

    if (!agreed) {
      toast.error('Mohon centang persetujuan syarat dan ketentuan.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createResignationRequest()
      setExisting(result)
      setAgreed(false)
      toast.success('Permintaan penutupan akun berhasil dikirim.')
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Gagal mengirim permintaan penutupan akun.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const userName = profile?.full_name || 'Anggota'
  const hasActiveRequest = !!existing && (existing.status === 'PENDING' || existing.status === 'APPROVED' || existing.status === 'RESIGNED')

  return (
    <DashboardLayout role="MEMBER" userName={userName}>
      <DashboardHeader variant="default" title="Penutupan Akun" />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2
              className="font-bold text-2xl"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Ringkasan Penyelesaian Akhir
            </h2>
            <p
              className="text-sm mt-2 max-w-xl"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Tinjau rincian simpanan dan pinjaman Anda di bawah ini. Pastikan semua data sudah benar
              sebelum melakukan konfirmasi akhir penutupan akun koperasi.
            </p>
          </div>

          {loading ? (
            <div
              className="bg-white rounded-2xl p-12 text-center text-sm"
              style={{ border: '1px solid #F1F5F9', color: '#8E99A8' }}
            >
              Memuat ringkasan...
            </div>
          ) : error ? (
            <div
              className="bg-white rounded-2xl p-8 text-center text-sm"
              style={{ border: '1px solid #FECACA', color: '#991B1B' }}
            >
              {error}
            </div>
          ) : settlement ? (
            <>
              {/* Status banner kalau sudah ada pengajuan */}
              {existing && (
                <div
                  className="bg-white rounded-2xl p-6"
                  style={{ border: '1px solid #F1F5F9' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p
                        className="text-xs font-semibold tracking-wider uppercase mb-2"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                      >
                        Status Pengajuan Anda
                      </p>
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
                        style={{
                          backgroundColor: STATUS_BADGE[existing.status]?.bg ?? '#F3F4F6',
                          color: STATUS_BADGE[existing.status]?.text ?? '#6B7280',
                        }}
                      >
                        {STATUS_BADGE[existing.status]?.label ?? existing.status_display}
                      </span>
                      <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        Diajukan pada {fmtDate(existing.submitted_at)}
                        {existing.reviewed_at && ` • Direview pada ${fmtDate(existing.reviewed_at)}`}
                      </p>
                    </div>
                  </div>

                  {existing.status === 'REJECTED' && existing.rejection_reason && (
                    <div
                      className="mt-4 rounded-xl px-4 py-3 text-sm"
                      style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                    >
                      <span className="font-bold">Alasan penolakan: </span>
                      {existing.rejection_reason}
                    </div>
                  )}
                </div>
              )}

              <div
                className="bg-white rounded-2xl p-8"
                style={{ border: '1px solid #F1F5F9' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                  <h3
                    className="font-bold text-base"
                    style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Rincian Keuangan
                  </h3>
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#F1F5F9', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                  >
                    Per Tanggal: {fmtDateLong(new Date())}
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Total Simpanan dengan breakdown */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#EFF6FF' }}
                        >
                          <PiggyIcon />
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                          >
                            Total Simpanan
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                          >
                            Simpanan Pokok, Wajib, & Sukarela
                          </p>
                        </div>
                      </div>
                      <p
                        className="text-base font-bold whitespace-nowrap"
                        style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {fmtRp(settlement.total_savings)}
                      </p>
                    </div>

                    {/* Breakdown rincian simpanan */}
                    <div className="mt-3 space-y-2" style={{ paddingLeft: '52px' }}>
                      {[
                        { label: 'Simpanan Pokok', value: settlement.total_pokok },
                        { label: 'Simpanan Wajib', value: settlement.total_wajib },
                        { label: 'Simpanan Sukarela', value: settlement.total_sukarela },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center text-sm">
                          <span style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                            • {label}
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {fmtRp(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#F1F5F9' }}
                      >
                        <LoanIconLine />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          Total Pinjaman
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                        >
                          Sisa pinjaman berjalan & bunga
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-base font-bold whitespace-nowrap"
                      style={{ color: '#525E71', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      ({fmtRp(settlement.total_loan_outstanding)})
                    </p>
                  </div>

                  <div style={{ borderTop: '1px dashed #E5E7EB' }} className="pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p
                          className="text-[10px] uppercase font-bold tracking-widest"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                        >
                          Estimasi Payout
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                        >
                          Total dana yang akan dikembalikan ke rekening Anda
                        </p>
                      </div>
                      <p
                        className="text-2xl font-bold whitespace-nowrap"
                        style={{
                          color: settlement.can_resign ? '#242F43' : '#991B1B',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        {fmtRp(settlement.estimated_payout)}
                      </p>
                    </div>
                  </div>

                  {!settlement.can_resign && (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
                    >
                      Total pinjaman Anda melebihi total simpanan. Pengajuan penutupan akun tidak dapat
                      diproses sebelum kewajiban pinjaman dipenuhi.
                    </div>
                  )}

                  {existing?.status === 'PENDING' && (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
                    >
                      Anda sudah memiliki pengajuan penutupan akun yang sedang menunggu persetujuan manajer.
                    </div>
                  )}

                  {(existing?.status === 'APPROVED' || existing?.status === 'RESIGNED') && (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{ backgroundColor: '#F1F5F9', color: '#242F43', border: '1px solid #E5E7EB' }}
                    >
                      Pengajuan penutupan akun sebelumnya sudah disetujui dan sedang diproses.
                    </div>
                  )}
                </div>

                {!hasActiveRequest && (
                  <div style={{ borderTop: '1px solid #F1F5F9' }} className="pt-6 mt-8 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        disabled={!settlement.can_resign}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300 disabled:cursor-not-allowed"
                      />
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                      >
                        Saya menyetujui <span className="underline font-semibold">syarat dan ketentuan</span>{' '}
                        penutupan akun. Saya memahami bahwa tindakan ini tidak dapat dibatalkan setelah diproses.
                      </span>
                    </label>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAgreed(false)
                        }}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting || !agreed || !settlement.can_resign}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#242F43' }}
                      >
                        {submitting ? 'Memproses...' : 'Konfirmasi Resign'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl p-4 flex items-start gap-3 text-xs"
                style={{ backgroundColor: '#F1F5F9', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
              >
                <span className="mt-0.5" style={{ color: '#8E99A8' }}>
                  <InfoIcon />
                </span>
                <p>
                  Ada pertanyaan mengenai perhitungan di atas? Hubungi Admin Koperasi melalui
                  email <a href="mailto:propensi.ksb@gmail.com" className="font-semibold underline">propensi.ksb@gmail.com</a>.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  )
}
