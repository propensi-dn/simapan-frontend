'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

// Icons
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
)

// Schema validasi
const forgotSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true)
    try {
      await api.post('/auth/password/forgot/', { email: data.email })
      setSubmitted(true)
      toast.success('Link reset password telah dikirim ke email Anda.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengirim link reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 animate-slide-up">

            {/* Logo area */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-text-tertiary mb-4">
                <KeyIcon />
              </div>
              <h1 className="font-heading font-bold text-h5 text-text-primary">
                Lupa Password
              </h1>
              <p className="font-body text-sm text-text-secondary mt-1 text-center">
                Masukkan email terdaftar Anda. Kami akan mengirimkan link untuk reset password.
              </p>
            </div>

            {submitted ? (
              <div className="space-y-5">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <p className="font-body text-sm text-green-800">
                    Apabila email <strong>{getValues('email')}</strong> terdaftar, link reset password telah dikirim ke inbox Anda.
                  </p>
                  <p className="font-body text-xs text-green-700 mt-2">
                    Silakan cek email (termasuk folder spam). Link berlaku selama 1 jam.
                  </p>
                </div>

                <Link href="/login" className="block">
                  <Button
                    fullWidth
                    className="bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
                  >
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Alamat Email"
                  type="email"
                  placeholder="name@company.com"
                  leftIcon={<EmailIcon />}
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={!isValid}
                  className="mt-2 bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
                >
                  Kirim Link Reset
                </Button>
              </form>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
            </div>

            <p className="text-center font-body text-sm text-text-secondary">
              Ingat password Anda?{' '}
              <Link
                href="/login"
                className="font-semibold text-text-primary hover:text-primary transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}