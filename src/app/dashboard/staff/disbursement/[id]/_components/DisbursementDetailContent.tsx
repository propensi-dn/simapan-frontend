'use client'

import { useState, useRef } from 'react'
import { Upload, Landmark } from 'lucide-react'

// ─── Type definitions (sesuaikan dengan LoanDetail dari staff-api) ───────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null) =>
  'Rp ' + (n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

// ─── Component ───────────────────────────────────────────────────────────────
export default function DisbursementDetailContent({
  loanDetail,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const netDisbursement = loanDetail.principal_amount - (loanDetail.admin_fee ?? 0)

  // Tampilkan maks 2 baris + ellipsis + baris terakhir
  const rows = loanDetail.installments ?? []
  const firstTwo = rows.slice(0, 2)
  const lastRow = rows.length > 3 ? rows[rows.length - 1] : null
  const hiddenCount = rows.length > 3 ? rows.length - 3 : 0

  const handleFile = (file: File) => {
    setProofFile(file)
  }

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        background: '#F5F6FA',
        minHeight: '100vh',
        padding: '0',
      }}
    >
      {/* ── Page title ── */}
      <div style={{ padding: '24px 0' }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#1A2B4A',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          Konfirmasi Pencairan &amp; Jadwal:{' '}
          <span style={{ color: '#3B7DFF' }}>#{loanDetail.loan_number}</span>
        </h1>
        <p style={{ color: '#8A9BB0', fontSize: 13, marginTop: 4 }}>
          Tinjau ringkasan pinjaman, jadwal angsuran, dan unggah bukti transfer untuk menyelesaikan proses.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div
        style={{
          padding: '24px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Loan Summary Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #E8EAED',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* card header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #F0F2F5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  color: '#8A9BB0',
                  textTransform: 'uppercase',
                }}
              >
                Ringkasan Pinjaman
              </span>
              <span
                style={{
                  background: '#1A2B4A',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 20,
                }}
              >
                {loanDetail.member_name}
              </span>
            </div>

            {/* 3 stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0,
              }}
            >
              {[
                {
                  label: 'POKOK PINJAMAN',
                  value: fmt(loanDetail.principal_amount),
                  accent: '#3B7DFF',
                },
                {
                  label: 'TENOR',
                  value: `${loanDetail.tenor} Bulan`,
                  accent: '#10B981',
                },
                {
                  label: 'SUKU BUNGA',
                  value: `${loanDetail.interest_rate}% / Bulan`,
                  accent: '#F59E0B',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 20px',
                    borderRight: i < 2 ? '1px solid #F0F2F5' : 'none',
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: '#B0BAC9',
                      margin: '0 0 6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: stat.accent,
                      margin: 0,
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Installment Schedule Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #E8EAED',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #F0F2F5',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  color: '#8A9BB0',
                  textTransform: 'uppercase',
                }}
              >
                Jadwal Angsuran (Jadwal Angsuran)
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8F9FB' }}>
                  {['NO', 'TANGGAL JATUH TEMPO', 'POKOK', 'BUNGA', 'TOTAL'].map(
                    (h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '10px 20px',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 0.8,
                          color: '#B0BAC9',
                          textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                          borderBottom: '1px solid #F0F2F5',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {firstTwo.map((row, i) => (
                  <TableRow key={i} row={row} highlight={false} />
                ))}

                {hiddenCount > 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        padding: '12px',
                        fontSize: 13,
                        color: '#8A9BB0',
                        fontStyle: 'italic',
                        borderBottom: '1px solid #F0F2F5',
                      }}
                    >
                      ... (Entri {3} s/d {rows.length - 1}) ...
                    </td>
                  </tr>
                )}

                {lastRow && <TableRow row={lastRow} highlight={true} />}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #E8EAED',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* card header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1A2B4A 0%, #2D4A7A 100%)',
              padding: '16px 20px',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
              }}
            >
              Detail Pencairan
            </span>
          </div>

          <div style={{ padding: 20 }}>
            {/* Bank destination */}
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#B0BAC9',
                  textTransform: 'uppercase',
                  margin: '0 0 6px',
                }}
              >
                Bank Tujuan
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#F8F9FB',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #E8EAED',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #3B7DFF, #2563EB)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Landmark size={16} color="#fff" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#1A2B4A',
                      margin: 0,
                    }}
                  >
                    {loanDetail.bank_name} - {loanDetail.account_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Account holder */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#B0BAC9',
                  textTransform: 'uppercase',
                  margin: '0 0 4px',
                }}
              >
                Nama Pemegang Rekening
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#1A2B4A',
                  margin: 0,
                }}
              >
                {loanDetail.account_holder}
              </p>
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #F0F2F5', margin: '0 0 20px' }} />

            {/* Upload Receipt */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#B0BAC9',
                  textTransform: 'uppercase',
                  margin: '0 0 8px',
                }}
              >
                Unggah Bukti Transfer
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#3B7DFF' : proofFile ? '#10B981' : '#D1D9E6'}`,
                  borderRadius: 10,
                  padding: '20px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  background: dragOver
                    ? '#EEF4FF'
                    : proofFile
                    ? '#F0FDF4'
                    : '#FAFBFC',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: proofFile
                      ? 'linear-gradient(135deg,#10B981,#059669)'
                      : 'linear-gradient(135deg,#3B7DFF,#2563EB)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Upload size={18} color="#fff" />
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: proofFile ? '#059669' : '#3B7DFF',
                    margin: 0,
                  }}
                >
                  {proofFile ? proofFile.name : 'Unggah Bukti'}
                </p>
                {!proofFile && (
                  <p style={{ fontSize: 11, color: '#B0BAC9', margin: 0 }}>
                    PDF, JPG, PNG (Maks. 2MB)
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>

            {/* Net disbursement */}
            <div
              style={{
                background: '#F8F9FB',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #E8EAED',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8A9BB0',
                    margin: '0 0 2px',
                  }}
                >
                  Pencairan Bersih:
                </p>
                <p style={{ fontSize: 10, color: '#B0BAC9', margin: 0 }}>
                  *Tidak termasuk biaya admin
                </p>
              </div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#1A2B4A',
                  margin: 0,
                }}
              >
                {fmt(netDisbursement)}
              </p>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => onConfirm(proofFile ?? undefined)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading
                  ? '#93B4FF'
                  : 'linear-gradient(135deg, #1A2B4A 0%, #2D4A7A 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
                marginBottom: 10,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Memproses...' : 'Konfirmasi Pencairan & Jadwal'}
            </button>

            {/* Cancel button */}
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                color: '#1A2B4A',
                border: '1.5px solid #E8EAED',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
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

// ─── Sub-component: table row ─────────────────────────────────────────────────
function TableRow({
  row,
  highlight,
}: {
  row: InstallmentRow
  highlight: boolean
}) {
  return (
    <tr
      style={{
        background: highlight ? '#F0F7FF' : 'transparent',
        borderBottom: '1px solid #F0F2F5',
      }}
    >
      <td
        style={{
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: 13,
          color: '#1A2B4A',
          fontWeight: 600,
        }}
      >
        {row.no}
      </td>
      <td style={{ padding: '12px 20px', fontSize: 13, color: '#1A2B4A' }}>
        {new Date(row.due_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td
        style={{
          padding: '12px 20px',
          textAlign: 'right',
          fontSize: 13,
          color: '#1A2B4A',
        }}
      >
        {fmt(row.principal)}
      </td>
      <td
        style={{
          padding: '12px 20px',
          textAlign: 'right',
          fontSize: 13,
          color: '#1A2B4A',
        }}
      >
        {fmt(row.interest)}
      </td>
      <td
        style={{
          padding: '12px 20px',
          textAlign: 'right',
          fontSize: 14,
          fontWeight: 800,
          color: highlight ? '#3B7DFF' : '#1A2B4A',
        }}
      >
        {fmt(row.total)}
      </td>
    </tr>
  )
}