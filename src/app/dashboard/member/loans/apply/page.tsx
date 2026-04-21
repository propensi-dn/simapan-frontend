'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'
import {
  getLoanFormData,
  createLoan,
  type BankAccount,
  type LoanCategory,
  type LoanFormData,
  type LoanSimulation,
} from '@/lib/loans-api'

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtRp = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(v)

const TENOR_CHOICES = [6, 12, 24, 36]
const INTEREST_RATE = 0.005

function simulate(amount: number, tenor: number): LoanSimulation {
  const interestPerMonth = amount * INTEREST_RATE
  const principalPerMonth = amount / tenor
  const monthlyInstallment = principalPerMonth + interestPerMonth
  const totalInterest = interestPerMonth * tenor
  return {
    principal: amount,
    interest_rate: 0.5,
    interest_per_month: interestPerMonth,
    principal_per_month: principalPerMonth,
    monthly_installment: monthlyInstallment,
    total_interest: totalInterest,
    total_repayment: amount + totalInterest,
    tenor,
  }
}

// ── File Upload Zone ──────────────────────────────────────────────────────

function FileUploadZone({
  label, accept, hint, file, onFile, error,
}: {
  label: string
  accept: string
  hint: string
  file: File | null
  onFile: (f: File | null) => void
  error?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold"
        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="cursor-pointer rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all"
        style={{
          border: error ? '1.5px dashed #EF4444' : '1.5px dashed #D1D5DB',
          backgroundColor: file ? '#F0FDF4' : '#FAFAFA',
        }}>
        {file ? (
          <>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              Remove
            </button>
          </>
        ) : (
          <>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: '#525E71' }}>Unggah File</p>
            <p className="text-xs" style={{ color: '#B0BAC5' }}>{hint}</p>
          </>
        )}
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={e => onFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ApplyLoanPage() {
  const router = useRouter()

  const [formData,   setFormData]   = useState<LoanFormData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)

  // form state
  const [amount,          setAmount]          = useState('')
  const [tenor,           setTenor]           = useState<number>(12)
  const [category,        setCategory]        = useState<LoanCategory | ''>('')
  const [description,     setDescription]     = useState('')
  const [bankAccountId,   setBankAccountId]   = useState<number | null>(null)
  const [collateralImage, setCollateralImage] = useState<File | null>(null)
  const [salarySlip,      setSalarySlip]      = useState<File | null>(null)

  // errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // profile for sidebar
  const [profile, setProfile] = useState<{ full_name: string; member_id: string | null; profile_picture: string | null } | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(r => setProfile(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    getLoanFormData()
      .then(data => {
        setFormData(data)
        const primary = data.bank_accounts.find(b => b.is_primary)
        if (primary) setBankAccountId(primary.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // live simulation
  const amountNum = Number(amount.replace(/\D/g, ''))
  const sim = amountNum >= 1_000_000 ? simulate(amountNum, tenor) : null

  function validate() {
    const errs: Record<string, string> = {}
    if (!amountNum || amountNum < 1_000_000) errs.amount = 'Minimal pinjaman Rp 1.000.000'
    if (amountNum > 50_000_000) errs.amount = 'Maksimal pinjaman Rp 50.000.000'
    if (!category) errs.category = 'Kategori pinjaman wajib dipilih'
    if (!bankAccountId) errs.bank_account = 'Rekening bank wajib dipilih'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await createLoan({
        category:         category as LoanCategory,
        amount:           amountNum,
        tenor,
        description,
        bank_account:     bankAccountId!,
        collateral_image: collateralImage ?? undefined,
        salary_slip:      salarySlip ?? undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const mapped: Record<string, string> = {}
        Object.entries(data).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] as string : String(v)
        })
        setErrors(mapped)
      } else {
        setErrors({ non_field: 'Pengajuan gagal. Silakan coba lagi.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
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
          currentLabel="Ajukan Pinjaman"
          notifCount={0}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center"
            style={{ border: '1px solid #F1F5F9' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#D1FAE5' }}>
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Pengajuan Berhasil Dikirim!
            </h3>
            <p className="text-sm mb-6" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Pengajuan pinjaman Anda sedang menunggu verifikasi. Proses biasanya membutuhkan 1–3 hari kerja.
            </p>
            <button
              onClick={() => router.push('/dashboard/member/loans')}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
              Kembali ke Loan Overview
            </button>
          </div>
        </main>
      </DashboardLayout>
    )
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
        currentLabel="Ajukan Pinjaman"
        notifCount={0}
      />

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-bold text-2xl mb-1"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Ajukan Pinjaman Baru
            </h2>
            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Lengkapi data berikut untuk pengajuan kredit anggota Anda.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-6">

              {/* ── LEFT: Form ──────────────────────────────── */}
              <div className="col-span-2 space-y-6">

                {/* Detail Pinjaman */}
                <div className="bg-white rounded-2xl p-8 space-y-5"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8E99A8" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="font-bold text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Detail Pinjaman
                    </h3>
                  </div>

                  {/* Amount + Tenor */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        Jumlah Pinjaman <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                          style={{ color: '#8E99A8' }}>Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="10.000.000"
                          value={amount}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '')
                            setAmount(raw ? Number(raw).toLocaleString('id-ID') : '')
                            setErrors(prev => ({ ...prev, amount: '' }))
                          }}
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                          style={{
                            border: errors.amount ? '1px solid #EF4444' : '1px solid #E5E7EB',
                            color: '#242F43', backgroundColor: '#FAFAFA',
                            fontFamily: 'Montserrat, sans-serif',
                          }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: '#B0BAC5' }}>
                        MIN: Rp 1.000.000 | MAX: Rp 50.000.000
                      </p>
                      {errors.amount && (
                        <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{errors.amount}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        Tenor (Bulan) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {TENOR_CHOICES.map(t => (
                          <button key={t} type="button"
                            onClick={() => setTenor(t)}
                            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{
                              border: tenor === t ? '2px solid #242F43' : '1px solid #E5E7EB',
                              backgroundColor: tenor === t ? '#242F43' : '#FAFAFA',
                              color: tenor === t ? '#fff' : '#525E71',
                              fontFamily: 'Montserrat, sans-serif',
                            }}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: '#B0BAC5' }}>Maksimal tenor 3 tahun</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold"
                      style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                      Kategori Pinjaman <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={category}
                      onChange={e => { setCategory(e.target.value as LoanCategory); setErrors(prev => ({ ...prev, category: '' })) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                      style={{
                        border: errors.category ? '1px solid #EF4444' : '1px solid #E5E7EB',
                        color: category ? '#242F43' : '#B0BAC5',
                        backgroundColor: '#FAFAFA',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                      <option value="">Pilih kategori pinjaman</option>
                      {formData?.categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{errors.category}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold"
                      style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                      Deskripsi <span className="text-xs font-normal" style={{ color: '#B0BAC5' }}>(opsional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tulis alasan pengajuan pinjaman..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{
                        border: '1px solid #E5E7EB',
                        color: '#242F43', backgroundColor: '#FAFAFA',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>

                  {/* Bank Account */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold"
                      style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                      Bank Account <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {formData?.bank_accounts.length === 0 ? (
                      <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                        Belum ada rekening bank. Tambahkan di halaman{' '}
                        <a href="/dashboard/member/profile" className="font-bold underline">Profile</a>.
                      </div>
                    ) : (
                      <select
                        value={bankAccountId ?? ''}
                        onChange={e => { setBankAccountId(Number(e.target.value)); setErrors(prev => ({ ...prev, bank_account: '' })) }}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                        style={{
                          border: errors.bank_account ? '1px solid #EF4444' : '1px solid #E5E7EB',
                          color: '#242F43', backgroundColor: '#FAFAFA',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                        <option value="">Pilih rekening bank</option>
                        {formData?.bank_accounts.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} — {b.account_number} ({b.account_holder}){b.is_primary ? ' ★ Utama' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.bank_account && (
                      <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{errors.bank_account}</p>
                    )}
                  </div>
                </div>

                {/* Dokumen Pendukung */}
                <div className="bg-white rounded-2xl p-8 space-y-5"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8E99A8" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <h3 className="font-bold text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Dokumen Pendukung
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <FileUploadZone
                      label="Foto Jaminan / Aset"
                      accept="image/png,image/jpeg"
                      hint="PNG, JPG up to 5MB"
                      file={collateralImage}
                      onFile={setCollateralImage}
                    />
                    <FileUploadZone
                      label="Slip Gaji Terakhir"
                      accept="application/pdf,image/jpeg,image/png"
                      hint="PDF, JPG up to 2MB"
                      file={salarySlip}
                      onFile={setSalarySlip}
                    />
                  </div>
                </div>

                {/* Non-field error */}
                {errors.non_field && (
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B' }}>
                    {errors.non_field}
                  </div>
                )}

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
                    {submitting ? 'Mengirim...' : 'Kirim Pengajuan →'}
                  </button>
                </div>
              </div>

              {/* ── RIGHT: Simulation + Notes ───────────────── */}
              <div className="space-y-5">

                {/* Estimasi Cicilan */}
                <div className="bg-white rounded-2xl p-6 space-y-4"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <p className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    Estimasi Cicilan
                  </p>
                  {sim ? (
                    <>
                      <p className="font-bold text-3xl"
                        style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                        {fmtRp(sim.monthly_installment)}
                        <span className="text-sm font-normal text-gray-400">/bln</span>
                      </p>
                      <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                        {[
                          { label: 'Pokok Pinjaman',    val: fmtRp(sim.principal) },
                          { label: 'Bunga (Flat 0.5%)', val: fmtRp(sim.interest_per_month) + '/bln' },
                          { label: 'Lama Pinjaman',     val: `${sim.tenor} Bulan` },
                          { label: 'Total Pengembalian', val: fmtRp(sim.total_repayment) },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                              {label}
                            </span>
                            <span className="text-xs font-bold"
                              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: '#B0BAC5' }}>
                      Masukkan jumlah pinjaman untuk melihat estimasi cicilan.
                    </p>
                  )}
                </div>

                {/* Catatan Penting */}
                <div className="bg-white rounded-2xl p-6 space-y-3"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF3C7' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold"
                      style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      Catatan Penting
                    </p>
                  </div>
                  {[
                    'Pengajuan akan diproses dalam 1-3 hari kerja oleh admin koperasi.',
                    'Pastikan foto dokumen jaminan terlihat jelas dan tidak buram.',
                    'Suku bunga dapat berubah sewaktu-waktu sesuai kebijakan rapat anggota.',
                  ].map((note, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: '#D1D5DB' }} />
                      <p className="text-xs leading-relaxed"
                        style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </form>
        )}
      </main>
    </DashboardLayout>
  )
}