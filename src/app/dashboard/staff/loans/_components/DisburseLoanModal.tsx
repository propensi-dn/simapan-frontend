'use client'

import { useState, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { ApprovedLoan } from '@/lib/staff-api'
import { X, Upload, FileText } from 'lucide-react'

interface DisburseLoanModalProps {
  isOpen: boolean
  onClose: () => void
  loan: ApprovedLoan
  onConfirm: (proof?: File) => Promise<void>
  loading?: boolean
}

export default function DisburseLoanModal({
  isOpen,
  onClose,
  loan,
  onConfirm,
  loading = false,
}: DisburseLoanModalProps) {
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type (images and documents)
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau PDF')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB')
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cairkan Pinjaman"
      description={`Pastikan data pinjaman sudah benar sebelum mencairkan`}
      size="lg"
      confirmLabel={loading ? 'Memproses...' : 'Cairkan Dana'}
      cancelLabel="Batal"
      onConfirm={handleSubmit}
      confirmVariant="primary"
      loading={loading}
    >
      <div className="space-y-6 my-6">
        {/* Loan Summary */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE' }}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan ID</span>
              <span className="text-sm font-semibold text-gray-900">{loan.loan_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nama Member</span>
              <span className="text-sm font-semibold text-gray-900">{loan.member_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Kategori</span>
              <span className="text-sm font-semibold text-gray-900">{loan.category_display}</span>
            </div>
            <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #E0F2FE' }}>
              <span className="text-sm font-semibold text-gray-700">Nominal Pencairan</span>
              <span className="text-base font-bold text-green-600">
                <CurrencyFormat value={loan.amount} />
              </span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">
            Bukti Pencairan (Opsional)
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

        {/* Warning */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
        >
          <p className="text-sm text-orange-800">
            ⚠️ Pastikan data pinjaman sudah benar sebelum mengklik tombol "Cairkan Dana". 
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </div>
    </Modal>
  )
}
