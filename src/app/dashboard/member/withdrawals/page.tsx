'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'

type WithdrawalRow = {
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
  direction?: 'OUT' | 'IN'
}

type SavingsOverviewResponse = {
  count: number
  total_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
  results: WithdrawalRow[]
}

const fmtRp = (value: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MemberWithdrawalsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [next, setNext] = useState<string | null>(null)
  const [previous, setPrevious] = useState<string | null>(null)
  const [rows, setRows] = useState<WithdrawalRow[]>([])

  const paginationRange = useMemo(() => {
    const delta = 2
    const range: (number | '…')[] = []
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i)
    }
    if (range[0] !== 1) {
      range.unshift('…')
      range.unshift(1)
    }
    if (range[range.length - 1] !== totalPages) {
      range.push('…')
      range.push(totalPages)
    }
    return range
  }, [currentPage, totalPages])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get<SavingsOverviewResponse>('/savings/overview/', {
          params: { page },
        })

        const withdrawalRows = (data.results || []).filter(
          (item) => item.source === 'SAVINGS_WITHDRAWAL',
        )

        setRows(withdrawalRows)
        setCount(data.count)
        setTotalPages(data.total_pages || Math.max(1, Math.ceil(data.count / (data.page_size || 5))))
        setCurrentPage(data.current_page || page)
        setNext(data.next)
        setPrevious(data.previous)
      } catch {
        setError('Gagal memuat data penarikan. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [page])

  return (
    <DashboardLayout role="MEMBER">
      <DashboardHeader variant="default" title="Riwayat Penarikan" notifCount={0} />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Penarikan Simpanan Sukarela
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Lihat status penarikan dan bukti transfer dari petugas.
          </p>
        </div>

        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              Daftar Penarikan
            </h3>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
              Memuat data...
            </p>
          ) : error ? (
            <p className="px-6 py-8 text-sm" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
          ) : rows.length === 0 ? (
            <p className="px-6 py-8 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
              Belum ada data penarikan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">ID Penarikan</th>
                    <th className="px-6 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-6 py-3 text-right font-medium">Nominal</th>
                    <th className="px-6 py-3 text-left font-medium">Tujuan Transfer</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.id}-${row.saving_id}`} style={{ borderBottom: idx < rows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td className="px-6 py-4" style={{ color: '#334155' }}>{row.saving_id}</td>
                      <td className="px-6 py-4" style={{ color: '#334155' }}>{fmtDate(row.submitted_at)}</td>
                      <td className="px-6 py-4 text-right font-semibold" style={{ color: '#0F172A' }}>{fmtRp(row.amount)}</td>
                      <td className="px-6 py-4" style={{ color: '#334155' }}>
                        {row.member_bank_name ? `${row.member_bank_name} (${row.member_account_number || '-'})` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'PENDING' ? (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Menunggu
                          </span>
                        ) : (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                            Berhasil
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/member/withdrawals/${encodeURIComponent(row.saving_id)}`}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: '#E2E8F0', color: '#475569' }}
                        >
                          Lihat Penarikan
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-3 flex items-center justify-between text-sm" style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            <span>
              Halaman {currentPage} dari {totalPages} • {count} total data
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1 || !previous}
                onClick={() => setPage((prevPage) => Math.max(1, prevPage - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                ‹
              </button>

              {paginationRange.map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: p === currentPage ? '#242F43' : 'transparent',
                      color: p === currentPage ? '#FFFFFF' : '#525E71',
                      border: p === currentPage ? 'none' : '1px solid #E5E7EB',
                    }}>
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage === totalPages || !next}
                onClick={() => setPage((prevPage) => Math.min(totalPages, prevPage + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                ›
              </button>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}
