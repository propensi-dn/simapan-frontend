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

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  APPROVED: { bg: '#DBEAFE', text: '#1E40AF' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
  RESIGNED: { bg: '#F1F5F9', text: '#525E71' },
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
    <DashboardLayout role="MANAGER" userName="Manajer">
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
            className="px-6 py-4 flex flex-wrap items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base mr-auto"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Permintaan Penutupan Akun
            </h3>

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
                className="px-3 py-2 rounded-xl text-xs font-bold"
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
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  Atur Ulang
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
            >
              Ekspor
            </button>
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
                    {['NAMA ANGGOTA', 'ID ANGGOTA', 'TANGGAL PERMINTAAN', 'STATUS', 'AKSI'].map((col) => (
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
                        <td
                          className="px-6 py-4 text-sm font-semibold"
                          style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          {row.member_name}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                          {row.member_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                          {fmtDate(row.request_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                            style={{ backgroundColor: st.bg, color: st.text }}
                          >
                            {row.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/manager/resignations/${row.id}`}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: '#242F43' }}
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
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}
            >
              <span>
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, count)} dari {count} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'<'}
                </button>
                <span className="px-3" style={{ color: '#525E71' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'>'}
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
                    {['NAMA ANGGOTA', 'ID ANGGOTA', 'TANGGAL DISETUJUI', 'PAYOUT'].map((col) => (
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
                      <td
                        className="px-6 py-4 text-sm font-semibold"
                        style={{ color: '#242F43' }}
                      >
                        {row.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {row.member_id || '-'}
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
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}
            >
              <span>
                Menampilkan {(historyPage - 1) * pageSize + 1} - {Math.min(historyPage * pageSize, historyCount)} dari {historyCount} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleHistoryPage(historyPage - 1)}
                  disabled={historyPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'<'}
                </button>
                <span className="px-3" style={{ color: '#525E71' }}>
                  {historyPage} / {historyTotalPages}
                </span>
                <button
                  onClick={() => handleHistoryPage(historyPage + 1)}
                  disabled={historyPage === historyTotalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  {'>'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
