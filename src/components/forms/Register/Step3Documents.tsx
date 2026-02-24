'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterData } from '@/app/(auth)/register/page'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const schema = z.object({
  nik: z.string()
    .min(16, 'NIK harus 16 digit')
    .max(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK hanya boleh angka'),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<RegisterData>
  onNext: (data: Partial<RegisterData>) => void
  onBack: () => void
}

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
)

function FileUploadZone({
  label,
  description,
  accept,
  acceptLabels,
  requirements,
  value,
  onChange,
  error,
}: {
  label: string
  description: string
  accept: string
  acceptLabels: string[]
  requirements: string[]
  value: File | null
  onChange: (file: File | null) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')

  const handleFile = (file: File) => {
    setFileError('')
    if (file.size > MAX_SIZE) {
      setFileError('Ukuran file maksimal 5MB')
      return
    }
    onChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #f3f4f6' }}>
      <h3 className="font-bold text-xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
        {label}
      </h3>
      <p className="text-sm mb-6" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
        {description}
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all py-10"
        style={{
          border: `2px dashed ${dragOver ? '#11447D' : '#d1d5db'}`,
          backgroundColor: dragOver ? '#f0f7ff' : '#fafafa',
        }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#f3f4f6' }}>
          <UploadIcon />
        </div>

        {value ? (
          <div className="text-center">
            <p className="text-sm font-semibold mb-1" style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
              ✓ {value.name}
            </p>
            <p className="text-xs" style={{ color: '#8E99A8' }}>
              {(value.size / 1024 / 1024).toFixed(2)} MB — Klik untuk ganti
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm mb-1" style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
              Drag and drop your file here
            </p>
            <p className="text-sm" style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
              or{' '}
              <span style={{ color: '#11447D', textDecoration: 'underline' }}>click to browse</span>
            </p>
          </div>
        )}

        {/* Format badges */}
        <div className="flex gap-2 mt-4">
          {acceptLabels.map(l => (
            <span key={l} className="px-3 py-1 rounded text-xs font-semibold"
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {(fileError || error) && (
        <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{fileError || error}</p>
      )}

      {/* Requirements box */}
      <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: '#f9fafb', borderLeft: '3px solid #d1d5db' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
          REQUIREMENTS:
        </p>
        {requirements.map((req, i) => (
          <p key={i} className="text-xs" style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
            {req}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function Step3Documents({ defaultValues, onNext, onBack }: Props) {
  const [ktpFile, setKtpFile] = useState<File | null>(defaultValues.ktp_image || null)
  const [ktpError, setKtpError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nik: defaultValues.nik || '' },
  })

  const onSubmit = (data: FormData) => {
    if (!ktpFile) {
      setKtpError('Foto KTP wajib diupload')
      return
    }
    setKtpError('')
    onNext({ ...data, ktp_image: ktpFile })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* KTP Upload */}
      <FileUploadZone
        label="Upload Identity Card (KTP)"
        description="Please ensure your document is clearly visible and all details are readable."
        accept=".jpg,.jpeg,.png,.pdf"
        acceptLabels={['JPG', 'PNG', 'PDF']}
        requirements={[
          'Max file size: 5MB',
          'Must be a valid National Identity Card (KTP)',
          'Information must be clear and not blurred',
        ]}
        value={ktpFile}
        onChange={(f) => { setKtpFile(f); setKtpError('') }}
        error={ktpError}
      />

      {/* NIK field */}
      <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #f3f4f6' }}>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
          NIK (Nomor Induk Kependudukan)
        </label>
        <input
          {...register('nik')}
          placeholder="16-digit NIK number"
          inputMode="numeric"
          maxLength={16}
          className="input-base"
        />
        {errors.nik && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nik.message}</p>}
      </div>

      {/* Buttons */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              border: '1.5px solid #242F43',
              color: '#242F43',
              backgroundColor: 'transparent',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ backgroundColor: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            Next Step
          </button>
        </div>
      </form>
    </div>
  )
}