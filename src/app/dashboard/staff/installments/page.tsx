'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getPendingInstallmentPayments,
  StaffInstallmentPaymentItem,
  StaffInstallmentStatus,
} from '@/lib/staff-api'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { CalendarDays, Search } from 'lucide-react'

type InstallmentStatusTab = 'PENDING' | 'PAID' | 'REJECTED' | 'ALL'

const STATUS_TABS: Array<{ key: InstallmentStatusTab; label: string }> = [
  { key: 'PENDING', label: 'Menunggu Verifikasi' },
  { key: 'PAID', label: 'Terverifikasi' },
  { key: 'REJECTED', label: 'Ditolak' },
  { key: 'ALL', label: 'Semua' },
]

const formatCurrency = (value: string): string => {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return value
  }
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeMessage = (error as { response?: { data?: { error?: unknown } } }).response?.data?.error
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }
  }
  return fallback
}

const StatusBadge = ({ status }: { status: StaffInstallmentStatus }) => {
  const styles: Record<StaffInstallmentStatus, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Menunggu Verifikasi' },
    PAID: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Terverifikasi' },
    UNPAID: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Ditolak' },
  }

  const style = styles[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: style.bg, color: style.text, fontFamily: 'Inter, sans-serif' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
      {style.label}
    </span>
  )
}

export default function StaffInstallmentsPage() {
  const [rows, setRows] = useState<StaffInstallmentPaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<InstallmentStatusTab>('PENDING')

  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  const load = useCallback(async (targetPage: number) => {
    const scope = statusTab === 'PENDING' ? 'pending' : statusTab === 'ALL' ? 'all' : 'history'
    const rejectedOnly = statusTab === 'REJECTED'
    const status = statusTab === 'PAID' ? 'PAID' : statusTab === 'REJECTED' ? 'UNPAID' : undefined

    try {
      setLoading(true)
      const data = await getPendingInstallmentPayments({
        scope,
        page: targetPage,
        page_size: pageSize,
        search: searchQ || undefined,
        status,
        rejected_only: rejectedOnly || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })

      setRows(data.results)
      setCount(data.count)
      setTotalPages(Math.max(data.total_pages, 1))
      setPage(data.current_page)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat daftar pembayaran cicilan.'))
    } finally {
      setLoading(false)
    }
  }, [searchQ, startDate, endDate, statusTab])

  useEffect(() => {
    load(1)
  }, [load])

  const showingFrom = useMemo(() => {
    if (count === 0) return 0
    return (page - 1) * pageSize + 1
  }, [count, page])

  const showingTo = useMemo(() => {
    if (count === 0) return 0
    return Math.min(page * pageSize, count)
  }, [count, page])

  const pageButtons = useMemo(() => {
    const buttons: number[] = []
    const start = Math.max(1, page - 1)
    const end = Math.min(totalPages, page + 1)
    for (let i = start; i <= end; i++) buttons.push(i)
    return buttons
  }, [page, totalPages])

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault()
    setSearchQ(searchInput.trim())
    setStartDate(startDateInput)
    setEndDate(endDateInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchQ('')
    setStartDateInput('')
    setEndDateInput('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader
        variant="default"
        title="Pembayaran Cicilan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8 bg-[#F8FAFC] min-h-screen space-y-6">
        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="flex" style={{ borderBottom: '1px solid #F1F5F9' }}>
            {STATUS_TABS.map((tab) => {
              const active = statusTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusTab(tab.key)
                    setPage(1)
                  }}
                  className="px-5 py-4 text-sm font-semibold transition-colors"
                  style={{
                    color: active ? '#11447D' : '#8E99A8',
                    borderBottom: active ? '2px solid #11447D' : '2px solid transparent',
                    marginBottom: -1,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4" style={{ border: '1px solid #F1F5F9' }}>
          <form onSubmit={applyFilters} className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0BAC5]" size={16} />
              <input
                type="text"
                placeholder="Cari nama anggota, ID pinjaman, atau tanggal..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={16} />
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(event) => setStartDateInput(event.target.value)}
                  className="w-36 pl-9 pr-2 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <span className="text-sm" style={{ color: '#8E99A8' }}>-</span>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={16} />
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(event) => setEndDateInput(event.target.value)}
                  className="w-36 pl-9 pr-2 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            <Button type="submit" size="sm" variant="secondary" className="rounded-xl px-5">
              Terapkan Filter
            </Button>

            <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={clearFilters}>
              Atur Ulang
            </Button>
          </form>
        </section>

        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              {statusTab === 'PENDING' ? 'Laporan Pembayaran Menunggu Verifikasi' : 'Riwayat Verifikasi Pembayaran'}
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ color: '#8E99A8', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
            >
              {count} HASIL
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  {[
                    statusTab === 'PENDING' ? 'TANGGAL KIRIM' : 'TERAKHIR DIPERBARUI',
                    'NAMA ANGGOTA',
                    'ID PINJAMAN',
                    'JUMLAH DIBAYAR',
                    'STATUS',
                    'AKSI',
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-[11px] font-semibold"
                      style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Memuat data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Tidak ada pembayaran cicilan untuk filter saat ini.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(statusTab === 'PENDING' ? row.submitted_at : row.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {row.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                        <Link href={`/dashboard/staff/loans/${row.loan_pk}`} className="font-semibold" style={{ color: '#11447D' }}>
                          {row.loan_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'PENDING' ? (
                          <Link
                            href={`/dashboard/staff/installments/${row.id}`}
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#EA580C', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                          >
                            Tinjau
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/staff/installments/${row.id}`}
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#111827', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                          >
                            Detail
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}>
            <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Menampilkan {showingFrom} sampai {showingTo} dari {count} data
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => load(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="w-7 h-7 text-sm rounded-md disabled:opacity-40"
                style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
              >
                ‹
              </button>

              {pageButtons.map((buttonPage) => (
                <button
                  key={buttonPage}
                  onClick={() => load(buttonPage)}
                  className="w-7 h-7 text-xs rounded-md font-semibold"
                  style={{
                    backgroundColor: buttonPage === page ? '#EA580C' : '#FFFFFF',
                    color: buttonPage === page ? '#FFFFFF' : '#6B7280',
                    border: buttonPage === page ? 'none' : '1px solid #E5E7EB',
                  }}
                >
                  {buttonPage}
                </button>
              ))}

              <button
                onClick={() => load(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="w-7 h-7 text-sm rounded-md disabled:opacity-40"
                style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}
