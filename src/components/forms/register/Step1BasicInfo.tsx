'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterData } from '@/app/(auth)/register/page'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  place_of_birth: z.string().min(1, 'Tempat lahir wajib diisi'),
  date_of_birth: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.enum(['M', 'F'], { error: 'Gender wajib dipilih' }),
  occupation: z.string().min(1, 'Pekerjaan wajib diisi'),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<RegisterData>
  onNext: (data: Partial<RegisterData>) => void
}

export default function Step1BasicInfo({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: defaultValues.full_name || '',
      place_of_birth: defaultValues.place_of_birth || '',
      date_of_birth: defaultValues.date_of_birth || '',
      gender: defaultValues.gender,
      occupation: defaultValues.occupation || '',
    },
  })

  const onSubmit = (data: FormData) => onNext(data)

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10" style={{ border: '1px solid #f3f4f6' }}>
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Informasi Pribadi
        </h2>
        <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          Silakan isi data diri Anda dengan benar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Nama Lengkap
          </label>
          <input
            {...register('full_name')}
            placeholder="contoh: Budi Santoso"
            className="input-base"
          />
          {errors.full_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.full_name.message}</p>}
        </div>

        {/* Place of Birth */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Tempat Lahir
          </label>
          <input
            {...register('place_of_birth')}
            placeholder="Kota"
            className="input-base"
          />
          {errors.place_of_birth && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.place_of_birth.message}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Tanggal Lahir
          </label>
          <input
            {...register('date_of_birth')}
            type="date"
            className="input-base"
          />
          {errors.date_of_birth && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.date_of_birth.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Jenis Kelamin
          </label>
          <div className="flex gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="M"
                {...register('gender')}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#242F43' }}
              />
              <span className="text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>Laki-laki</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="F"
                {...register('gender')}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: '#242F43' }}
              />
              <span className="text-sm" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>Perempuan</span>
            </label>
          </div>
          {errors.gender && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.gender.message}</p>}
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Pekerjaan
          </label>
          <input
            {...register('occupation')}
            placeholder="Pekerjaan saat ini"
            className="input-base"
          />
          {errors.occupation && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.occupation.message}</p>}
        </div>

        {/* Next button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ backgroundColor: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
          >
            Lanjut
          </button>
        </div>
      </form>
    </div>
  )
}
