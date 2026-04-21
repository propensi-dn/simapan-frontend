'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterData } from '@/app/(auth)/register/page'

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Password tidak cocok',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<RegisterData>
  onSubmit: (data: Partial<RegisterData>) => void
  onBack: () => void
  loading?: boolean
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

function PasswordInput({ label, placeholder, error, ...props }: any) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={`input-base pr-10 ${error ? 'input-error' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#8E99A8' }}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

export default function Step4AccountInfo({ defaultValues, onSubmit, onBack, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultValues.email || '',
      password: defaultValues.password || '',
      confirm_password: defaultValues.confirm_password || '',
    },
  })

  const handleFormSubmit = (data: FormData) => onSubmit(data)

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10" style={{ border: '1px solid #f3f4f6' }}>
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Informasi Akun
        </h2>
        <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          Silakan isi email dan password untuk akun SI-MAPAN Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Alamat Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="contoh: nama@email.com"
            className={`input-base ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Minimal 8 karakter"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Konfirmasi Password"
          placeholder="Ulangi password Anda"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {/* Password hint */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
            Ketentuan password:
          </p>
          <p className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            • Minimal 8 karakter • Mengandung huruf kapital • Mengandung angka
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{
              border: '1.5px solid #242F43',
              color: '#242F43',
              backgroundColor: 'transparent',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mengirim...
              </>
            ) : 'Kirim Pendaftaran'}
          </button>
        </div>
      </form>
    </div>
  )
}