'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface InstallmentRow {
  no: number
  due_date: string
  principal: number
  interest: number
  total: number
}

export interface LoanDetail {
  loan_number: string
  member_name: string
  principal_amount: number
  tenor: number
  interest_rate: number
  bank_name: string
  account_number: string
  account_holder: string
  admin_fee: number
  installments: InstallmentRow[]
}

interface Props {
  loanDetail: LoanDetail
  onConfirm: (proof?: File) => Promise<void>
  onCancel: () => void
  loading: boolean
}

const fmt = (n: number | undefined | null) =>
  'Rp ' + (n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

export default function DisbursementDetailContent({ loanDetail, onConfirm, onCancel, loading }: Props) {
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [proofError, setProofError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const netDisbursement = loanDetail.principal_amount - (loanDetail.admin_fee ?? 0)
  const rows      = loanDetail.installments ?? []

  const handleFile = (file: File) => { setProofFile(file); setProofError(false) }
  const handleConfirm = () => {
    if (!proofFile) { setProofError(true); return }
    onConfirm(proofFile)
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", background: '#F5F6FA', minHeight: '100vh' }}>

      {/* ── Title ── */}
      <div style={{ padding: '24px 0 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
          Konfirmasi Pencairan &amp; Jadwal:{' '}
          <span style={{ color: '#111827' }}>#{loanDetail.loan_number}</span>
        </h1>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0' }}>
          Tinjau ringkasan pinjaman, jadwal angsuran, dan unggah bukti transfer untuk menyelesaikan proses.
        </p>
      </div>

      {/* ── Two-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 20, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Loan Summary */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #F1F5F9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: '#94A3B8', textTransform: 'uppercase' }}>
                Ringkasan Pinjaman
              </span>
              <span style={{ background: '#111827', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                {loanDetail.member_name}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[
                { label: 'POKOK PINJAMAN', value: fmt(loanDetail.principal_amount) },
                { label: 'TENOR',          value: `${loanDetail.tenor} Bulan` },
                { label: 'SUKU BUNGA',     value: `${loanDetail.interest_rate}% / Bulan` },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#94A3B8', margin: '0 0 5px', textTransform: 'uppercase' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Installment Schedule */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: '#94A3B8', textTransform: 'uppercase' }}>
                Jadwal Angsuran (Installment Schedule)
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  {(['NO','TANGGAL JATUH TEMPO','POKOK','BUNGA','TOTAL TAGIHAN'] as const).map((h, i) => (
                    <th key={i} style={{
                      padding: '9px 20px', fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: '#94A3B8',
                      textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                      borderBottom: '1px solid #F1F5F9',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => <InstRow key={i} row={row} last={false} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — Disbursement Details */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: '#94A3B8', textTransform: 'uppercase' }}>
              Detail Pencairan
            </span>
          </div>

          <div style={{ padding: 20 }}>

            {/* Bank destination */}
            <Label>Bank Tujuan</Label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F9FAFB', borderRadius: 8, padding: '9px 12px',
              border: '1px solid #E5E7EB', marginBottom: 14,
            }}>
              {/* Figma shows a small gray bank-logo rectangle */}
              <div style={{ width: 28, height: 18, background: '#D1D5DB', borderRadius: 3, flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>
                {loanDetail.bank_name} - {loanDetail.account_number}
              </p>
            </div>

            {/* Account holder */}
            <Label>Nama Pemegang Rekening</Label>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 18px' }}>
              {loanDetail.account_holder}
            </p>

            <Divider />

            {/* Upload — REQUIRED */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label noMargin>Unggah Bukti Transfer</Label>
              <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>* Wajib</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${proofError ? '#EF4444' : dragOver ? '#3B82F6' : proofFile ? '#10B981' : '#D1D5DB'}`,
                borderRadius: 10, padding: '22px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer',
                background: proofError ? '#FEF2F2' : dragOver ? '#EFF6FF' : proofFile ? '#F0FDF4' : '#FAFBFC',
                transition: 'all 0.2s', marginBottom: proofError ? 4 : 18,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: proofFile ? '#D1FAE5' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={16} color={proofFile ? '#059669' : '#6B7280'} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: proofFile ? '#059669' : '#374151', margin: 0 }}>
                {proofFile ? proofFile.name : 'Unggah Bukti'}
              </p>
              {!proofFile && (
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>PDF, JPG, PNG (Maks. 2MB)</p>
              )}
            </div>

            {proofError && (
              <p style={{ fontSize: 11, color: '#EF4444', margin: '0 0 14px', fontWeight: 600 }}>
                Bukti transfer wajib diunggah sebelum konfirmasi.
              </p>
            )}

            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

            <Divider />

            {/* Net disbursement */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>Pencairan Bersih:</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>*Tidak termasuk biaya admin</p>
              </div>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#111827', margin: 0 }}>{fmt(netDisbursement)}</p>
            </div>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: loading ? '#9CA3AF' : '#111827',
                color: '#fff', fontSize: 13, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 8, letterSpacing: 0.2, transition: 'all 0.2s',
              }}
            >
              {loading ? 'Memproses...' : 'Konfirmasi Pencairan & Jadwal'}
            </button>

            {/* Cancel */}
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: 8,
                border: '1px solid #E5E7EB', background: '#fff',
                color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const Label = ({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) => (
  <p style={{
    fontSize: 9, fontWeight: 700, letterSpacing: 1,
    color: '#94A3B8', textTransform: 'uppercase',
    margin: noMargin ? 0 : '0 0 6px',
  }}>
    {children}
  </p>
)

const Divider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 16px' }} />
)

function InstRow({ row, last }: { row: InstallmentRow; last: boolean }) {
  return (
    <tr style={{ background: last ? '#F8FAFF' : 'transparent', borderBottom: '1px solid #F1F5F9' }}>
      <td style={{ padding: '11px 20px', textAlign: 'center', fontSize: 13, color: '#374151', fontWeight: 600 }}>
        {row.no}
      </td>
      <td style={{ padding: '11px 20px', fontSize: 13, color: '#374151' }}>
        {new Date(row.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
        {fmt(row.principal)}
      </td>
      <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
        {fmt(row.interest)}
      </td>
      <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#111827' }}>
        {fmt(row.total)}
      </td>
    </tr>
  )
}