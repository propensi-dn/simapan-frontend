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
import toast from 'react-hot-toast'

type InstallmentStatusTab = 'PENDING' | 'PAID' | 'REJECTED' | 'ALL'

const STATUS_FILTERS: Array<{ key: 'ALL' | 'PAID' | 'REJECTED'; label: string }> = [
  { key: 'ALL', label: 'Semua Status' },
  { key: 'PAID', label: 'Terverifikasi' },
  { key: 'REJECTED', label: 'Ditolak' },
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

const getPaginationRange = (current: number, total: number) => {
  const delta = 2
  const range: (number | '...')[] = []
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i)
  }
  if (range.length === 0) return range
  if (range[0] !== 1) { range.unshift('...'); range.unshift(1) }
  if (range[range.length - 1] !== total) { range.push('...'); range.push(total) }
  return range
}

const StatusBadge = ({ status }: { status: StaffInstallmentStatus }) => {
  const styles: Record<StaffInstallmentStatus, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', label: 'PENDING' },
    PAID: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'VERIFIED' },
    UNPAID: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'REJECTED' },
  }

  const style = styles[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: style.bg, color: style.text, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
      {style.label}
    </span>
  )
}

export default function StaffInstallmentsPage() {
  // Pending Table State
  const [pendingRows, setPendingRows] = useState<StaffInstallmentPaymentItem[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [pendingSearchInput, setPendingSearchInput] = useState('')
  const [pendingSearchQ, setPendingSearchQ] = useState('')
  const [pendingStartDateInput, setPendingStartDateInput] = useState('')
  const [pendingEndDateInput, setPendingEndDateInput] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [pendingEndDate, setPendingEndDate] = useState('')
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingTotalPages, setPendingTotalPages] = useState(1)

  // History Table State
  const [historyRows, setHistoryRows] = useState<StaffInstallmentPaymentItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historySearchQ, setHistorySearchQ] = useState('')
  const [historyStartDateInput, setHistoryStartDateInput] = useState('')
  const [historyEndDateInput, setHistoryEndDateInput] = useState('')
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'PAID' | 'REJECTED'>('ALL')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyCount, setHistoryCount] = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)

  const pageSize = 10

  const loadPending = useCallback(async (targetPage: number) => {
    try {
      setPendingLoading(true)
      const data = await getPendingInstallmentPayments({
        scope: 'pending',
        page: targetPage,
        page_size: pageSize,
        search: pendingSearchQ || undefined,
        start_date: pendingStartDate || undefined,
        end_date: pendingEndDate || undefined,
      })
      setPendingRows(data.results)
      setPendingCount(data.count)
      setPendingTotalPages(Math.max(data.total_pages, 1))
      setPendingPage(data.current_page)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat daftar pembayaran cicilan.'))
    } finally {
      setPendingLoading(false)
    }
  }, [pendingSearchQ, pendingStartDate, pendingEndDate])

  const loadHistory = useCallback(async (targetPage: number) => {
    const scope = historyStatusFilter === 'ALL' ? 'all' : 'history'
    const rejectedOnly = historyStatusFilter === 'REJECTED'
    const status = historyStatusFilter === 'PAID' ? 'PAID' : historyStatusFilter === 'REJECTED' ? 'UNPAID' : undefined

    try {
      setHistoryLoading(true)
      const data = await getPendingInstallmentPayments({
        scope,
        page: targetPage,
        page_size: pageSize,
        search: historySearchQ || undefined,
        status,
        rejected_only: rejectedOnly || undefined,
        start_date: historyStartDate || undefined,
        end_date: historyEndDate || undefined,
      })
      setHistoryRows(data.results)
      setHistoryCount(data.count)
      setHistoryTotalPages(Math.max(data.total_pages, 1))
      setHistoryPage(data.current_page)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat daftar riwayat pembayaran cicilan.'))
    } finally {
      setHistoryLoading(false)
    }
  }, [historySearchQ, historyStartDate, historyEndDate, historyStatusFilter])

  useEffect(() => {
    loadPending(1)
  }, [loadPending])

  useEffect(() => {
    loadHistory(1)
  }, [loadHistory])

  const applyPendingFilters = (event?: FormEvent) => {
    event?.preventDefault()
    setPendingSearchQ(pendingSearchInput.trim())
    setPendingStartDate(pendingStartDateInput)
    setPendingEndDate(pendingEndDateInput)
  }

  const clearPendingFilters = () => {
    setPendingSearchInput('')
    setPendingSearchQ('')
    setPendingStartDateInput('')
    setPendingEndDateInput('')
    setPendingStartDate('')
    setPendingEndDate('')
  }

  const applyHistoryFilters = (event?: FormEvent) => {
    event?.preventDefault()
    setHistorySearchQ(historySearchInput.trim())
    setHistoryStartDate(historyStartDateInput)
    setHistoryEndDate(historyEndDateInput)
  }

  const clearHistoryFilters = () => {
    setHistorySearchInput('')
    setHistorySearchQ('')
    setHistoryStartDateInput('')
    setHistoryEndDateInput('')
    setHistoryStartDate('')
    setHistoryEndDate('')
  }

  return (
    <DashboardLayout role="STAFF">
      <DashboardHeader
        variant="default"
        title="Pembayaran Cicilan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8 bg-[#F8FAFC] min-h-screen space-y-8">
        <div>
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Pembayaran Cicilan
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Verifikasi laporan pembayaran cicilan pinjaman yang dikirimkan oleh anggota.
          </p>
        </div>

        {/* Table 1: Laporan Pembayaran Menunggu Verifikasi */}
        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h2
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Laporan Pembayaran Menunggu Verifikasi
            </h2>

            <form onSubmit={applyPendingFilters} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama anggota, ID pinjaman..."
                  value={pendingSearchInput}
                  onChange={(event) => setPendingSearchInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none w-64"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}
                >
                  Cari
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>Dari:</label>
                <input
                  type="date"
                  value={pendingStartDateInput}
                  onChange={(event) => setPendingStartDateInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
                <label className="text-xs" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>s/d:</label>
                <input
                  type="date"
                  value={pendingEndDateInput}
                  onChange={(event) => setPendingEndDateInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {(pendingSearchQ || pendingStartDate || pendingEndDate) && (
                <button
                  type="button"
                  onClick={clearPendingFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50 whitespace-nowrap"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  Reset
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  {[
                    'ID PINJAMAN',
                    'TANGGAL KIRIM',
                    'NAMA ANGGOTA',
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
                {pendingLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Memuat data...
                    </td>
                  </tr>
                ) : pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Tidak ada laporan pembayaran cicilan menunggu verifikasi.
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: index < pendingRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                        <Link href={`/dashboard/staff/loans/${row.loan_pk}`} className="font-bold" style={{ color: '#11447D' }}>
                          {row.loan_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(row.submitted_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {row.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/staff/installments/${row.id}`}
                          className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          Tinjau
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!pendingLoading && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              <span>
                Halaman {pendingPage} dari {pendingTotalPages} • {pendingCount} total data
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => loadPending(pendingPage - 1)}
                  disabled={pendingPage <= 1 || pendingLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ‹
                </button>

                {getPaginationRange(pendingPage, pendingTotalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-pending-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => loadPending(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === pendingPage ? '#242F43' : 'transparent',
                        color: p === pendingPage ? '#FFFFFF' : '#525E71',
                        border: p === pendingPage ? 'none' : '1px solid #E5E7EB',
                      }}>
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => loadPending(Math.min(pendingTotalPages, pendingPage + 1))}
                  disabled={pendingPage >= pendingTotalPages || pendingLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Table 2: Riwayat Verifikasi Pembayaran */}
        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h2
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Riwayat Verifikasi Pembayaran
            </h2>

            <form onSubmit={applyHistoryFilters} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama anggota, ID pinjaman..."
                  value={historySearchInput}
                  onChange={(event) => setHistorySearchInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none w-64"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#242F43', color: '#fff', fontFamily: 'Inter, sans-serif' }}
                >
                  Cari
                </button>
              </div>

              <select
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>Dari:</label>
                <input
                  type="date"
                  value={historyStartDateInput}
                  onChange={(event) => setHistoryStartDateInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
                <label className="text-xs" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>s/d:</label>
                <input
                  type="date"
                  value={historyEndDateInput}
                  onChange={(event) => setHistoryEndDateInput(event.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {(historySearchQ || historyStartDate || historyEndDate) && (
                <button
                  type="button"
                  onClick={clearHistoryFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50 whitespace-nowrap"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  Reset
                </button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  {[
                    'ID PINJAMAN',
                    'TERAKHIR DIPERBARUI',
                    'NAMA ANGGOTA',
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
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Memuat data...
                    </td>
                  </tr>
                ) : historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Tidak ada riwayat pembayaran cicilan.
                    </td>
                  </tr>
                ) : (
                  historyRows.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: index < historyRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                        <Link href={`/dashboard/staff/loans/${row.loan_pk}`} className="font-bold" style={{ color: '#11447D' }}>
                          {row.loan_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(row.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {row.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/staff/installments/${row.id}`}
                          className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!historyLoading && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              <span>
                Halaman {historyPage} dari {historyTotalPages} • {historyCount} total data
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => loadHistory(historyPage - 1)}
                  disabled={historyPage <= 1 || historyLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ‹
                </button>

                {getPaginationRange(historyPage, historyTotalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-history-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => loadHistory(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === historyPage ? '#242F43' : 'transparent',
                        color: p === historyPage ? '#FFFFFF' : '#525E71',
                        border: p === historyPage ? 'none' : '1px solid #E5E7EB',
                      }}>
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => loadHistory(Math.min(historyTotalPages, historyPage + 1))}
                  disabled={historyPage >= historyTotalPages || historyLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  )
}
