'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

type SavingDetail = {
  id: number
  saving_id: string
  transaction_id: string
  saving_type: string
  amount: string
  status: string
  member_name: string
  member_id: string | null
  member_status: string
  member_email: string
  bank_account_name: string | null
  bank_account_number: string | null
  proof_image_url: string | null
  rejection_reason: string
  verified_by: number | null
  verified_at: string | null
  created_at: string
}

function formatRupiah(val: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Number(val))
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E' },
  SUCCESS:  { bg: '#D1FAE5', text: '#065F46' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
}
const MEMBER_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E' },
  VERIFIED: { bg: '#DBEAFE', text: '#1E40AF' },
  ACTIVE:   { bg: '#D1FAE5', text: '#065F46' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function PokokDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [saving, setSaving]         = useState<SavingDetail | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [action, setAction]         = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError]         = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg]     = useState('')
  const [checks, setChecks] = useState({
    proofValid:  false,
    amountMatch: false,
    bankCorrect: false,
  })
  const allChecked = Object.values(checks).every(Boolean)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/verifications/pokok/${id}/`)
      setSaving(res.data)
    } catch {
      setErrorMsg('Gagal memuat data transaksi.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleConfirm() {
    if (!action) return
    if (action === 'reject' && !rejectionReason.trim()) {
      setReasonError('Alasan penolakan wajib diisi.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.post(`/verifications/pokok/${id}/confirm/`, {
        action,
        rejection_reason: action === 'reject' ? rejectionReason : '',
      })
      setSuccessMsg(
        action === 'approve'
          ? '✓ Simpanan pokok disetujui. Status member sekarang ACTIVE.'
          : '✓ Simpanan pokok ditolak.'
      )
      setAction(null)
      fetchData()
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Terjadi kesalahan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!saving) return (
    <div className="p-8 text-center text-sm" style={{ color: '#EF4444' }}>
      {errorMsg || 'Data tidak ditemukan.'}
    </div>
  )

  const isPending    = saving.status === 'PENDING'
  const statusStyle  = STATUS_STYLE[saving.status]  ?? STATUS_STYLE.PENDING
  const memberStyle  = MEMBER_STATUS_STYLE[saving.member_status] ?? MEMBER_STATUS_STYLE.VERIFIED

  return (
    <div className="p-8">
      {successMsg && (
        <div className="mb-6 px-5 py-3 rounded-2xl text-sm font-semibold"
          style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-bold text-2xl" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Detail Simpanan Pokok
          </h2>
          <p className="text-sm mt-1" style={{ color: '#8E99A8' }}>
            {saving.saving_id} · {saving.transaction_id}
          </p>
        </div>
        <span className="px-4 py-1.5 rounded-full text-sm font-bold"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
          {saving.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <div className="col-span-2 space-y-5">

          {/* Info anggota */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base mb-4"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Info Anggota
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#8E99A8' }}>NAMA</p>
                <p className="text-sm font-medium" style={{ color: '#242F43' }}>{saving.member_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#8E99A8' }}>EMAIL</p>
                <p className="text-sm font-medium" style={{ color: '#242F43' }}>{saving.member_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#8E99A8' }}>MEMBER ID</p>
                <p className="text-sm font-medium" style={{ color: '#242F43' }}>{saving.member_id || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#8E99A8' }}>STATUS MEMBER</p>
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: memberStyle.bg, color: memberStyle.text }}>
                  {saving.member_status}
                </span>
              </div>
            </div>
          </div>

          {/* Detail transaksi */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base mb-4"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
              Detail Transaksi
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                ['JENIS SIMPANAN', 'Simpanan Pokok'],
                ['JUMLAH',         formatRupiah(saving.amount)],
                ['BANK PENGIRIM',  saving.bank_account_name  || '-'],
                ['NO. REKENING',   saving.bank_account_number || '-'],
                ['TANGGAL SUBMIT', formatDateTime(saving.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#8E99A8' }}>{label}</p>
                  <p className="text-sm font-medium" style={{ color: '#242F43' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection reason */}
          {saving.status === 'REJECTED' && saving.rejection_reason && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #FEE2E2' }}>
              <h3 className="font-bold text-base mb-2" style={{ color: '#991B1B' }}>Alasan Penolakan</h3>
              <p className="text-sm" style={{ color: '#525E71' }}>{saving.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">

          {/* Bukti transfer */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-sm" style={{ color: '#242F43' }}>Bukti Transfer</h3>
            </div>
            <div className="p-5">
              {saving.proof_image_url ? (
                <>
                  <a href={saving.proof_image_url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={saving.proof_image_url} alt="Bukti Transfer"
                      className="w-full object-cover rounded-xl" style={{ maxHeight: 220 }} />
                  </a>
                  <a href={saving.proof_image_url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 block text-center text-xs font-bold py-2 rounded-xl"
                    style={{ backgroundColor: '#F1F5F9', color: '#525E71' }}>
                    Buka di tab baru ↗
                  </a>
                </>
              ) : (
                <div className="w-full h-36 rounded-xl flex items-center justify-center text-sm"
                  style={{ backgroundColor: '#F8FAFC', color: '#8E99A8', border: '1px dashed #E5E7EB' }}>
                  Tidak ada bukti transfer
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          {isPending && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: '#242F43' }}>Checklist Verifikasi</h3>
              <div className="space-y-3">
                {[
                  { key: 'proofValid',  label: 'Bukti transfer valid & jelas' },
                  { key: 'amountMatch', label: 'Jumlah sesuai ketentuan' },
                  { key: 'bankCorrect', label: 'Rekening pengirim sesuai' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks[key as keyof typeof checks]}
                      onChange={e => setChecks(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#11447D' }}
                    />
                    <span className="text-sm" style={{ color: '#525E71' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-sm" style={{ color: '#242F43' }}>Tindakan</h3>
              {!action ? (
                <>
                  <button
                    onClick={() => setAction('approve')}
                    disabled={!allChecked}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#10B981' }}>
                    ✓ Approve Simpanan Pokok
                  </button>
                  {!allChecked && (
                    <p className="text-xs text-center" style={{ color: '#8E99A8' }}>
                      Centang semua checklist dulu
                    </p>
                  )}
                  <button
                    onClick={() => setAction('reject')}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: '#EF4444' }}>
                    ✕ Reject
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: '#242F43' }}>
                    Konfirmasi: {action === 'approve' ? 'Setujui' : 'Tolak'} simpanan ini?
                  </p>
                  {action === 'reject' && (
                    <div>
                      <textarea
                        rows={3}
                        placeholder="Alasan penolakan…"
                        value={rejectionReason}
                        onChange={e => { setRejectionReason(e.target.value); setReasonError('') }}
                        className="w-full px-4 py-2.5 text-sm rounded-xl resize-none outline-none"
                        style={{
                          border: reasonError ? '1px solid #EF4444' : '1px solid #E5E7EB',
                          backgroundColor: '#FAFAFA'
                        }}
                      />
                      {reasonError && (
                        <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{reasonError}</p>
                      )}
                    </div>
                  )}
                  {errorMsg && (
                    <p className="text-xs" style={{ color: '#EF4444' }}>{errorMsg}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setAction(null); setRejectionReason(''); setReasonError('') }}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                      Batal
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: action === 'approve' ? '#10B981' : '#EF4444' }}>
                      {submitting ? 'Memproses…' : 'Ya, Konfirmasi'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => router.push('/verifications/pokok')}
            className="w-full text-sm font-semibold text-center hover:opacity-70"
            style={{ color: '#8E99A8' }}>
            ← Kembali ke daftar
          </button>
        </div>
      </div>
    </div>
  )
}