'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Step1BasicInfo from '@/components/forms/register/Step1BasicInfo'
import Step2ContactInfo from '@/components/forms/register/Step2ContactInfo'
import Step3Documents from '@/components/forms/register/Step3Documents'
import Step4AccountInfo from '@/components/forms/register/Step4AccountInfo'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

export type RegisterData = {
  // Step 1
  full_name: string
  place_of_birth: string
  date_of_birth: string
  gender: 'M' | 'F'
  occupation: string
  // Step 2
  phone_number: string
  home_address: string
  city: string
  postal_code: string
  // Step 3
  nik: string
  ktp_image: File | null
  selfie_image: File | null
  // Step 4
  email: string
  password: string
  confirm_password: string
}

const STEPS = [
  { number: 1, label: 'Step 1', sub: 'BASIC INFO' },
  { number: 2, label: 'Step 2', sub: 'CONTACT INFO' },
  { number: 3, label: 'Step 3', sub: 'DOCUMENTS' },
  { number: 4, label: 'Step 4', sub: 'ACCOUNT INFO' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const isDone = currentStep > step.number
        const isActive = currentStep === step.number
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step.number} className="flex items-start">
            {/* Step circle + label */}
            <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                style={{
                  border: isDone || isActive ? '2px solid #242F43' : '2px solid #d1d5db',
                  backgroundColor: isDone ? '#242F43' : 'transparent',
                  color: isDone ? '#fff' : isActive ? '#242F43' : '#9ca3af',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {isDone ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.number}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-semibold" style={{
                  color: isActive ? '#242F43' : isDone ? '#525E71' : '#9ca3af',
                  fontFamily: 'Montserrat, sans-serif',
                }}>
                  {step.label}
                </div>
                <div className="text-xs" style={{
                  color: isActive ? '#242F43' : '#9ca3af',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.05em',
                }}>
                  {step.sub}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                height: 2,
                width: 120,
                marginTop: 19,
                backgroundColor: currentStep > step.number ? '#242F43' : '#e5e7eb',
                transition: 'background-color 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<RegisterData>>({})

  const handleNext = (data: Partial<RegisterData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (lastData: Partial<RegisterData>) => {
    const finalData = { ...formData, ...lastData }
    setLoading(true)

    try {
      const fd = new FormData()
      Object.entries(finalData).forEach(([key, value]) => {
        if (value instanceof File) {
          fd.append(key, value)
        } else if (value !== undefined && value !== null) {
          fd.append(key, String(value))
        }
      })

      await api.post('/members/register/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Registrasi berhasil! Data sedang menunggu verifikasi.')
      router.push('/status')
    } catch (err: any) {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        toast.error('Registrasi gagal. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFDFF' }}>
      <Navbar />

      {/* Page header */}
      <div style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fff', padding: '16px 32px' }}>
        <h1 className="font-bold text-xl" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          New Registration
        </h1>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Step content */}
        {step === 1 && (
          <Step1BasicInfo
            defaultValues={formData}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <Step2ContactInfo
            defaultValues={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step3Documents
            defaultValues={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <Step4AccountInfo
            defaultValues={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            loading={loading}
          />
        )}

        {/* Footer */}
        <p className="text-center text-sm mt-10" style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
          Need help? Contact our support at{' '}
          <a href="mailto:propensi.ksb@gmail.com" style={{ color: '#11447D', textDecoration: 'underline' }}>
            propensi.ksb@gmail.com
          </a>
        </p>
      </main>
    </div>
  )
}
