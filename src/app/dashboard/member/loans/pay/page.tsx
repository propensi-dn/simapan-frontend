'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'
import {
  getPayInfo,
  payInstallmentBankTransfer,
  payInstallmentSavings,
  type PayInfoResponse,
  type PayActiveLoan,
} from '@/lib/loans-api'

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

// ── File Upload Zone ──────────────────────────────────────────────────────

function FileUploadZone({
  file, onFile, error,
}: {
  file: File | null
  onFile: (f: File | null) => void
  error?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold"
        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
        Upload Bukti Transfer <span style={{ color: '#EF4444' }}>*</span>
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="cursor-pointer rounded-xl flex flex-col items-center justify-center gap-2 py-7 transition-all"
        style={{
          border: error ? '1.5px dashed #EF4444' : '1.5px dashed #D1D5DB',
          backgroundColor: file ? '#F0FDF4' : '#FAFAFA',
        }}>
        {file ? (
          <>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: '#065F46' }}>{file.name}</p>
            <p className="text-xs" style={{ color: '#8E99A8' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onFile(null) }}
              className="text-xs font-bold px-3 py-1 rounded-lg"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              Hapus
            </button>
          </>
        ) : (
          <>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: '#525E71' }}>Klik untuk upload</p>
            <p className="text-xs" style={{ color: '#B0BAC5' }}>JPG, PNG, PDF. Maks 5MB</p>
          </>
        )}
        <input ref={ref} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden"
          onChange={e => {
            const f = e.target.files?.[0] ?? null
            onFile(f)
          }} />
      </div>
      {error && <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}

// ── Success Modal ─────────────────────────────────────────────────────────

function SuccessModal({
  message,
  onBackToLoans,
  onViewDetail,
}: {
  message: string
  onBackToLoans: () => void
  onViewDetail: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: '#D1FAE5' }}>
          <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-bold text-xl mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Laporan Pembayaran Terkirim!
        </h3>
        <p className="text-sm mb-6 leading-relaxed"
          style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
          {message}
        </p>
        <button
          onClick={onViewDetail}
          className="w-full py-3 rounded-xl font-bold text-sm mb-2 transition-all hover:opacity-90"
          style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
          Lihat Detail Pinjaman
        </button>
        <button
          onClick={onBackToLoans}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50"
          style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
          Kembali ke Daftar Pinjaman
        </button>
      </div>
    </div>
  )
}

// ── Main Page Content ─────────────────────────────────────────────────────

function PayLoanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryInstallmentId = searchParams.get('installment')

  const [info, setInfo] = useState<PayInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null) // loan.id (not loan_id string)
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'SAVINGS'>('BANK_TRANSFER')
  const [bankAccountId, setBankAccountId] = useState<number | null>(null)
  const [transferProof, setTransferProof] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  // profile for sidebar
  const [profile, setProfile] = useState<{
    full_name: string
    member_id: string | null
    profile_picture: string | null
  } | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(r => setProfile(r.data)).catch(() => {})
  }, [])

  // ── Load pay info ──────────────────────────────────────────
  const load = useCallback(async (instId: number) => {
    setLoading(true); setError('')
    try {
      const data = await getPayInfo(instId)
      setInfo(data)

      // Auto-select the loan of the current installment
      setSelectedLoanId(data.selected_installment.loan_pk)

      // Auto-select primary bank account
      const primary = data.member_bank_accounts.find(b => b.is_primary) ?? data.member_bank_accounts[0]
      if (primary) setBankAccountId(primary.id)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } }
      if (axiosErr.response?.status === 404) {
        setError('Cicilan tidak ditemukan.')
      } else {
        setError(axiosErr.response?.data?.error ?? 'Gagal memuat data pembayaran.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Bootstrap: find installment id ─────────────────────────
  useEffect(() => {
    (async () => {
      // If query param provided, use it
      if (queryInstallmentId) {
        const id = Number(queryInstallmentId)
        if (Number.isNaN(id)) {
          setError('Parameter installment tidak valid.')
          setLoading(false)
          return
        }
        await load(id)
        return
      }

      // Otherwise: find earliest UNPAID installment across active loans
      try {
        const resp = await api.get('/loans/', { params: {} })
        const loans = resp.data?.loans ?? []

        // Try to find one with next_due_date (active/overdue)
        let targetInstallmentId: number | null = null

        for (const lo of loans) {
          if (['ACTIVE', 'OVERDUE'].includes(lo.status)) {
            // fetch detail to get installments
            try {
              const detail = await api.get(`/loans/${lo.id}/`)
              const unpaid = detail.data?.installments?.find(
                (i: { status: string; id: number }) => i.status === 'UNPAID'
              )
              if (unpaid) {
                targetInstallmentId = unpaid.id
                break
              }
            } catch {
              continue
            }
          }
        }

        if (targetInstallmentId) {
          await load(targetInstallmentId)
        } else {
          setError('Tidak ada cicilan yang perlu dibayar saat ini.')
          setLoading(false)
        }
      } catch {
        setError('Gagal memuat data pinjaman.')
        setLoading(false)
      }
    })()
  }, [queryInstallmentId, load])

  // ── Handle change loan selection ───────────────────────────
  const handleChangeLoan = async (loan: PayActiveLoan) => {
    if (!loan.next_installment_id) return
    setSelectedLoanId(loan.id)
    setTransferProof(null)
    setFormErrors({})
    await load(loan.next_installment_id)
  }

  // ── Validate ───────────────────────────────────────────────
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}

    if (!info) return errs

    if (paymentMethod === 'BANK_TRANSFER') {
      if (!transferProof) {
        errs.transfer_proof = 'Bukti transfer wajib diunggah.'
      }
      if (!info.cooperative_bank) {
        errs.coop_bank = 'Rekening koperasi belum dikonfigurasi. Hubungi admin.'
      }
    }

    if (paymentMethod === 'SAVINGS') {
      const amt = Number(info.selected_installment.amount)
      const sukarela = Number(info.savings.total_sukarela)
      if (sukarela < amt) {
        errs.savings = `Saldo simpanan sukarela tidak mencukupi. Saldo: ${fmtRp(sukarela)}, dibutuhkan: ${fmtRp(amt)}.`
      }
    }

    return errs
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!info) return

    const errs = validate()
    if (Object.keys(errs).length) {
      setFormErrors(errs)
      return
    }

    setSubmitting(true)
    setFormErrors({})

    try {
      if (paymentMethod === 'BANK_TRANSFER') {
        const res = await payInstallmentBankTransfer(info.selected_installment.id, {
          transfer_proof: transferProof!,
          bank_account: bankAccountId,
        })
        setSuccessMsg(res.message)
      } else {
        const res = await payInstallmentSavings(info.selected_installment.id)
        setSuccessMsg(res.message)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } }
      const data = axiosErr.response?.data
      if (data && typeof data === 'object') {
        const mapped: Record<string, string> = {}
        Object.entries(data).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? String(v[0]) : String(v)
        })
        setFormErrors(mapped)
      } else {
        setFormErrors({ non_field: 'Gagal mengirim pembayaran. Silakan coba lagi.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  if (loading) {
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
          currentLabel="Bayar Pinjaman"
          notifCount={0}
        />
        <main className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
        </main>
      </DashboardLayout>
    )
  }

  if (error || !info) {
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
          currentLabel="Bayar Pinjaman"
          notifCount={0}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center"
            style={{ border: '1px solid #F1F5F9' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FEE2E2' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Tidak Dapat Memuat Pembayaran
            </h3>
            <p className="text-sm mb-6" style={{ color: '#525E71' }}>
              {error || 'Terjadi kesalahan.'}
            </p>
            <button
              onClick={() => router.push('/dashboard/member/loans')}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
              Kembali ke Daftar Pinjaman
            </button>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  const installmentAmount = Number(info.selected_installment.amount)
  const sukarelaBalance = Number(info.savings.total_sukarela)
  const savingsInsufficient = sukarelaBalance < installmentAmount

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
        currentLabel="Bayar Pinjaman"
        notifCount={0}
      />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Bayar Pinjaman
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Pilih pinjaman, metode pembayaran, lalu kirim laporan pembayaran.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">

            {/* ── LEFT COLUMN ───────────────────────────── */}
            <div className="col-span-2 space-y-6">

              {/* Pilih Pinjaman (radiobutton table) */}
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                    Pilih Pinjaman Aktif
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#8E99A8' }}>
                    Pilih pinjaman yang ingin dibayar cicilannya.
                  </p>
                </div>

                {info.active_loans.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm" style={{ color: '#8E99A8' }}>
                    Tidak ada pinjaman aktif.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['', 'LOAN ID', 'KATEGORI', 'TOTAL', 'SISA', 'STATUS'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {info.active_loans.map((lo, i) => {
                          const canPay = lo.next_installment_id !== null
                          const isSelected = selectedLoanId === lo.id
                          return (
                            <tr key={lo.id}
                              className={`transition-colors ${canPay ? 'hover:bg-[#FAFAFA] cursor-pointer' : 'opacity-50'}`}
                              onClick={() => canPay && handleChangeLoan(lo)}
                              style={{ borderBottom: i < info.active_loans.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                              <td className="px-4 py-3">
                                <input type="radio"
                                  checked={isSelected}
                                  disabled={!canPay}
                                  onChange={() => canPay && handleChangeLoan(lo)}
                                  onClick={e => e.stopPropagation()}
                                  style={{ accentColor: '#242F43' }} />
                              </td>
                              <td className="px-4 py-3 text-sm font-mono font-semibold"
                                style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                                #{lo.loan_id}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#525E71' }}>
                                {lo.category_display}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold"
                                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                                {fmtRp(lo.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold"
                                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                                {fmtRp(lo.outstanding_balance)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: lo.status === 'OVERDUE' ? '#FEE2E2' : '#D1FAE5',
                                    color: lo.status === 'OVERDUE' ? '#991B1B' : '#065F46',
                                  }}>
                                  {lo.status_display}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Nominal angsuran (auto-filled, disabled) */}
              <div className="bg-white rounded-2xl p-6 space-y-4"
                style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Detail Cicilan
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: '#8E99A8' }}>
                      Loan ID
                    </label>
                    <p className="font-mono font-bold text-sm" style={{ color: '#242F43' }}>
                      #{info.selected_installment.loan_id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: '#8E99A8' }}>
                      Cicilan ke-
                    </label>
                    <p className="font-bold text-sm" style={{ color: '#242F43' }}>
                      {info.selected_installment.installment_number}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: '#8E99A8' }}>
                      Due Date Terdekat
                    </label>
                    <p className="font-bold text-sm" style={{ color: '#242F43' }}>
                      {fmtDate(info.selected_installment.due_date)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: '#8E99A8' }}>
                      Nominal Angsuran
                    </label>
                    <input
                      type="text"
                      disabled
                      value={fmtRp(info.selected_installment.amount)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-bold"
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: '#242F43',
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 space-y-4"
                style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Metode Pembayaran
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: paymentMethod === 'BANK_TRANSFER' ? '2px solid #242F43' : '1px solid #E5E7EB',
                      backgroundColor: paymentMethod === 'BANK_TRANSFER' ? '#F8FAFC' : '#FAFAFA',
                    }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => { setPaymentMethod('BANK_TRANSFER'); setFormErrors({}) }}
                      style={{ accentColor: '#242F43', marginTop: 2 }}
                    />
                    <div>
                      <p className="text-sm font-bold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        Transfer Bank
                      </p>
                      <p className="text-xs" style={{ color: '#8E99A8' }}>
                        Transfer ke rekening koperasi, lalu unggah bukti.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: paymentMethod === 'SAVINGS' ? '2px solid #242F43' : '1px solid #E5E7EB',
                      backgroundColor: paymentMethod === 'SAVINGS' ? '#F8FAFC' : '#FAFAFA',
                      opacity: savingsInsufficient ? 0.7 : 1,
                    }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="SAVINGS"
                      checked={paymentMethod === 'SAVINGS'}
                      onChange={() => { setPaymentMethod('SAVINGS'); setFormErrors({}) }}
                      style={{ accentColor: '#242F43', marginTop: 2 }}
                    />
                    <div>
                      <p className="text-sm font-bold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        Potong dari Simpanan Sukarela
                      </p>
                      <p className="text-xs" style={{ color: '#8E99A8' }}>
                        Saldo: {fmtRp(info.savings.total_sukarela)}
                      </p>
                    </div>
                  </label>
                </div>

                {/* ── BANK TRANSFER FIELDS ── */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-4 pt-2">
                    {/* Rekening koperasi tujuan */}
                    {info.cooperative_bank ? (
                      <div className="p-4 rounded-xl"
                        style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#1E40AF' }}>
                          TRANSFER KE REKENING KOPERASI
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs" style={{ color: '#8E99A8' }}>Bank</span>
                            <span className="text-sm font-bold" style={{ color: '#242F43' }}>
                              {info.cooperative_bank.bank_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs" style={{ color: '#8E99A8' }}>No. Rekening</span>
                            <span className="text-sm font-mono font-bold" style={{ color: '#242F43' }}>
                              {info.cooperative_bank.account_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs" style={{ color: '#8E99A8' }}>Atas Nama</span>
                            <span className="text-sm font-bold" style={{ color: '#242F43' }}>
                              {info.cooperative_bank.account_holder}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl text-xs"
                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        Rekening koperasi belum dikonfigurasi. Hubungi admin.
                      </div>
                    )}

                    {/* Bank account member (default primary, bisa pilih lain) */}
                    <div>
                      <label className="block text-sm font-semibold mb-1.5"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        Rekening Pengirim <span className="text-xs font-normal" style={{ color: '#B0BAC5' }}>(opsional)</span>
                      </label>
                      {info.member_bank_accounts.length === 0 ? (
                        <div className="px-4 py-3 rounded-xl text-sm"
                          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                          Anda belum memiliki rekening bank. Tambahkan di{' '}
                          <a href="/dashboard/member/profile" className="font-bold underline">Profile</a>.
                        </div>
                      ) : (
                        <select
                          value={bankAccountId ?? ''}
                          onChange={e => setBankAccountId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                          style={{
                            border: '1px solid #E5E7EB',
                            color: '#242F43',
                            backgroundColor: '#FAFAFA',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                          <option value="">— Pilih rekening pengirim —</option>
                          {info.member_bank_accounts.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.bank_name} — {b.account_number} ({b.account_holder}){b.is_primary ? ' ★' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Upload bukti transfer */}
                    <FileUploadZone
                      file={transferProof}
                      onFile={(f) => {
                        // Client-side validation
                        if (f && f.size > 5 * 1024 * 1024) {
                          setFormErrors(prev => ({ ...prev, transfer_proof: 'Ukuran file maksimal 5MB.' }))
                          return
                        }
                        if (f && !['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)) {
                          setFormErrors(prev => ({ ...prev, transfer_proof: 'Format harus JPG, PNG, atau PDF.' }))
                          return
                        }
                        setTransferProof(f)
                        setFormErrors(prev => ({ ...prev, transfer_proof: '' }))
                      }}
                      error={formErrors.transfer_proof}
                    />
                  </div>
                )}

                {/* ── SAVINGS FIELDS ── */}
                {paymentMethod === 'SAVINGS' && (
                  <div className="pt-2">
                    <div className="p-4 rounded-xl space-y-2"
                      style={{
                        backgroundColor: savingsInsufficient ? '#FEE2E2' : '#F0FDF4',
                        border: `1px solid ${savingsInsufficient ? '#FECACA' : '#A7F3D0'}`,
                      }}>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: '#8E99A8' }}>Saldo Simpanan Sukarela</span>
                        <span className="text-sm font-bold"
                          style={{ color: savingsInsufficient ? '#991B1B' : '#065F46', fontFamily: 'Montserrat, sans-serif' }}>
                          {fmtRp(info.savings.total_sukarela)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: '#8E99A8' }}>Nominal Pembayaran</span>
                        <span className="text-sm font-bold"
                          style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                          − {fmtRp(info.selected_installment.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2"
                        style={{ borderTop: `1px solid ${savingsInsufficient ? '#FECACA' : '#A7F3D0'}` }}>
                        <span className="text-xs font-semibold" style={{ color: '#525E71' }}>Saldo Setelah Bayar</span>
                        <span className="text-sm font-bold"
                          style={{ color: savingsInsufficient ? '#991B1B' : '#065F46', fontFamily: 'Montserrat, sans-serif' }}>
                          {fmtRp(sukarelaBalance - installmentAmount)}
                        </span>
                      </div>
                    </div>

                    {savingsInsufficient && (
                      <p className="text-xs mt-2 font-medium" style={{ color: '#EF4444' }}>
                        Saldo simpanan sukarela tidak mencukupi. Silakan pilih metode transfer bank.
                      </p>
                    )}
                  </div>
                )}

                {/* Error non-field */}
                {formErrors.non_field && (
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B' }}>
                    {formErrors.non_field}
                  </div>
                )}
                {formErrors.error && (
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B' }}>
                    {formErrors.error}
                  </div>
                )}
                {formErrors.savings && (
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B' }}>
                    {formErrors.savings}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button type="button"
                  onClick={() => router.push('/dashboard/member/loans')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-70"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Montserrat, sans-serif' }}>
                  ← Kembali
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
                  {submitting ? 'Mengirim...' : 'Kirim Laporan Pembayaran →'}
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Summary + Payment History ──── */}
            <div className="space-y-5">

              {/* Payment Summary Card */}
              <div className="bg-white rounded-2xl p-6 space-y-4"
                style={{ border: '1px solid #F1F5F9' }}>
                <p className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Ringkasan Pembayaran
                </p>
                <p className="font-bold text-3xl"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  {fmtRp(info.selected_installment.amount)}
                </p>
                <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                  {[
                    { label: 'Loan ID', val: `#${info.selected_installment.loan_id}` },
                    { label: 'Cicilan ke-', val: `${info.selected_installment.installment_number}` },
                    { label: 'Pokok', val: fmtRp(info.selected_installment.principal_component) },
                    { label: 'Bunga', val: fmtRp(info.selected_installment.interest_component) },
                    { label: 'Jatuh Tempo', val: fmtDate(info.selected_installment.due_date) },
                    { label: 'Metode', val: paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Simpanan Sukarela' },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: '#8E99A8' }}>{label}</span>
                      <span className="text-xs font-bold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saldo Simpanan */}
              <div className="bg-white rounded-2xl p-6 space-y-3"
                style={{ border: '1px solid #F1F5F9' }}>
                <p className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Total Simpanan Anda
                </p>
                <p className="font-bold text-2xl"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  {fmtRp(info.savings.total_overall)}
                </p>
                <div className="space-y-1 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#8E99A8' }}>Pokok</span>
                    <span style={{ color: '#242F43', fontWeight: 600 }}>{fmtRp(info.savings.total_pokok)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#8E99A8' }}>Wajib</span>
                    <span style={{ color: '#242F43', fontWeight: 600 }}>{fmtRp(info.savings.total_wajib)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#8E99A8' }}>Sukarela</span>
                    <span style={{ color: '#065F46', fontWeight: 700 }}>{fmtRp(info.savings.total_sukarela)}</span>
                  </div>
                </div>
              </div>

              {/* Riwayat Pembayaran */}
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <p className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Riwayat Pembayaran
                  </p>
                </div>
                {info.payment_history.length === 0 ? (
                  <p className="px-5 py-6 text-center text-xs" style={{ color: '#B0BAC5' }}>
                    Belum ada pembayaran.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
                    {info.payment_history.slice(0, 5).map(h => (
                      <div key={h.id} className="px-5 py-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold" style={{ color: '#242F43' }}>
                            Cicilan #{h.installment_number}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor:
                                h.status === 'PAID' ? '#D1FAE5' :
                                h.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                              color:
                                h.status === 'PAID' ? '#065F46' :
                                h.status === 'PENDING' ? '#92400E' : '#991B1B',
                            }}>
                            {h.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: '#8E99A8' }}>
                            {h.submitted_at ? fmtDate(h.submitted_at) : '—'}
                          </span>
                          <span style={{ color: '#242F43', fontWeight: 600 }}>
                            {fmtRp(h.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </form>
      </main>

      {successMsg && (
        <SuccessModal
          message={successMsg}
          onBackToLoans={() => router.push('/dashboard/member/loans')}
          onViewDetail={() =>
            router.push(`/dashboard/member/loans/${info.selected_installment.loan_pk}`)
          }
        />
      )}
    </DashboardLayout>
  )
}

// ── Page wrapper with Suspense (required for useSearchParams) ─────────────

export default function PayLoanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
      </div>
    }>
      <PayLoanPageContent />
    </Suspense>
  )
}