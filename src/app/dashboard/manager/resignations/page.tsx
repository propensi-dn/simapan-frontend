'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getManagerResignations,
  getManagerResignationExportUrl,
  type ManagerResignationHistoryItem,
  type ManagerResignationListItem,
} from '@/lib/resignations-api'
import api from '@/lib/axios'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  APPROVED: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  REJECTED: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  RESIGNED: { bg: '#F1F5F9', text: '#525E71', dot: '#9CA3AF' },
}

const STATUS_LABELS_EN: Record<string, string> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RESIGNED: 'RESIGNED',
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

export default function ManagerResignationsPage() {
  const [pendingRows, setPendingRows] = useState<ManagerResignationListItem[]>([])
  const [historyRows, setHistoryRows] = useState<ManagerResignationHistoryItem[]>([])
  const [summary, setSummary] = useState({ total_pending: 0, total_approved: 0, total_inactive: 0 })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyCount, setHistoryCount] = useState(0)

  const pageSize = 5

  const load = useCallback(
    async (nextPage: number, q: string, nextHistoryPage: number) => {
      setLoading(true)
      setError('')
      try {
        const data = await getManagerResignations({
          page: nextPage,
          page_size: pageSize,
          search: q || undefined,
          history_page: nextHistoryPage,
          history_page_size: pageSize,
        })
        setSummary(data.summary)
        setPendingRows(data.pending_requests.results)
        setHistoryRows(data.history_requests.results)
        setPage(data.pending_requests.current_page)
        setTotalPages(data.pending_requests.total_pages)
        setCount(data.pending_requests.count)
        setHistoryPage(data.history_requests.current_page)
        setHistoryTotalPages(data.history_requests.total_pages)
        setHistoryCount(data.history_requests.count)
      } catch {
        setError('Gagal memuat daftar pengajuan penutupan akun.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    load(1, search, 1)
  }, [load, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handlePage = (next: number) => {
    if (next < 1 || next > totalPages) return
    load(next, search, historyPage)
  }

  const handleHistoryPage = (next: number) => {
    if (next < 1 || next > historyTotalPages) return
    load(page, search, next)
  }

  const handleExport = async () => {
    try {
      const response = await api.get(getManagerResignationExportUrl(), { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resignations_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Gagal mengekspor data.')
    }
  }

  return (
    <DashboardLayout role="MANAGER">
      <DashboardHeader variant="default" title="Persetujuan Resign" />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Persetujuan Resign
          </h2>
          <p
            className="text-sm"
            style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
          >
            Kelola pengajuan penutupan akun anggota dan pantau riwayat anggota yang sudah resign.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="bg-white rounded-2xl px-6 py-5"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Total Permintaan
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {summary.total_pending + summary.total_inactive}
            </p>
            <p className="text-xs mt-2" style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}>
              {summary.total_inactive} sudah disetujui & nonaktif
            </p>
          </div>
          <div
            className="bg-white rounded-2xl px-6 py-5"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <p
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              Menunggu Persetujuan
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {summary.total_pending}
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: summary.total_pending > 0 ? '#EF4444' : '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              {summary.total_pending > 0 ? 'Membutuhkan perhatian manajer' : 'Tidak ada pengajuan tertunda'}
            </p>
          </div>
        </div>

        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #F1F5F9' }}
        >
          <div
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Permintaan Penutupan Akun
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FAFAFA',
                    color: '#242F43',
                  }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#242F43', color: '#fff' }}
                >
                  Cari
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setSearch('')
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                  >
                    Reset
                  </button>
                )}
              </form>

              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                Ekspor
              </button>
            </div>
          </div>

          {error ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#EF4444' }}>
              {error}
            </div>
          ) : loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }}
              />
            </div>
          ) : pendingRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#8E99A8' }}>
              {search ? `Tidak ada hasil untuk "${search}".` : 'Tidak ada pengajuan penutupan akun yang menunggu.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['ID ANGGOTA', 'NAMA ANGGOTA', 'TANGGAL PERMINTAAN', 'STATUS', 'AKSI'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((row, i) => {
                    const st = STATUS_BADGE[row.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < pendingRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                      >
                        <td className="px-6 py-4 text-sm">
                          <span className="font-bold" style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                            {row.member_id || '-'}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-semibold"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          {row.member_name}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                          {fmtDate(row.request_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
                            style={{ backgroundColor: st.bg, color: st.text, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                            {STATUS_LABELS_EN[row.status] || row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/manager/resignations/${row.id}`}
                            className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                          >
                            Tinjau
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pendingRows.length > 0 && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              <span>
                Halaman {page} dari {totalPages} • {count} total data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'‹'}
                </button>

                {getPaginationRange(page, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`pending-ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePage(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === page ? '#242F43' : 'transparent',
                        color: p === page ? '#FFFFFF' : '#525E71',
                        border: p === page ? 'none' : '1px solid #E5E7EB',
                      }}>
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'›'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #F1F5F9' }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Riwayat Penutupan Akun (Inactive)
            </h3>
            <p className="text-xs mt-1" style={{ color: '#8E99A8' }}>
              Anggota yang akunnya sudah resmi ditutup.
            </p>
          </div>

          {historyRows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm" style={{ color: '#8E99A8' }}>
              Belum ada riwayat penutupan akun.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['ID ANGGOTA', 'NAMA ANGGOTA', 'TANGGAL DISETUJUI', 'PAYOUT'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: i < historyRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    >
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold" style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                          {row.member_id || '-'}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-semibold"
                        style={{ color: '#242F43' }}
                      >
                        {row.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {fmtDate(row.approval_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43' }}>
                        {fmtRp(row.estimated_payout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {historyRows.length > 0 && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
            >
              <span>
                Halaman {historyPage} dari {historyTotalPages} • {historyCount} total data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleHistoryPage(historyPage - 1)}
                  disabled={historyPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'‹'}
                </button>

                {getPaginationRange(historyPage, historyTotalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`history-ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handleHistoryPage(p as number)}
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
                  onClick={() => handleHistoryPage(historyPage + 1)}
                  disabled={historyPage === historyTotalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'›'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
