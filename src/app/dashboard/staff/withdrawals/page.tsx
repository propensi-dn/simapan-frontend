'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'

import {
  exportStaffWithdrawals,
  getStaffWithdrawals,
  processStaffWithdrawal,
  type StaffWithdrawalItem,
} from '@/lib/staff-api'

const fmtCurrency = (value: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value))

const fmtDate = (raw: string | null) => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    response?: {
      data?: {
        detail?: string
        error?: string
        non_field_errors?: string[]
      }
    }
  }

  return (
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    err?.response?.data?.non_field_errors?.[0] ||
    fallback
  )
}

const buildPaginationRange = (currentPage: number, totalPages: number) => {
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
}

export default function StaffWithdrawalsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const pageSize = 5

  const [summary, setSummary] = useState({
    total_pending_requests: 0,
    total_pending_amount: '0',
  })

  const [pendingRows, setPendingRows] = useState<StaffWithdrawalItem[]>([])
  const [historyRows, setHistoryRows] = useState<StaffWithdrawalItem[]>([])

  const [pendingCount, setPendingCount] = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [pendingTotalPages, setPendingTotalPages] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)

  const [isExporting, setIsExporting] = useState(false)

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<StaffWithdrawalItem | null>(null)
  const [transferProof, setTransferProof] = useState<File | null>(null)
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getStaffWithdrawals({
        pending_page: pendingPage,
        history_page: historyPage,
        page_size: pageSize,
        search: search || undefined,
      })

      setSummary(data.summary)
      setPendingRows(data.pending_requests.results)
      setHistoryRows(data.completed_history.results)
      setPendingCount(data.pending_requests.count || 0)
      setHistoryCount(data.completed_history.count || 0)
      setPendingTotalPages(data.pending_requests.total_pages || 1)
      setHistoryTotalPages(data.completed_history.total_pages || 1)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat data penarikan.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pendingPage, historyPage, search])

  const pendingRangeText = useMemo(() => {
    if (pendingRows.length === 0) return 'Menampilkan 0 dari 0 permintaan'
    const start = (pendingPage - 1) * pageSize + 1
    const end = start + pendingRows.length - 1
    return `Menampilkan ${start}-${end} dari ${summary.total_pending_requests} permintaan`
  }, [pendingRows.length, pendingPage, pageSize, summary.total_pending_requests])

  const pendingPaginationRange = useMemo(
    () => buildPaginationRange(pendingPage, pendingTotalPages),
    [pendingPage, pendingTotalPages],
  )

  const historyPaginationRange = useMemo(
    () => buildPaginationRange(historyPage, historyTotalPages),
    [historyPage, historyTotalPages],
  )

  const onSearchSubmit = () => {
    setPendingPage(1)
    setHistoryPage(1)
    setSearch(searchInput.trim())
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await exportStaffWithdrawals({ scope: 'pending' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `penarikan-menunggu-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export data berhasil')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal export data penarikan.'))
    } finally {
      setIsExporting(false)
    }
  }

  const onSelectTransferProof = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, atau PDF.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.')
      return
    }

    setTransferProof(file)
  }

  const onSubmitTransfer = async () => {
    if (!selectedWithdrawal) return
    if (!transferProof) {
      toast.error('Bukti transfer wajib diunggah.')
      return
    }

    setIsSubmittingTransfer(true)
    try {
      await processStaffWithdrawal(selectedWithdrawal.id, transferProof)
      toast.success('Pencairan berhasil dikonfirmasi.')
      setSelectedWithdrawal(null)
      setTransferProof(null)
      await loadData()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memproses pencairan.'))
    } finally {
      setIsSubmittingTransfer(false)
    }
  }

  return (
    <DashboardLayout role="STAFF" userName="Staff User" userID="STAFF-0001">
      <DashboardHeader
        variant="default"
        title="Permintaan Penarikan"
        notifCount={0}
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Permintaan Penarikan
              </h1>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Kelola pencairan penarikan simpanan sukarela anggota.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <form onSubmit={(e) => { e.preventDefault(); onSearchSubmit() }} className="flex items-center gap-2 flex-1 max-w-xs">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input type="text" placeholder="Cari ID penarikan atau nama..."
                    value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif', backgroundColor: '#FAFAFA' }}
                  />
                </div>
                <button type="submit"
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: '#242F43', color: '#fff' }}>
                  Cari
                </button>
                {search && (
                  <button type="button"
                    onClick={() => { setSearchInput(''); setSearch('') }}
                    className="px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                    Reset
                  </button>
                )}
              </form>

              <div className="h-4 w-px bg-gray-200" />

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExport}
                className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                {isExporting ? 'Mengekspor...' : 'Ekspor'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>Transfer Menunggu</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                {summary.total_pending_requests} Permintaan
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>Total Nominal Diproses</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                {fmtCurrency(summary.total_pending_amount)}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border bg-white" style={{ borderColor: '#E2E8F0' }}>
            <div className="border-b px-5 py-4" style={{ borderColor: '#F1F5F9' }}>
              <h2 className="text-lg font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Permintaan Penarikan Menunggu
              </h2>
            </div>

            {isLoading ? (
              <p className="px-5 py-6 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                Memuat data...
              </p>
            ) : pendingRows.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                Tidak ada permintaan menunggu.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Nama Anggota</th>
                      <th className="px-5 py-3 text-right font-medium">Nominal</th>
                      <th className="px-5 py-3 text-left font-medium">Detail Rekening</th>
                      <th className="px-5 py-3 text-left font-medium">Alasan Penarikan</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: index < pendingRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td className="px-5 py-4 align-top">
                          <p className="font-semibold" style={{ color: '#1E293B' }}>{row.member_name}</p>
                          <p className="text-xs" style={{ color: '#94A3B8' }}>{row.member_id || '-'}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold" style={{ color: '#0F172A' }}>
                          {fmtCurrency(row.amount)}
                        </td>
                        <td className="px-5 py-4" style={{ color: '#334155' }}>
                          {row.bank_name} ({row.account_number})
                        </td>
                        <td className="px-5 py-4 max-w-xs" style={{ color: '#334155' }}>
                          <p title={row.notes} className="truncate text-sm">
                            {row.notes || '-'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                          >
                            Menunggu
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWithdrawal(row)
                              setTransferProof(null)
                            }}
                            className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Cairkan Dana
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-5 py-3 flex items-center justify-between text-sm" style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{pendingRangeText}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pendingPage <= 1}
                  onClick={() => setPendingPage((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ‹
                </button>

                {pendingPaginationRange.map((p, idx) =>
                  p === '…' ? (
                    <span key={`pending-ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPendingPage(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === pendingPage ? '#242F43' : 'transparent',
                        color: p === pendingPage ? '#FFFFFF' : '#525E71',
                        border: p === pendingPage ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={pendingPage >= pendingTotalPages}
                  onClick={() => setPendingPage((prev) => Math.min(pendingTotalPages, prev + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white" style={{ borderColor: '#E2E8F0' }}>
            <div className="border-b px-5 py-4" style={{ borderColor: '#F1F5F9' }}>
              <h2 className="text-lg font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Riwayat Penarikan
              </h2>
            </div>

            {isLoading ? (
              <p className="px-5 py-6 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                Memuat data...
              </p>
            ) : historyRows.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                Belum ada riwayat penarikan tercairkan.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">ID Penarikan</th>
                      <th className="px-5 py-3 text-left font-medium">Nama Anggota</th>
                      <th className="px-5 py-3 text-right font-medium">Nominal</th>
                      <th className="px-5 py-3 text-left font-medium">Alasan Penarikan</th>
                      <th className="px-5 py-3 text-left font-medium">Tanggal Penarikan</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: index < historyRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td className="px-5 py-4" style={{ color: '#334155' }}>{row.withdrawal_id}</td>
                        <td className="px-5 py-4" style={{ color: '#334155' }}>{row.member_name}</td>
                        <td className="px-5 py-4 text-right font-semibold" style={{ color: '#0F172A' }}>
                          {fmtCurrency(row.amount)}
                        </td>
                        <td className="px-5 py-4 max-w-xs" style={{ color: '#334155' }}>
                          <p title={row.notes} className="truncate text-sm">
                            {row.notes || '-'}
                          </p>
                        </td>
                        <td className="px-5 py-4" style={{ color: '#334155' }}>{fmtDate(row.processed_at || row.created_at)}</td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                          >
                            Berhasil
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-5 py-3 flex items-center justify-between text-sm" style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Halaman {historyPage} dari {historyTotalPages} • {historyCount} total data
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ‹
                </button>

                {historyPaginationRange.map((p, idx) =>
                  p === '…' ? (
                    <span key={`history-ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setHistoryPage(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === historyPage ? '#242F43' : 'transparent',
                        color: p === historyPage ? '#FFFFFF' : '#525E71',
                        border: p === historyPage ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          {selectedWithdrawal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
              <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                      Konfirmasi Transfer: {selectedWithdrawal.withdrawal_id}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                      Lengkapi bukti transfer untuk menyelesaikan pencairan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWithdrawal(null)
                      setTransferProof(null)
                    }}
                    className="rounded-md px-2 py-1 text-sm"
                    style={{ color: '#64748B' }}
                  >
                    X
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border p-3" style={{ borderColor: '#E2E8F0' }}>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>Tujuan Transfer</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: '#1E293B' }}>
                      {selectedWithdrawal.bank_name} - {selectedWithdrawal.account_number}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{selectedWithdrawal.account_holder}</p>
                  </div>

                  <div className="rounded-xl border p-3" style={{ borderColor: '#E2E8F0' }}>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>Total Nominal</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: '#1E293B' }}>
                      {fmtCurrency(selectedWithdrawal.amount)}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>Termasuk biaya proses jika ada</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed p-4" style={{ borderColor: '#CBD5E1' }}>
                  <p className="mb-2 text-sm font-semibold" style={{ color: '#334155' }}>Upload Bukti Transfer</p>
                  <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={onSelectTransferProof} />
                  <p className="mt-2 text-xs" style={{ color: '#94A3B8' }}>
                    Format file: JPG, PNG, PDF. Maksimal 5MB.
                  </p>
                  {transferProof && (
                    <p className="mt-1 text-xs" style={{ color: '#0F766E' }}>
                      File dipilih: {transferProof.name}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingTransfer}
                    onClick={onSubmitTransfer}
                    className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSubmittingTransfer ? 'Mengirim...' : 'Kirim Bukti Transfer'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingTransfer}
                    onClick={() => {
                      setSelectedWithdrawal(null)
                      setTransferProof(null)
                    }}
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    style={{ borderColor: '#E2E8F0', color: '#475569' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
