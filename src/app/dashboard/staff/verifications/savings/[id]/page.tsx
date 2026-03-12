'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import {
  getSavingDetail,
  verifySaving,
  type SavingTransaction,
  type SavingsBalance,
} from '@/lib/savings-api'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Number(v))

const TYPE_LABEL: Record<string, string> = {
  POKOK: 'Simpanan Pokok', WAJIB: 'Simpanan Wajib', SUKARELA: 'Simpanan Sukarela',
}

const TX_STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  SUCCESS:  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

const MEMBER_STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  VERIFIED: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  ACTIVE:   { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  PENDING:  { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

// TC-04: checklist per jenis simpanan
const CHECKLIST_POKOK = [
  'Bukti transfer terbaca dengan jelas',
  'Nominal sesuai dengan ketentuan simpanan pokok (Rp 150.000)',
  'Nama pengirim sesuai dengan data anggota',
  'Rekening tujuan transfer sudah benar',
]
const CHECKLIST_DEPOSIT = [
  'Bukti transfer terbaca dengan jelas',
  'Nama pengirim sesuai dengan data anggota',
  'Rekening tujuan transfer sudah benar',
  'Tanggal transfer valid',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider mb-1"
        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{label}</p>
      <div className="text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
        {children ?? <span style={{ color: '#B0BAC5' }}>—</span>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <h3 className="font-bold text-sm" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function ProofViewer({ url }: { url?: string | null }) {
  const [zoom, setZoom]     = useState(1)
  const [rotate, setRotate] = useState(0)

  if (!url) return (
    <div className="h-48 rounded-xl flex flex-col items-center justify-center gap-2"
      style={{ backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB' }}>
      <p className="text-xs" style={{ color: '#B0BAC5' }}>Bukti transfer tidak tersedia</p>
    </div>
  )

  const isPdf = /\.pdf($|\?)/i.test(url)
  if (isPdf) return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      <div className="px-3 py-2 flex justify-between items-center"
        style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
        <span className="text-xs font-semibold" style={{ color: '#8E99A8' }}>PDF</span>
        <a href={url} download target="_blank" rel="noreferrer"
          className="text-xs font-bold px-3 py-1 rounded-lg"
          style={{ backgroundColor: '#11447D', color: '#fff' }}>⬇ Download</a>
      </div>
      <iframe src={url} className="w-full" style={{ height: 280, border: 'none' }} title="Bukti Transfer" />
    </div>
  )

  const Btn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ border: '1px solid #E5E7EB', color: '#525E71', backgroundColor: '#FAFAFA' }}>{label}</button>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Btn onClick={() => setZoom(z => Math.min(z + 0.25, 3))}   label="🔍 +" />
        <Btn onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} label="🔍 −" />
        <Btn onClick={() => setRotate(r => (r + 90) % 360)}         label="↻ Putar" />
        <Btn onClick={() => { setZoom(1); setRotate(0) }}            label="Reset" />
        <a href={url} download target="_blank" rel="noreferrer"
          className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#11447D', color: '#fff' }}>⬇ Download</a>
      </div>
      <div className="rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', minHeight: 200 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Bukti Transfer"
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            transition: 'transform 0.2s ease',
            maxWidth: '100%', maxHeight: 260, objectFit: 'contain',
          }} />
      </div>
    </div>
  )
}

function BalanceCard({ bal }: { bal: SavingsBalance }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #A7F3D0' }}>
      <div className="px-5 py-3" style={{ backgroundColor: '#D1FAE5' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#065F46' }}>
          Saldo Simpanan Terkini
        </p>
      </div>
      <div className="grid grid-cols-3" style={{ borderBottom: '1px solid #A7F3D0' }}>
        {[
          { label: 'Pokok',    val: bal.total_pokok },
          { label: 'Wajib',    val: bal.total_wajib },
          { label: 'Sukarela', val: bal.total_sukarela },
        ].map(({ label, val }, i) => (
          <div key={label} className="px-4 py-3 text-center"
            style={{ borderRight: i < 2 ? '1px solid #A7F3D0' : 'none' }}>
            <p className="text-xs mb-1" style={{ color: '#8E99A8' }}>{label}</p>
            <p className="text-sm font-bold" style={{ color: '#065F46', fontFamily: 'Montserrat, sans-serif' }}>
              {fmtRp(val)}
            </p>
          </div>
        ))}
      </div>
      <div className="px-5 py-2.5 text-center" style={{ backgroundColor: '#F0FDF4' }}>
        <span className="text-xs" style={{ color: '#8E99A8' }}>Total&nbsp;</span>
        <span className="font-bold text-base" style={{ color: '#065F46', fontFamily: 'Montserrat, sans-serif' }}>
          {fmtRp(bal.total)}
        </span>
      </div>
    </div>
  )
}

export default function SavingsVerifDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()

  const [tx,           setTx]          = useState<SavingTransaction | null>(null)
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState('')
  const [modal,        setModal]       = useState<{ open: boolean; action: 'approve'|'reject'|null }>({ open: false, action: null })
  const [reason,       setReason]      = useState('')
  const [reasonErr,    setReasonErr]   = useState('')
  const [submitting,   setSubmitting]  = useState(false)
  const [resultBal,    setResultBal]   = useState<SavingsBalance | null>(null)
  const [checklist,    setChecklist]   = useState<boolean[]>([])
  const [approvedAmount, setApprovedAmount] = useState('')
  const [amountErr,    setAmountErr]   = useState('')
  const [successModal, setSuccessModal] = useState<{
    open: boolean
    type: 'approve' | 'reject' | null
    message: string
    memberId: string | null
    memberActivated: boolean
  }>({ open: false, type: null, message: '', memberId: null, memberActivated: false })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getSavingDetail(Number(id))
      setTx(data)
      const items = data.saving_type === 'POKOK' ? CHECKLIST_POKOK : CHECKLIST_DEPOSIT
      setChecklist(new Array(items.length).fill(false))
      if (data.saving_type === 'SUKARELA') setApprovedAmount(data.amount)
    } catch { setError('Gagal memuat data transaksi.') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const checklistItems = tx?.saving_type === 'POKOK' ? CHECKLIST_POKOK : CHECKLIST_DEPOSIT
  const allChecked     = checklist.length > 0 && checklist.every(Boolean)
  const checkedCount   = checklist.filter(Boolean).length

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  async function handleConfirm() {
    if (modal.action === 'reject' && !reason.trim()) {
      setReasonErr('Alasan penolakan wajib diisi.'); return
    }
    if (modal.action === 'approve' && tx?.saving_type === 'SUKARELA') {
      const val = Number(approvedAmount)
      if (!approvedAmount || isNaN(val) || val <= 0) {
        setAmountErr('Jumlah yang disetujui harus lebih dari 0.'); return
      }
    }
    setSubmitting(true)
    try {
      const res = await verifySaving(Number(id), {
        action:           modal.action!,
        rejection_reason: modal.action === 'reject' ? reason : undefined,
      })
      setTx(res.transaction)
      setModal({ open: false, action: null })
      setChecklist(new Array(checklistItems.length).fill(false))

      if (modal.action === 'approve') {
        setResultBal(res.balance)
        setSuccessModal({
          open: true,
          type: 'approve',
          message: res.message,
          memberId: res.member_id,
          memberActivated: res.member_activated,
        })
      } else {
        setSuccessModal({
          open: true,
          type: 'reject',
          message: 'Setoran berhasil ditolak.',
          memberId: null,
          memberActivated: false,
        })
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setReasonErr(msg ?? 'Terjadi kesalahan. Coba lagi.')
    } finally { setSubmitting(false) }
  }

  const isPending  = tx?.status === 'PENDING'
  const isPokok    = tx?.saving_type === 'POKOK'
  const isSukarela = tx?.saving_type === 'SUKARELA'

  return (
    <DashboardLayout role="STAFF">
      <DashboardHeader
        variant="detail"
        parentLabel="Verifikasi Setoran"
        parentHref="/dashboard/staff/verifications/savings"
        currentLabel="Detail Transaksi"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8 space-y-5">

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="py-24 text-center text-sm" style={{ color: '#EF4444' }}>
            {error}&nbsp;
            <button onClick={load} className="underline font-semibold" style={{ color: '#11447D' }}>Coba lagi</button>
          </div>
        ) : tx && (
          <div className="grid grid-cols-3 gap-6">

            {/* ── LEFT ──────────────────────────────────────── */}
            <div className="col-span-2 space-y-5">

              {/* status row */}
              <div className="bg-white rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3"
                style={{ border: '1px solid #F1F5F9' }}>
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const s = TX_STATUS_STYLE[tx.status] ?? TX_STATUS_STYLE.PENDING
                    return (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: s.bg, color: s.text }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                        {tx.status === 'PENDING' ? 'Menunggu Verifikasi' : tx.status === 'SUCCESS' ? 'Terverifikasi' : 'Ditolak'}
                      </span>
                    )
                  })()}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                    style={{
                      backgroundColor: isPokok ? '#DBEAFE' : isSukarela ? '#FEF3C7' : '#D1FAE5',
                      color: isPokok ? '#1E40AF' : isSukarela ? '#92400E' : '#065F46',
                    }}>
                    {TYPE_LABEL[tx.saving_type]}
                  </span>
                </div>
                {tx.verified_by_email && (
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-wider mb-0.5" style={{ color: '#8E99A8' }}>DIVERIFIKASI OLEH</p>
                    <p className="text-sm font-medium" style={{ color: '#242F43' }}>{tx.verified_by_email}</p>
                  </div>
                )}
              </div>

              {/* detail setoran */}
              <Card title="Detail Setoran">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="ID SETORAN"><span className="font-mono font-semibold">{tx.saving_id}</span></Field>
                  <Field label="ID TRANSAKSI"><span className="font-mono">{tx.transaction_id}</span></Field>
                  <Field label="JENIS SIMPANAN">{TYPE_LABEL[tx.saving_type]}</Field>
                  <Field label="NOMINAL DIAJUKAN">
                    <span className="font-bold text-base" style={{ color: '#11447D', fontFamily: 'Montserrat, sans-serif' }}>
                      {fmtRp(tx.amount)}
                    </span>
                  </Field>
                  <Field label="TANGGAL PENGAJUAN">{fmtDate(tx.submitted_at)}</Field>
                </div>

                {/* TC-06: edit nominal khusus SUKARELA */}
                {isSukarela && isPending && (
                  <div className="mt-5 pt-5" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <label className="block text-xs font-semibold tracking-wider mb-2"
                      style={{ color: '#8E99A8' }}>
                      JUMLAH YANG DISETUJUI
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#8E99A8' }}>Rp</span>
                      <input
                        type="number" min="1"
                        value={approvedAmount}
                        onChange={e => { setApprovedAmount(e.target.value); setAmountErr('') }}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold"
                        style={{
                          border: amountErr ? '1px solid #EF4444' : '1px solid #E5E7EB',
                          color: '#242F43', backgroundColor: '#FAFAFA',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                        placeholder="Masukkan jumlah yang disetujui"
                      />
                    </div>
                    {amountErr && <p className="text-xs mt-1 font-medium" style={{ color: '#EF4444' }}>{amountErr}</p>}
                    <p className="text-xs mt-1.5" style={{ color: '#B0BAC5' }}>
                      Nominal dapat disesuaikan sebelum disetujui.
                    </p>
                  </div>
                )}

                {tx.status === 'REJECTED' && tx.rejection_reason && (
                  <div className="mt-5 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#991B1B' }}>ALASAN PENOLAKAN</p>
                    <p className="text-sm" style={{ color: '#7F1D1D' }}>{tx.rejection_reason}</p>
                  </div>
                )}
              </Card>

              {/* info anggota */}
              <Card title="Informasi Anggota">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="NAMA">{tx.member_name}</Field>
                  <Field label="EMAIL">{tx.member_email}</Field>
                  <Field label="NOMOR ANGGOTA">
                    {tx.member_id
                      ? <span className="font-mono">{tx.member_id}</span>
                      : <span style={{ color: '#B0BAC5' }}>Belum tersedia</span>}
                  </Field>
                  <Field label="STATUS KEANGGOTAAN">
                    {(() => {
                      const s = MEMBER_STATUS_STYLE[tx.member_status] ?? MEMBER_STATUS_STYLE.PENDING
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: s.bg, color: s.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                          {tx.member_status}
                        </span>
                      )
                    })()}
                  </Field>
                </div>
                {isPokok && tx.member_status === 'VERIFIED' && isPending && (
                  <div className="mt-4 px-4 py-3 rounded-xl flex items-start gap-2.5"
                    style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <span style={{ fontSize: 14 }}>ℹ️</span>
                    <p className="text-xs leading-relaxed" style={{ color: '#1E40AF' }}>
                      Menyetujui setoran ini akan mengaktifkan keanggotaan dan men-generate Nomor Anggota secara otomatis.
                    </p>
                  </div>
                )}
              </Card>

              {(tx.member_bank_name || tx.member_account_number) && (
                <Card title="Rekening Bank Anggota">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <Field label="NAMA BANK">{tx.member_bank_name}</Field>
                    <Field label="NOMOR REKENING"><span className="font-mono">{tx.member_account_number}</span></Field>
                  </div>
                </Card>
              )}

              {resultBal && <BalanceCard bal={resultBal} />}
            </div>

            {/* ── RIGHT ──────────────────────────────────────── */}
            <div className="space-y-4">
              <Card title="Bukti Transfer">
                <ProofViewer url={tx.transfer_proof_url} />
              </Card>

              {/* TC-04: checklist + action */}
              {isPending && (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <h3 className="font-bold text-sm"
                      style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                      Daftar Periksa
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: '#8E99A8' }}>
                      Centang semua poin sebelum menyetujui
                    </p>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {checklistItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleCheck(i)}>
                        <div className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: checklist[i] ? '#11447D' : '#fff',
                            border: checklist[i] ? '1.5px solid #11447D' : '1.5px solid #D1D5DB',
                          }}>
                          {checklist[i] && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs leading-relaxed select-none"
                          style={{ color: checklist[i] ? '#242F43' : '#525E71' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* progress bar */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#8E99A8' }}>
                        {checkedCount}/{checklistItems.length} dicentang
                      </span>
                      {allChecked && (
                        <span className="text-xs font-semibold" style={{ color: '#065F46' }}>Siap ✓</span>
                      )}
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(checkedCount / checklistItems.length) * 100}%`,
                          backgroundColor: allChecked ? '#10B981' : '#11447D',
                        }} />
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-2.5" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => { if (allChecked) { setReason(''); setReasonErr(''); setAmountErr(''); setModal({ open: true, action: 'approve' }) } }}
                      disabled={!allChecked}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        backgroundColor: allChecked ? '#11447D' : '#E5E7EB',
                        color: allChecked ? '#fff' : '#9CA3AF',
                        cursor: allChecked ? 'pointer' : 'not-allowed',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                      ✓ Setujui Setoran
                    </button>
                    <button
                      onClick={() => { setReason(''); setReasonErr(''); setModal({ open: true, action: 'reject' }) }}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'Inter, sans-serif' }}>
                      ✕ Tolak Setoran
                    </button>
                    {!allChecked && (
                      <p className="text-xs text-center" style={{ color: '#B0BAC5' }}>
                        Centang semua poin untuk mengaktifkan tombol setujui
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button onClick={() => router.push('/dashboard/staff/verifications/savings')}
                className="w-full text-sm font-semibold text-center py-2 hover:opacity-60 transition-opacity"
                style={{ color: '#8E99A8' }}>
                ← Kembali ke daftar
              </button>
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={modal.open}
        onClose={() => { if (!submitting) setModal({ open: false, action: null }) }}
        title={modal.action === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
        description={
          modal.action === 'approve'
            ? isPokok
              ? `Setujui simpanan pokok ${fmtRp(tx?.amount ?? 0)} dari ${tx?.member_name}? Keanggotaan akan diaktifkan.`
              : isSukarela
                ? `Setujui simpanan sukarela ${fmtRp(approvedAmount || 0)} dari ${tx?.member_name}? Saldo simpanan akan diperbarui.`
                : `Setujui simpanan wajib ${fmtRp(tx?.amount ?? 0)} dari ${tx?.member_name}? Saldo simpanan akan diperbarui.`
            : `Tolak setoran dari ${tx?.member_name}? Anggota dapat mengajukan ulang bukti transfer.`
        }
        confirmLabel={modal.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        cancelLabel="Batal"
        confirmVariant={modal.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        loading={submitting}
        size="md"
      >
        {modal.action === 'reject' && (
          <div className="mb-1">
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43' }}>
              Alasan Penolakan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea rows={3}
              placeholder="Contoh: bukti transfer tidak terbaca, nominal tidak sesuai…"
              value={reason}
              onChange={e => { setReason(e.target.value); setReasonErr('') }}
              className="w-full rounded-xl px-4 py-2.5 text-sm resize-none outline-none"
              style={{
                border: reasonErr ? '1px solid #EF4444' : '1px solid #E5E7EB',
                color: '#242F43', backgroundColor: '#FAFAFA',
              }}
            />
            {reasonErr && <p className="text-xs mt-1 font-medium" style={{ color: '#EF4444' }}>{reasonErr}</p>}
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* top bar with X */}
            <div className="flex items-center justify-between px-5 pt-5 pb-0">
              <span />
              <button
                onClick={() => setSuccessModal(s => ({ ...s, open: false }))}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: '#8E99A8' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 pt-3 pb-6 flex flex-col items-center text-center">

              {/* icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: successModal.type === 'approve' ? '#D1FAE5' : '#FEF3C7' }}>
                {successModal.type === 'approve' ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>

              <h3 className="font-bold text-lg mb-1.5"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                {successModal.type === 'approve' ? 'Setoran Disetujui!' : 'Setoran Ditolak'}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#525E71' }}>
                {successModal.message}
              </p>

              {/* member ID badge — only for pokok activation */}
              {successModal.memberActivated && successModal.memberId && (
                <div className="mb-4 px-4 py-3 rounded-xl w-full"
                  style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#8E99A8' }}>NOMOR ANGGOTA BARU</p>
                  <p className="font-mono font-bold text-base" style={{ color: '#1E40AF' }}>
                    {successModal.memberId}
                  </p>
                </div>
              )}

              {/* CTA buttons */}
              <button
                onClick={() => router.push('/dashboard/staff/verifications/savings')}
                className="w-full py-3 rounded-xl text-sm font-bold mb-2 transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#11447D',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                }}>
                Kembali ke Daftar Verifikasi
              </button>
              <button
                onClick={() => setSuccessModal(s => ({ ...s, open: false }))}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#525E71',
                  fontFamily: 'Inter, sans-serif',
                }}>
                Tetap di Halaman Ini
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}