'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

// Icons
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

// Schema validasi
const resetSchema = z
  .object({
    new_password: z.string().min(8, 'Password minimal 8 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Password dan konfirmasi tidak cocok',
    path: ['confirm_password'],
  })

type ResetFormData = z.infer<typeof resetSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  })

  // Token gak ada / invalid di URL
  if (!token) {
    return (
      <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 animate-slide-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-200 flex items-center justify-center text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-h5 text-text-primary">
            Link Tidak Valid
          </h1>
          <p className="font-body text-sm text-text-secondary mt-1 text-center">
            Link reset password tidak valid atau sudah kedaluwarsa. Silakan request link baru.
          </p>
        </div>

        <Link href="/forgot-password" className="block">
          <Button
            fullWidth
            className="bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
          >
            Request Link Baru
          </Button>
        </Link>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 animate-slide-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-h5 text-text-primary">
            Password Berhasil Diubah
          </h1>
          <p className="font-body text-sm text-text-secondary mt-1 text-center">
            Silakan login menggunakan password baru Anda.
          </p>
        </div>

        <Link href="/login" className="block">
          <Button
            fullWidth
            className="bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
          >
            Login Sekarang
          </Button>
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: ResetFormData) => {
    setLoading(true)
    try {
      await api.post('/auth/password/reset/', {
        token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      })
      setSuccess(true)
      toast.success('Password berhasil diubah!')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error
      const message = Array.isArray(errorMsg) ? errorMsg.join(' ') : errorMsg || 'Gagal reset password.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 animate-slide-up">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-text-tertiary mb-4">
          <ShieldIcon />
        </div>
        <h1 className="font-heading font-bold text-h5 text-text-primary">
          Reset Password
        </h1>
        <p className="font-body text-sm text-text-secondary mt-1 text-center">
          Buat password baru untuk akun Anda. Gunakan minimal 8 karakter.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Password Baru"
          type="password"
          placeholder="••••••••"
          leftIcon={<LockIcon />}
          error={errors.new_password?.message}
          required
          {...register('new_password')}
        />

        <Input
          label="Konfirmasi Password Baru"
          type="password"
          placeholder="••••••••"
          leftIcon={<LockIcon />}
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!isValid}
          className="mt-2 bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
        >
          Simpan Password Baru
        </Button>
      </form>

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
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 text-center">
                <p className="font-body text-sm text-text-secondary">Memuat...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}