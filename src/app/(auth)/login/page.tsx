'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'

type LoginAlert = {
  type: 'warning' | 'error'
  message: string
  detail?: string
  statusHref?: string
}

// Icons
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
)

// Schema validasi
const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

// Role → redirect path
const ROLE_REDIRECT: Record<string, string> = {
  MEMBER: '/dashboard/member',
  STAFF: '/dashboard/staff',
  MANAGER: '/dashboard/manager',
  CHAIRMAN: '/dashboard/chairman',
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loginAlert, setLoginAlert] = useState<LoginAlert | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setLoginAlert(null)
    try {
      const res = await api.post('/auth/login/', {
        email: data.email,
        password: data.password,
      })

      Cookies.set('access_token', res.data.access, { expires: data.rememberMe ? 7 : 1 })
      Cookies.set('refresh_token', res.data.refresh, { expires: 7 })
      Cookies.set('user_role', res.data.role, { expires: data.rememberMe ? 7 : 1 })
      Cookies.set('user_email', res.data.email, { expires: data.rememberMe ? 7 : 1 })

      toast.success('Login berhasil!')
      router.push(ROLE_REDIRECT[res.data.role] || '/dashboard')

    } catch (err: any) {
      const message: string = err.response?.data?.message || ''

      if (message.includes('belum diverifikasi')) {
        setLoginAlert({
          type: 'warning',
          message: 'Akun Anda sedang menunggu verifikasi.',
          detail: 'Pendaftaran Anda sedang ditinjau oleh petugas. Silakan cek halaman status untuk informasi terkini.',
          statusHref: `/status?email=${encodeURIComponent(data.email)}`,
        })
      } else if (message.includes('ditolak')) {
        setLoginAlert({
          type: 'error',
          message: 'Pendaftaran Anda ditolak.',
          detail: 'Akun Anda tidak dapat diaktifkan. Silakan hubungi petugas KSB untuk informasi lebih lanjut.',
          statusHref: `/status?email=${encodeURIComponent(data.email)}`,
        })
      } else if (message.includes('tidak aktif')) {
        setLoginAlert({
          type: 'error',
          message: 'Akun Anda sudah tidak aktif.',
          detail: 'Silakan hubungi petugas KSB untuk mengaktifkan kembali akun Anda.',
        })
      } else if (message.includes('Email atau password salah') || !message) {
        setLoginAlert({
          type: 'error',
          message: 'Email atau password salah.',
          detail: 'Periksa kembali email dan password Anda, lalu coba lagi.',
        })
      } else {
        setLoginAlert({ type: 'error', message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-bg-card rounded-3xl border border-gray-100 shadow-card p-10 animate-slide-up">

            {/* Logo area */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-text-tertiary mb-4">
                <BankIcon />
              </div>
              <h1 className="font-heading font-bold text-h5 text-text-primary">
                SI-MAPAN
              </h1>
              <p className="font-body text-sm text-text-secondary mt-1">
                Silakan masuk ke akun Anda.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <Input
                label="Alamat Email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                leftIcon={<EmailIcon />}
                error={errors.email?.message}
                required
                {...register('email')}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<LockIcon />}
                error={errors.password?.message}
                required
                {...register('password')}
              />

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                    {...register('rememberMe')}
                  />
                  <span className="font-body text-sm text-text-secondary">Ingat Saya</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-semibold text-text-primary hover:text-primary transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>

              {/* Login alert */}
              {loginAlert && (() => {
                const isWarning = loginAlert.type === 'warning'
                const colors = isWarning
                  ? { bg: '#FFFBEB', border: '#FCD34D', icon: '#F59E0B', iconBg: '#FEF3C7', title: '#78350F', detail: '#92400E', link: '#B45309' }
                  : { bg: '#FFF5F5', border: '#FCA5A5', icon: '#EF4444', iconBg: '#FEE2E2', title: '#7F1D1D', detail: '#991B1B', link: '#B91C1C' }
                return (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1.5px solid ${colors.border}`, backgroundColor: colors.bg }}
                  >
                    {/* Top accent bar */}
                    <div style={{ height: 3, backgroundColor: colors.icon }} />

                    <div className="flex items-start gap-3 px-4 py-3.5">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: colors.iconBg }}
                      >
                        {isWarning ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={colors.icon} strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={colors.icon} strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug" style={{ color: colors.title, fontFamily: 'Inter, sans-serif' }}>
                          {loginAlert.message}
                        </p>
                        {loginAlert.detail && (
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: colors.detail, fontFamily: 'Inter, sans-serif' }}>
                            {loginAlert.detail}
                          </p>
                        )}
                        {loginAlert.statusHref && (
                          <Link
                            href={loginAlert.statusHref}
                            className="inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                            style={{ backgroundColor: colors.iconBg, color: colors.link, fontFamily: 'Inter, sans-serif' }}
                          >
                            Cek status pendaftaran
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!isValid}
                className="mt-2 bg-text-primary hover:bg-gray-800 active:bg-gray-900 h-12 text-base"
              >
                Masuk
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
            </div>

            {/* Register link */}
            <p className="text-center font-body text-sm text-text-secondary">
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="font-semibold text-text-primary hover:text-primary transition-colors"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
