'use client'

import Image from 'next/image'
import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { getMemberDetail, verifyMember } from '@/lib/staff-api'
import type { MemberDetail } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  VERIFIED: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  ACTIVE:   { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  INACTIVE: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold tracking-wider"
        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      <span className="text-sm font-medium"
        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── Page ──────────────────────────────────────────────────────────────────

export default function VerifyMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [member, setMember]           = useState<MemberDetail | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    action: 'approve' | 'reject' | null
  }>({ open: false, action: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  // Success notification banner
  const [successMsg, setSuccessMsg]   = useState('')

  const fetchMember = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMemberDetail(Number(id))
      setMember(data)
    } catch {
      setError('Gagal memuat data anggota.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchMember() }, [fetchMember])

  // ── Open modal ──────────────────────────────────────────────
  function openConfirm(action: 'approve' | 'reject') {
    setRejectionReason('')
    setReasonError('')
    setConfirmModal({ open: true, action })
  }

  // ── Submit verify ───────────────────────────────────────────
  async function handleConfirm() {
    const action = confirmModal.action!
    if (action === 'reject' && !rejectionReason.trim()) {
      setReasonError('Alasan penolakan wajib diisi.')
      return
    }
    setSubmitting(true)
    try {
      const res = await verifyMember(Number(id), {
        action,
        rejection_reason: action === 'reject' ? rejectionReason : undefined,
      })
      setMember(res.member)
      setConfirmModal({ open: false, action: null })
      const msg = action === 'approve'
        ? '✓ Anggota berhasil diverifikasi. Email notifikasi telah dikirim.'
        : '✓ Anggota berhasil ditolak. Email notifikasi telah dikirim.'
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 6000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setReasonError(axiosErr.response?.data?.error ?? 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  const isPending = member?.status === 'PENDING'

  return (
    <DashboardLayout role="STAFF" userName="Petugas">

      <DashboardHeader
        variant="detail"
        parentLabel="Calon Anggota"
        parentHref="/dashboard/staff/members"
        currentLabel="Verifikasi Anggota"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8">

        {/* Success banner */}
        {successMsg && (
          <div
            className="mb-6 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontFamily: 'Inter, sans-serif',
              border: '1px solid #A7F3D0' }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="py-24 text-center text-sm" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
            {error}
            <button onClick={fetchMember} className="ml-2 underline font-semibold"
              style={{ color: '#11447D' }}>
              Coba lagi
            </button>
          </div>
        ) : member && (
          <div className="grid grid-cols-3 gap-6">

            {/* ── Left: detail fields ────────────────────────── */}
            <div className="col-span-2 flex flex-col gap-6">

              {/* Status badge + meta */}
              <div className="bg-white rounded-2xl px-6 py-5 flex items-center justify-between"
                style={{ border: '1px solid #F1F5F9' }}>
                <div>
                  <p className="text-xs font-semibold tracking-wider mb-1"
                    style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    STATUS KEANGGOTAAN
                  </p>
                  {(() => {
                    const s = STATUS_STYLE[member.status] ?? STATUS_STYLE.PENDING
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg"
                        style={{ backgroundColor: s.bg, color: s.text }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
                        {member.status}
                      </span>
                    )
                  })()}
                </div>
                {member.verified_by_email && (
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-wider mb-0.5"
                      style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      DIVERIFIKASI OLEH
                    </p>
                    <p className="text-sm font-medium" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                      {member.verified_by_email}
                    </p>
                    {member.verified_at && (
                      <p className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        {formatDateTime(member.verified_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Personal data */}
              <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base mb-5"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Data Pribadi
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <FieldRow label="NAMA LENGKAP"    value={member.full_name} />
                  <FieldRow label="EMAIL"           value={member.email} />
                  <FieldRow label="NIK"             value={<span className="font-mono">{member.nik}</span>} />
                  <FieldRow label="JENIS KELAMIN"   value={member.gender === 'M' ? 'Laki-laki' : 'Perempuan'} />
                  <FieldRow label="TEMPAT LAHIR"    value={member.place_of_birth} />
                  <FieldRow label="TANGGAL LAHIR"   value={formatDate(member.date_of_birth)} />
                  <FieldRow label="PEKERJAAN"       value={member.occupation} />
                  <FieldRow label="NO. HP"          value={member.phone_number} />
                  <FieldRow label="TANGGAL DAFTAR"  value={formatDateTime(member.registration_date)} />
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="font-bold text-base mb-5"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                  Alamat
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div className="col-span-2">
                    <FieldRow label="ALAMAT LENGKAP" value={member.home_address} />
                  </div>
                  <FieldRow label="KOTA"            value={member.city} />
                  <FieldRow label="KODE POS"        value={member.postal_code} />
                </div>
              </div>

              {/* Rejection reason (shown when rejected) */}
              {member.status === 'REJECTED' && member.rejection_reason && (
                <div className="bg-white rounded-2xl px-6 py-5"
                  style={{ border: '1px solid #FEE2E2' }}>
                  <h3 className="font-bold text-base mb-3"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#991B1B' }}>
                    Alasan Penolakan
                  </h3>
                  <p className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                    {member.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: photos + actions ────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* KTP Image */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                    Foto KTP
                  </h3>
                </div>
                <div className="p-5">
                  {member.ktp_image ? (
                    <a href={member.ktp_image} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                      title="Buka foto KTP">
                      <Image
                        src={member.ktp_image}
                        alt="Foto KTP"
                        width={400}
                        height={240}
                        className="w-full object-cover rounded-xl"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: '#F8FAFC', color: '#8E99A8', border: '1px dashed #E5E7EB' }}>
                      Tidak ada foto KTP
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie Image */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                    Foto Selfie
                  </h3>
                </div>
                <div className="p-5">
                  {member.selfie_image ? (
                    <a href={member.selfie_image} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                      title="Buka foto selfie">
                      <Image
                        src={member.selfie_image}
                        alt="Foto Selfie"
                        width={400}
                        height={300}
                        className="w-full object-cover rounded-xl"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: '#F8FAFC', color: '#8E99A8', border: '1px dashed #E5E7EB' }}>
                      Tidak ada foto selfie
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons (only when PENDING) */}
              {isPending && (
                <div className="bg-white rounded-2xl px-5 py-5 flex flex-col gap-3"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <h3 className="font-bold text-sm mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                    Tindakan
                  </h3>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => openConfirm('approve')}
                    className="flex items-center gap-2">
                    <CheckIcon />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => openConfirm('reject')}
                    className="flex items-center gap-2">
                    <XIcon />
                    Reject
                  </Button>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => router.push('/dashboard/staff/members')}
                className="text-sm font-semibold transition-colors hover:opacity-70 text-center"
                style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                ← Kembali ke daftar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => { if (!submitting) setConfirmModal({ open: false, action: null }) }}
        title={
          confirmModal.action === 'approve'
            ? 'Konfirmasi Verifikasi'
            : 'Konfirmasi Penolakan'
        }
        description={
          confirmModal.action === 'approve'
            ? `Anda akan mengubah status ${member?.full_name ?? 'anggota ini'} menjadi VERIFIED. Tindakan ini akan mengirim email notifikasi ke calon anggota.`
            : `Anda akan menolak pendaftaran ${member?.full_name ?? 'anggota ini'}. Tindakan ini akan mengirim email notifikasi ke calon anggota.`
        }
        icon={
          confirmModal.action === 'approve'
            ? <span style={{ color: '#10B981', fontSize: 28 }}>✓</span>
            : <span style={{ color: '#EF4444', fontSize: 28 }}>✕</span>
        }
        confirmLabel={confirmModal.action === 'approve' ? 'Ya, Approve' : 'Ya, Reject'}
        cancelLabel="Batal"
        confirmVariant={confirmModal.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        loading={submitting}
        size="md"
      >
        {/* Rejection reason field – only when rejecting */}
        {confirmModal.action === 'reject' && (
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1.5"
              style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              Alasan Penolakan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tuliskan alasan penolakan…"
              value={rejectionReason}
              onChange={e => { setRejectionReason(e.target.value); setReasonError('') }}
              className="w-full rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-all"
              style={{
                border: reasonError ? '1px solid #EF4444' : '1px solid #E5E7EB',
                color: '#242F43',
                fontFamily: 'Inter, sans-serif',
                backgroundColor: '#FAFAFA',
              }}
            />
            {reasonError && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                {reasonError}
              </p>
            )}
          </div>
        )}
      </Modal>

    </DashboardLayout>
  )
}
