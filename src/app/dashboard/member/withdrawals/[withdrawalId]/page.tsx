'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'

type Profile = {
  full_name: string
  member_id: string | null
  profile_picture: string | null
}

type WithdrawalDetail = {
  id: number
  saving_id: string
  amount: string
  status: 'PENDING' | 'SUCCESS' | 'REJECTED'
  submitted_at: string
  member_bank_name?: string
  member_account_number?: string
  transfer_proof_url?: string | null
  description?: string
  source?: 'SAVINGS_WITHDRAWAL' | string
}

type SavingsOverviewResponse = {
  next: string | null
  results: WithdrawalDetail[]
}

const fmtRp = (value: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MemberWithdrawalDetailPage() {
  const params = useParams<{ withdrawalId: string }>()
  const withdrawalId = decodeURIComponent(params.withdrawalId || '')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [item, setItem] = useState<WithdrawalDetail | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(res => setProfile(res.data)).catch(() => {})
  }, [])

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      let page = 1
      let found: WithdrawalDetail | null = null

      while (page <= 50 && !found) {
        const { data } = await api.get<SavingsOverviewResponse>('/savings/overview/', {
          params: { page, page_size: 50 },
        })

        found = (data.results || []).find(
          (row) => row.source === 'SAVINGS_WITHDRAWAL' && row.saving_id === withdrawalId,
        ) || null

        if (!data.next) break
        page += 1
      }

      if (!found) {
        setError('Data penarikan tidak ditemukan.')
        setItem(null)
      } else {
        setItem(found)
      }
    } catch {
      setError('Gagal memuat detail penarikan.')
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [withdrawalId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const statusPill = useMemo(() => {
    if (!item) return null
    if (item.status === 'PENDING') {
      return { label: 'Menunggu', bg: '#FEF3C7', text: '#92400E' }
    }
    return { label: 'Berhasil', bg: '#DCFCE7', text: '#166534' }
  }, [item])

  return (
    <DashboardLayout
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={profile?.member_id ? `#${profile.member_id}` : ''}
      avatarUrl={profile?.profile_picture || undefined}
    >
      <DashboardHeader
        variant="detail"
        parentLabel="Riwayat Penarikan"
        parentHref="/dashboard/member/withdrawals"
        currentLabel={withdrawalId || 'Detail Penarikan'}
        notifCount={0}
      />

      <main className="flex-1 p-8 space-y-6">
        {loading ? (
          <p className="text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>Memuat detail...</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>{error}</p>
            <Link href="/dashboard/member/withdrawals" className="text-sm font-semibold" style={{ color: '#11447D' }}>
              Kembali ke daftar penarikan
            </Link>
          </div>
        ) : item ? (
          <>
            <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1F5F9' }}>
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Status Timeline
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Diajukan</p>
                  <p className="text-sm font-semibold" style={{ color: '#1E293B' }}>{fmtDate(item.submitted_at)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Diproses Petugas</p>
                  <p className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                    {item.status === 'PENDING' ? 'Sedang diproses' : 'Sudah diproses'}
                  </p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Status Akhir</p>
                  {statusPill && (
                    <span className="mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: statusPill.bg, color: statusPill.text }}>
                      {statusPill.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Informasi Penarikan
                </h3>
                <div className="mt-4 space-y-3 text-sm" style={{ fontFamily: 'Inter, sans-serif', color: '#334155' }}>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: '#8E99A8' }}>ID Penarikan</span>
                    <span className="font-semibold">{item.saving_id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: '#8E99A8' }}>Nominal</span>
                    <span className="font-semibold">{fmtRp(item.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: '#8E99A8' }}>Tanggal</span>
                    <span>{fmtDate(item.submitted_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: '#8E99A8' }}>Bank Tujuan</span>
                    <span>{item.member_bank_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: '#8E99A8' }}>Nomor Rekening</span>
                    <span>{item.member_account_number || '-'}</span>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F8FAFC' }}>
                    <p className="text-xs mb-1" style={{ color: '#8E99A8' }}>Keterangan</p>
                    <p className="text-sm">{item.description || 'Penarikan simpanan sukarela'}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5" style={{ border: '1px solid #F1F5F9' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                  Bukti Transfer
                </h3>
                <div className="mt-4 min-h-[280px] rounded-xl border border-dashed p-4" style={{ borderColor: '#CBD5E1' }}>
                  {item.transfer_proof_url ? (
                    item.transfer_proof_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="flex h-full min-h-[240px] items-center justify-center">
                        <a
                          href={item.transfer_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border px-4 py-2 text-sm font-semibold"
                          style={{ borderColor: '#E2E8F0', color: '#475569' }}
                        >
                          Buka PDF di tab baru
                        </a>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.transfer_proof_url} alt="Bukti Transfer" className="mx-auto max-h-[320px] rounded-lg" />
                    )
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center text-center">
                      <p className="text-sm" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                        Bukti transfer belum tersedia.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </main>
    </DashboardLayout>
  )
}
