'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegisterData } from '@/app/(auth)/register/page'

const schema = z.object({
  phone_number: z.string()
    .min(1, 'Nomor telepon wajib diisi')
    .regex(/^\d+$/, 'Nomor telepon hanya boleh angka'),
  home_address: z.string().min(1, 'Alamat wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  postal_code: z.string().min(1, 'Kode pos wajib diisi'),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<RegisterData>
  onNext: (data: Partial<RegisterData>) => void
  onBack: () => void
}

export default function Step2ContactInfo({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_number: defaultValues.phone_number || '',
      home_address: defaultValues.home_address || '',
      city: defaultValues.city || '',
      postal_code: defaultValues.postal_code || '',
    },
  })

  const onSubmit = (data: FormData) => onNext(data)

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10" style={{ border: '1px solid #f3f4f6' }}>
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Informasi Kontak
        </h2>
        <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          Silakan isi detail kontak aktif agar kami dapat menghubungi Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Nomor Telepon
          </label>
          <input
            {...register('phone_number')}
            placeholder="contoh: 0812..."
            inputMode="numeric"
            className="input-base"
          />
          {errors.phone_number && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.phone_number.message}</p>}
        </div>

        {/* Home Address */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
            Alamat Rumah
          </label>
          <textarea
            {...register('home_address')}
            placeholder="Nama jalan, nomor rumah..."
            rows={3}
            className="input-base resize-none"
          />
          {errors.home_address && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.home_address.message}</p>}
        </div>

        {/* City + Postal Code side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              Kota
            </label>
            <input
              {...register('city')}
              placeholder="contoh: Jakarta"
              className="input-base"
            />
            {errors.city && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              Kode Pos
            </label>
            <input
              {...register('postal_code')}
              placeholder="contoh: 12345"
              className="input-base"
            />
            {errors.postal_code && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.postal_code.message}</p>}
          </div>
        </div>

        {/* Buttons */}
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
            Kembali
          </button>
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