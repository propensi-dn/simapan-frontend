'use client'
import { useState } from 'react'
import Step1BasicInfo from './Step1BasicInfo'
import Step2ContactInfo from './Step2ContactInfo'
import Step3Documents from './Step3Documents'
import Step4AccountInfo from './Step4AccountInfo'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export type RegisterData = {
  // Step 1
  full_name: string; place_of_birth: string; date_of_birth: string
  gender: 'M' | 'F'; occupation: string
  // Step 2
  phone_number: string; home_address: string; city: string; postal_code: string
  // Step 3
  nik: string; ktp_image: File | null
  // Step 4
  email: string; password: string; confirm_password: string
}

const STEPS = ['Basic Info', 'Contact Info', 'Documents', 'Account Info']

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Partial<RegisterData>>({})

  const next = (data: Partial<RegisterData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(s => s + 1)
  }
  const back = () => setStep(s => s - 1)

  const submit = async (lastStepData: Partial<RegisterData>) => {
    const finalData = { ...formData, ...lastStepData }
    const fd = new FormData()
    Object.entries(finalData).forEach(([k, v]) => {
      if (v instanceof File) fd.append(k, v)
      else if (v !== undefined) fd.append(k, String(v))
    })
    try {
      await api.post('/members/register/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Registrasi berhasil! Data sedang diverifikasi.')
      router.push('/status')
    } catch (err: any) {
      toast.error('Registrasi gagal. Periksa kembali data Anda.')
    }
  }

  return (
    <div className='max-w-lg mx-auto p-6'>
      {/* Progress Steps */}
      <div className='flex mb-8'>
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 text-center text-xs py-2
            ${i <= step ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'border-b-2 border-gray-200 text-gray-400'}`}>
            {i + 1}. {s}
          </div>
        ))}
      </div>
      {/* Render step sesuai index */}
      {step === 0 && <Step1BasicInfo onNext={next} defaultValues={formData} />}
      {step === 1 && <Step2ContactInfo onNext={next} onBack={back} defaultValues={formData} />}
      {step === 2 && <Step3Documents onNext={next} onBack={back} defaultValues={formData} />}
      {step === 3 && <Step4AccountInfo onSubmit={submit} onBack={back} defaultValues={formData} />}
    </div>
  )
}
