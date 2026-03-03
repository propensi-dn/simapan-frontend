'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterData } from '@/app/(auth)/register/page'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const schema = z.object({
  nik: z.string()
    .min(16, 'NIK must be 16 digits')
    .max(16, 'NIK must be 16 digits')
    .regex(/^\d+$/, 'NIK must contain numbers only'),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<RegisterData>
  onNext: (data: Partial<RegisterData>) => void
  onBack: () => void
}

// ── Icons ──────────────────────────────────────────────────────────────────
const UploadCloudIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const SwapIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

// ── FileUploadZone ─────────────────────────────────────────────────────────
interface FileUploadZoneProps {
  label: string
  hint: string
  accept: string
  acceptLabels: string[]
  requirements: string[]
  value: File | null
  preview: string | null
  onChange: (file: File, preview: string) => void
  onRemove: () => void
  error?: string
}

function FileUploadZone({
  label, hint, accept, acceptLabels, requirements,
  value, preview, onChange, onRemove, error,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')

  const handleFile = (file: File) => {
    setFileError('')
    if (file.size > MAX_SIZE) { setFileError('File size must not exceed 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => onChange(file, reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFileError('')
    onRemove()
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayError = fileError || error

  return (
    <div>
      {/* Label row — same style as Step2 labels */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
          {label}
        </label>
        {value && (
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#10B981' }}><CheckIcon /></span>
            <span className="text-xs font-semibold" style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}>
              Uploaded
            </span>
          </div>
        )}
      </div>

      {/* ── Empty: drop zone ── */}
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all"
          style={{
            border: `1.5px dashed ${displayError ? '#FCA5A5' : dragOver ? '#11447D' : '#d1d5db'}`,
            backgroundColor: dragOver ? '#EFF6FF' : displayError ? '#FFF5F5' : '#fafafa',
          }}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              backgroundColor: dragOver ? '#DBEAFE' : '#F3F4F6',
              color: dragOver ? '#11447D' : '#6B7280',
            }}
          >
            <UploadCloudIcon />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
              {hint}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
              Drag & drop or{' '}
              <span style={{ color: '#11447D', fontWeight: 600 }}>click to browse</span>
              {' '}— max. 5MB
            </p>
          </div>

          {/* Format pills */}
          <div className="flex gap-1.5 flex-shrink-0">
            {acceptLabels.map(l => (
              <span key={l} className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* ── Filled: preview ── */
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #E5E7EB' }}>
          <div className="relative" style={{ backgroundColor: '#F3F4F6' }}>
            <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: '200px' }} />
            <div
              className="absolute inset-x-0 bottom-0"
              style={{ height: '48px', background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #F3F4F6' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#F0FDF4', color: '#10B981' }}>
              <CheckIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                {value?.name}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
                {value ? (value.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#F3F4F6', color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                <SwapIcon /> Replace
              </button>
              <button type="button" onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#FEF2F2', color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                <TrashIcon /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />

      {/* Error */}
      {displayError && (
        <p className="text-xs mt-1" style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
          {displayError}
        </p>
      )}

      {/* Requirements — hidden after upload */}
      {!preview && (
        <div className="mt-2 rounded-xl px-4 py-3 space-y-1"
          style={{ backgroundColor: '#f9fafb', borderLeft: '3px solid #d1d5db' }}>
          <p className="text-xs font-bold mb-1.5"
            style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
            REQUIREMENTS:
          </p>
          {requirements.map((req, i) => (
            <p key={i} className="text-xs" style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
              {req}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step3Documents ─────────────────────────────────────────────────────────
export default function Step3Documents({ defaultValues, onNext, onBack }: Props) {
  const [ktpFile,     setKtpFile]     = useState<File | null>(defaultValues.ktp_image    || null)
  const [ktpPreview,  setKtpPreview]  = useState<string | null>(null)
  const [ktpError,    setKtpError]    = useState('')

  const [selfieFile,    setSelfieFile]    = useState<File | null>(defaultValues.selfie_image || null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [selfieError,   setSelfieError]   = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nik: defaultValues.nik || '' },
  })

  const onSubmit = (data: FormData) => {
    if (!ktpFile)    { setKtpError('ID card photo is required');   return }
    setKtpError('')
    if (!selfieFile) { setSelfieError('Selfie photo is required'); return }
    setSelfieError('')
    onNext({ ...data, ktp_image: ktpFile, selfie_image: selfieFile })
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10" style={{ border: '1px solid #f3f4f6' }}>

      {/* Header — matches Step2 exactly */}
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-1"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Identity &amp; Documents
        </h2>
        <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          Please upload a clear photo of your ID card and a selfie holding it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* KTP Upload */}
        <FileUploadZone
          label="ID Card (KTP)"
          hint="Upload a photo of your National ID Card"
          accept=".jpg,.jpeg,.png,.pdf"
          acceptLabels={['JPG', 'PNG', 'PDF']}
          requirements={[
            'Must be a valid, non-expired National ID Card (KTP)',
            'All text and details must be clearly legible',
            'Max file size: 5MB',
          ]}
          value={ktpFile}
          preview={ktpPreview}
          onChange={(file, prev) => { setKtpFile(file); setKtpPreview(prev); setKtpError('') }}
          onRemove={() => { setKtpFile(null); setKtpPreview(null) }}
          error={ktpError}
        />

        {/* NIK — same input style as Step2 fields */}
        <div>
          <label className="block text-sm font-semibold mb-1.5"
            style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            NIK (National ID Number)
          </label>
          <input
            {...register('nik')}
            placeholder="Enter your 16-digit NIK"
            inputMode="numeric"
            maxLength={16}
            className="input-base"
          />
          {errors.nik && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nik.message}</p>
          )}
        </div>

        {/* Selfie Upload */}
        <FileUploadZone
          label="Selfie with ID Card"
          hint="Upload a photo of yourself holding your ID card"
          accept=".jpg,.jpeg,.png"
          acceptLabels={['JPG', 'PNG']}
          requirements={[
            'Your face and ID card must both be clearly visible',
            'Photo must not be blurry or poorly lit',
            'Max file size: 5MB',
          ]}
          value={selfieFile}
          preview={selfiePreview}
          onChange={(file, prev) => { setSelfieFile(file); setSelfiePreview(prev); setSelfieError('') }}
          onRemove={() => { setSelfieFile(null); setSelfiePreview(null) }}
          error={selfieError}
        />

        {/* Buttons — identical to Step2 */}
        <div className="flex justify-between pt-4">
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