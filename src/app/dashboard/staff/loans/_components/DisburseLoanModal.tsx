'use client'

import { useState, useRef, useEffect } from 'react'
import { ApprovedLoan, getLoanDetail, LoanDetail } from '@/lib/staff-api'
import { Upload, FileText, ChevronLeft, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface DisburseLoanModalProps {
  isOpen: boolean
  onClose: () => void
  loan: ApprovedLoan
  onConfirm: (proof?: File) => Promise<void>
  loading?: boolean
}

type Step = 'confirm' | 'proof'

export default function DisburseLoanModal({
  isOpen,
  onClose,
  loan,
  onConfirm,
  loading = false,
}: DisburseLoanModalProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch loan detail when modal opens
  useEffect(() => {
    if (isOpen && step === 'confirm' && !loanDetail) {
      fetchLoanDetail()
    }
  }, [isOpen, step])

  const fetchLoanDetail = async () => {
    try {
      setLoadingDetail(true)
      const detail = await getLoanDetail(loan.id)
      setLoanDetail(detail)
    } catch (error) {
      toast.error('Gagal memuat detail pinjaman')
      onClose()
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB')
      return
    }

    setProofFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async () => {
    await onConfirm(proofFile || undefined)
    setProofFile(null)
    setStep('confirm')
    setLoanDetail(null)
  }

  const handleBackToStep1 = () => {
    setStep('confirm')
  }

  const handleProceedToStep2 = () => {
    setStep('proof')
  }

  const handleClose = () => {
    setStep('confirm')
    setProofFile(null)
    setLoanDetail(null)
    onClose()
  }

  const CurrencyFormat = ({ value }: { value: string }) => {
    try {
      const num = parseFloat(value)
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num)
    } catch {
      return value
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cairkan Pinjaman</h2>
            <p className="text-sm text-gray-600">
              {step === 'confirm' ? 'Langkah 1: Konfirmasi Detail Pinjaman' : 'Langkah 2: Unggah Bukti Pencairan'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-600 mt-3">Memuat detail pinjaman...</p>
                </div>
              ) : loanDetail ? (
                <>
                  {/* Loan Summary */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE' }}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Loan ID</span>
                        <span className="text-sm font-semibold text-gray-900">{loanDetail.loan_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nama Member</span>
                        <span className="text-sm font-semibold text-gray-900">{loanDetail.member_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kategori</span>
                        <span className="text-sm font-semibold text-gray-900">{loanDetail.category_display}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tenor</span>
                        <span className="text-sm font-semibold text-gray-900">{loanDetail.tenor} Bulan</span>
                      </div>
                      <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #E0F2FE' }}>
                        <span className="text-sm font-semibold text-gray-700">Nominal Pencairan</span>
                        <span className="text-base font-bold text-green-600">
                          <CurrencyFormat value={loanDetail.amount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cicilan Perbulan</span>
                        <span className="text-sm font-semibold text-gray-900">
                          <CurrencyFormat value={loanDetail.monthly_installment} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Pembayaran (+ Bunga)</span>
                        <span className="text-sm font-semibold text-gray-900">
                          <CurrencyFormat value={loanDetail.total_repayment} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Installment Schedule */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Jadwal Cicilan</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-2 text-gray-600">Cicilan</th>
                            <th className="text-left py-2 px-2 text-gray-600">Jatuh Tempo</th>
                            <th className="text-right py-2 px-2 text-gray-600">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanDetail.installment_schedule.map((inst) => (
                            <tr key={inst.installment_number} className="border-b border-gray-100">
                              <td className="py-2 px-2 text-gray-900">#{inst.installment_number}</td>
                              <td className="py-2 px-2 text-gray-600">{inst.due_date}</td>
                              <td className="py-2 px-2 text-right text-gray-900">
                                <CurrencyFormat value={inst.amount} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Warning */}
                  <div
                    className="p-3 rounded-lg flex gap-3"
                    style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
                  >
                    <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-orange-800">
                      Pastikan data pinjaman sudah benar. Pencairan tidak dapat dibatalkan setelah dikonfirmasi.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Step 2: Proof Upload */}
          {step === 'proof' && loanDetail && (
            <div className="space-y-6">
              {/* Bank Account Info */}
              {loanDetail.member_bank_account && (
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE' }}
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Rekening Tujuan Pencairan</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank</span>
                      <span className="text-sm font-semibold text-gray-900">{loanDetail.member_bank_account.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nomor Rekening</span>
                      <span className="text-sm font-semibold text-gray-900">{loanDetail.member_bank_account.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Atas Nama</span>
                      <span className="text-sm font-semibold text-gray-900">{loanDetail.member_bank_account.account_holder}</span>
                    </div>
                    <div
                      className="flex justify-between pt-2"
                      style={{ borderTop: '1px solid #E0F2FE' }}
                    >
                      <span className="text-sm font-semibold text-gray-700">Nominal Pencairan</span>
                      <span className="text-base font-bold text-green-600">
                        <CurrencyFormat value={loanDetail.amount} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  Bukti Transfer dari Koperasi (Opsional)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                    className="hidden"
                  />

                  {proofFile ? (
                    <div className="space-y-2">
                      <FileText className="mx-auto text-blue-600" size={32} />
                      <p className="font-medium text-sm text-gray-900">{proofFile.name}</p>
                      <p className="text-xs text-gray-600">
                        {(proofFile.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setProofFile(null)
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Hapus File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-gray-400" size={32} />
                      <p className="font-medium text-sm text-gray-900">
                        Drag and drop file di sini
                      </p>
                      <p className="text-xs text-gray-600">
                        atau klik untuk memilih (JPG, PNG, PDF max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div
                className="p-3 rounded-lg flex gap-3"
                style={{ backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}
              >
                <div className="w-5 h-5 flex-shrink-0 text-green-600 text-lg">✓</div>
                <p className="text-sm text-green-800">
                  Siap untuk melakukan pencairan dana. Klik "Proses Pencairan" untuk melanjutkan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          {step === 'proof' && (
            <button
              onClick={handleBackToStep1}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="inline mr-2" size={16} />
              Kembali
            </button>
          )}

          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            Batal
          </button>

          {step === 'confirm' && (
            <button
              onClick={handleProceedToStep2}
              disabled={loading || loadingDetail}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              Lanjutkan →
            </button>
          )}

          {step === 'proof' && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                'Proses Pencairan'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
