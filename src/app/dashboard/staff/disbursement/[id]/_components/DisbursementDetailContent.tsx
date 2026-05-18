'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import type { LoanDetail } from '@/lib/staff-api'

interface Props {
  loanDetail: LoanDetail
  onConfirm: (proof?: File) => Promise<void>
  onCancel: () => void
  loading: boolean
}

const fmtRp = (n: number | undefined | null) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n ?? 0)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function DisbursementDetailContent({ loanDetail, onConfirm, onCancel, loading }: Props) {
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [proofError, setProofError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const netDisbursement = loanDetail.principal_amount - (loanDetail.admin_fee ?? 0)
  const rows = loanDetail.installments ?? []

  const handleFile = (file: File) => { setProofFile(file); setProofError(false) }
  const handleConfirm = () => {
    if (!proofFile) { setProofError(true); return }
    onConfirm(proofFile)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-5">

        {/* Loan Summary Card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Ringkasan Pinjaman
            </p>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}
            >
              {loanDetail.member_name}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {[
              { label: 'Pokok Pinjaman', value: fmtRp(loanDetail.principal_amount) },
              { label: 'Tenor',          value: `${loanDetail.tenor} Bulan` },
              { label: 'Suku Bunga',     value: `${loanDetail.interest_rate}% / Bulan` },
            ].map((s, i) => (
              <div
                key={i}
                className="px-6 py-5"
                style={{
                  borderRight: i < 2 ? '1px solid #F1F5F9' : 'none',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                >
                  {s.label}
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {[
              { label: 'Cicilan Perbulan',        value: loanDetail.monthly_installment },
              { label: 'Total Pembayaran (+ Bunga)', value: loanDetail.total_repayment },
            ].map((s, i) => (
              <div
                key={i}
                className="px-6 py-4"
                style={{ borderRight: i === 0 ? '1px solid #F1F5F9' : 'none' }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                >
                  {s.label}
                </p>
                <p
                  className="text-base font-bold"
                  style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                >
                  {typeof s.value === 'string'
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(s.value))
                    : fmtRp(s.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Installment Schedule Card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Jadwal Angsuran
            </p>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ color: '#8E99A8', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
            >
              {rows.length} CICILAN
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  {[
                    { label: 'NO',            align: 'center' as const },
                    { label: 'JATUH TEMPO',   align: 'left'   as const },
                    { label: 'POKOK',         align: 'right'  as const },
                    { label: 'BUNGA',         align: 'right'  as const },
                    { label: 'TOTAL TAGIHAN', align: 'right'  as const },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className="px-6 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap"
                      style={{ color: '#8E99A8', textAlign: h.align, fontFamily: 'Inter, sans-serif' }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: '#8E99A8' }}>
                      Tidak ada jadwal angsuran
                    </td>
                  </tr>
                ) : rows.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-[#FAFAFA] transition-colors"
                    style={{ borderBottom: i < rows.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                  >
                    <td className="px-6 py-3.5 text-center font-semibold" style={{ color: '#525E71' }}>
                      {row.no}
                    </td>
                    <td className="px-6 py-3.5" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                      {fmtDate(row.due_date)}
                    </td>
                    <td className="px-6 py-3.5 text-right" style={{ color: '#525E71' }}>
                      {fmtRp(row.principal)}
                    </td>
                    <td className="px-6 py-3.5 text-right" style={{ color: '#525E71' }}>
                      {fmtRp(row.interest)}
                    </td>
                    <td
                      className="px-6 py-3.5 text-right font-bold"
                      style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {fmtRp(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="lg:sticky lg:top-6">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Detail Pencairan
            </p>
          </div>

          <div className="p-6 space-y-5">

            {/* Bank Info */}
            {loanDetail.bank_name ? (
              <div>
                <p
                  className="text-xs font-semibold tracking-wider uppercase mb-3"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                >
                  Rekening Tujuan
                </p>
                <div
                  className="rounded-xl p-4 space-y-2.5"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
                >
                  {[
                    { label: 'Bank',        value: loanDetail.bank_name },
                    { label: 'No. Rekening', value: loanDetail.account_number },
                    { label: 'Atas Nama',   value: loanDetail.account_holder },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center text-sm">
                      <span style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>{r.label}</span>
                      <span className="font-semibold text-right" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {r.value || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-4 flex gap-3 text-sm"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span style={{ fontFamily: 'Inter, sans-serif' }}>
                  Info rekening anggota tidak tersedia. Hubungi anggota untuk konfirmasi.
                </span>
              </div>
            )}

            <hr style={{ borderColor: '#F1F5F9' }} />

            {/* Upload Proof */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                >
                  Bukti Transfer
                </p>
                <span className="text-[10px] font-bold" style={{ color: '#EF4444' }}>* Wajib</span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all"
                style={{
                  borderColor: proofError ? '#EF4444' : dragOver ? '#3B82F6' : proofFile ? '#10B981' : '#E5E7EB',
                  backgroundColor: proofError ? '#FEF2F2' : dragOver ? '#EFF6FF' : proofFile ? '#F0FDF4' : '#FAFAFA',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: proofFile ? '#D1FAE5' : '#F3F4F6' }}
                  >
                    {proofFile
                      ? <FileText size={16} color="#059669" />
                      : <Upload size={16} color="#6B7280" />}
                  </div>
                  <p
                    className="text-sm font-semibold break-all"
                    style={{ color: proofFile ? '#059669' : '#374151', fontFamily: 'Inter, sans-serif' }}
                  >
                    {proofFile ? proofFile.name : 'Klik atau seret file di sini'}
                  </p>
                  {!proofFile && (
                    <p className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      PDF, JPG, PNG (Maks. 2MB)
                    </p>
                  )}
                  {proofFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setProofFile(null); setProofError(false) }}
                      className="text-xs font-semibold"
                      style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}
                    >
                      Hapus File
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />

              {proofError && (
                <p className="text-xs font-semibold mt-1.5" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                  Bukti transfer wajib diunggah sebelum konfirmasi.
                </p>
              )}
            </div>

            <hr style={{ borderColor: '#F1F5F9' }} />

            {/* Net Disbursement */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                  Pencairan Bersih
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  Setelah biaya administrasi
                </p>
              </div>
              <p
                className="text-xl font-bold"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                {fmtRp(netDisbursement)}
              </p>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
            >
              {loading ? 'Memproses...' : 'Konfirmasi Pencairan'}
            </button>

            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-70"
              style={{ border: '1px solid #E5E7EB', color: '#525E71', backgroundColor: '#fff', fontFamily: 'Inter, sans-serif' }}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
