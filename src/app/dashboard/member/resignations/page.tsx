'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { logout } from '@/lib/auth'
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
  PENDING:  { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu Persetujuan Manajer' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', label: 'Disetujui — Menunggu Pencairan' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Ditolak' },
  RESIGNED: { bg: '#F1F5F9', text: '#525E71', label: 'Akun Telah Ditutup' },
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

const CheckCircleIcon = () => (
  <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DoorIcon = () => (
  <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#525E71" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21M3 13.125V21h18v-7.875M19.5 9.75V21M4.5 21V9.75m0 0L12 3l7.5 6.75" />
  </svg>
)

/**
 * Auto-logout banner shown when the member's account is fully closed (RESIGNED).
 * Counts down then forcibly clears the session, mimicking Instagram-style deact UX.
 */
function ResignedNotice({ memberName }: { memberName: string }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) {
      logout().finally(() => router.push('/'))
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F8FAFC' }}>
      <div
        className="bg-white rounded-2xl p-10 max-w-md w-full text-center"
        style={{ border: '1px solid #F1F5F9', boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)' }}
      >
        <div className="flex justify-center mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <DoorIcon />
          </div>
        </div>
        <h2
          className="font-bold text-2xl mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
        >
          Akun Anda Telah Ditutup
        </h2>
        <p className="text-sm mb-6" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
          Halo {memberName}, pengajuan penutupan akun Anda telah diselesaikan dan dana
          pengembalian sudah dicairkan oleh petugas. Anda akan otomatis keluar dari sistem.
        </p>
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: '#F1F5F9', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
        >
          Keluar otomatis dalam <span className="font-bold">{countdown}</span> detik...
        </div>
        <button
          type="button"
          onClick={() => {
            logout().finally(() => router.push('/'))
          }}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white w-full"
          style={{ backgroundColor: '#242F43' }}
        >
          Keluar Sekarang
        </button>
      </div>
    </div>
  )
}

export default function MemberResignationsPage() {
  const [settlement, setSettlement] = useState<ResignationSettlement | null>(null)
  const [existing, setExisting] = useState<ResignationRequestDetail | null>(null)
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const CHECKLIST = [
    'Saya ingin menutup akun dan menerima estimasi pengembalian dana.',
    'Saya telah memeriksa rincian simpanan dan pinjaman di atas dan setuju dengan jumlahnya.',
    'Saya memahami bahwa penutupan akun tidak dapat dibatalkan setelah diproses.',
  ]
  const [checkedList, setCheckedList] = useState<boolean[]>(() => new Array(CHECKLIST.length).fill(false))
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

    const allChecked = checkedList.every(Boolean)
    if (!allChecked) {
      toast.error('Mohon centang semua pernyataan sebelum melanjutkan.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createResignationRequest()
      setExisting(result)
      setCheckedList(new Array(CHECKLIST.length).fill(false))
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

  const userName = profile?.full_name || settlement?.member_name || 'Anggota'

  // ── Full-screen states ────────────────────────────────────────────────────
  // RESIGNED = account fully closed. Force a logout flow.
  if (!loading && existing?.status === 'RESIGNED') {
    return <ResignedNotice memberName={userName} />
  }

  // User is logged in but has no Member row — not eligible at all.
  const notAMember = !loading && settlement && settlement.is_member === false

  const hasActiveRequest =
    !!existing && (existing.status === 'PENDING' || existing.status === 'APPROVED')

  // For PENDING/APPROVED, prefer the snapshot taken at submission time, since
  // live settlement values can shift (e.g. installments paid, savings drained).
  const display = existing && hasActiveRequest
    ? {
        total_pokok: existing.total_pokok_snapshot,
        total_wajib: existing.total_wajib_snapshot,
        total_sukarela: existing.total_sukarela_snapshot,
        total_savings: existing.total_savings_snapshot,
        total_loan_outstanding: existing.total_loan_outstanding_snapshot,
        estimated_payout: existing.estimated_payout,
      }
    : settlement
      ? {
          total_pokok: settlement.total_pokok,
          total_wajib: settlement.total_wajib,
          total_sukarela: settlement.total_sukarela,
          total_savings: settlement.total_savings,
          total_loan_outstanding: settlement.total_loan_outstanding,
          estimated_payout: settlement.estimated_payout,
        }
      : null

  // Page title/subtitle adapt to current state so the heading isn't misleading.
  const heading = (() => {
    if (existing?.status === 'PENDING') return 'Pengajuan Penutupan Akun Sedang Direview'
    if (existing?.status === 'APPROVED') return 'Pengajuan Disetujui'
    if (existing?.status === 'REJECTED') return 'Pengajuan Sebelumnya Ditolak'
    return 'Ringkasan Penyelesaian Akhir'
  })()
  const subheading = (() => {
    if (existing?.status === 'PENDING')
      return 'Pengajuan Anda telah dikirim ke manajer dan sedang menunggu persetujuan. Anda akan mendapat notifikasi setelah ada keputusan.'
    if (existing?.status === 'APPROVED')
      return 'Pengajuan Anda telah disetujui oleh manajer. Petugas akan segera mencairkan dana pengembalian ke rekening Anda.'
    if (existing?.status === 'REJECTED')
      return 'Pengajuan sebelumnya ditolak. Anda dapat mengajukan ulang setelah meninjau alasan penolakan di bawah.'
    return 'Tinjau rincian simpanan dan pinjaman Anda di bawah ini. Pastikan semua data sudah benar sebelum melakukan konfirmasi akhir penutupan akun koperasi.'
  })()

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
              {heading}
            </h2>
            <p
              className="text-sm mt-2 max-w-xl"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              {subheading}
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
          ) : notAMember ? (
            <div
              className="bg-white rounded-2xl p-8 text-center text-sm"
              style={{ border: '1px solid #F1F5F9', color: '#525E71' }}
            >
              Akun Anda belum terdaftar sebagai anggota koperasi, sehingga tidak dapat mengajukan
              penutupan akun. Silakan hubungi admin koperasi jika ini tidak sesuai.
            </div>
          ) : display ? (
            <>
              {/* Approved success banner */}
              {existing?.status === 'APPROVED' && (
                <div
                  className="bg-white rounded-2xl p-6 flex items-start gap-4"
                  style={{ border: '1px solid #D1FAE5', backgroundColor: '#F0FDF4' }}
                >
                  <CheckCircleIcon />
                  <div>
                    <p
                      className="font-bold text-base"
                      style={{ color: '#065F46', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Pengajuan Anda Disetujui Manajer
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: '#047857', fontFamily: 'Inter, sans-serif' }}
                    >
                      Petugas akan segera mencairkan dana sebesar {fmtRp(display.estimated_payout)}{' '}
                      ke rekening Anda. Akun Anda akan ditutup otomatis setelah pencairan selesai.
                      Anda tidak perlu melakukan tindakan apa pun di halaman ini.
                    </p>
                  </div>
                </div>
              )}

              {/* Status badge card (shown for any existing request) */}
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
                    {hasActiveRequest && existing
                      ? `Snapshot per ${fmtDate(existing.submitted_at)}`
                      : `Per Tanggal: ${fmtDateLong(new Date())}`}
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
                        {fmtRp(display.total_savings)}
                      </p>
                    </div>

                    {/* Breakdown rincian simpanan */}
                    <div className="mt-3 space-y-2" style={{ paddingLeft: '52px' }}>
                      {[
                        { label: 'Simpanan Pokok', value: display.total_pokok },
                        { label: 'Simpanan Wajib', value: display.total_wajib },
                        { label: 'Simpanan Sukarela', value: display.total_sukarela },
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
                      ({fmtRp(display.total_loan_outstanding)})
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
                          color:
                            hasActiveRequest || (settlement && settlement.can_resign)
                              ? '#242F43'
                              : '#991B1B',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        {fmtRp(display.estimated_payout)}
                      </p>
                    </div>
                  </div>

                  {/* Live-state warnings — only relevant when no active request */}
                  {!hasActiveRequest && settlement && !settlement.can_resign && (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
                    >
                      Total pinjaman Anda melebihi total simpanan. Pengajuan penutupan akun tidak dapat
                      diproses sebelum kewajiban pinjaman dipenuhi.
                    </div>
                  )}
                </div>

                {/* Confirmation form: only shown when there's no active request */}
                {!hasActiveRequest && settlement && (
                  <div style={{ borderTop: '1px solid #F1F5F9' }} className="pt-6 mt-8 space-y-4">
                    <div className="space-y-3">
                      {CHECKLIST.map((text, idx) => (
                        <label key={idx} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checkedList[idx]}
                            onChange={(e) => {
                              const next = [...checkedList]
                              next[idx] = e.target.checked
                              setCheckedList(next)
                            }}
                            disabled={!settlement.can_resign}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 disabled:cursor-not-allowed"
                          />
                          <span
                            className="text-sm leading-relaxed"
                            style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                          >
                            {text}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckedList(new Array(CHECKLIST.length).fill(false))}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting || !checkedList.every(Boolean) || !settlement.can_resign}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#242F43' }}
                      >
                        {submitting ? 'Memproses...' : 'Konfirmasi Penutupan Akun'}
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
