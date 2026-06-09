'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import api from '@/lib/axios'
import {
  getManagerOverdueLoans,
  sendOverdueWarning,
  updateOverdueLoanStatus,
  type BadDebtStatus,
  type ManagerOverdueLoanItem,
  type OverdueSeverity,
} from '@/lib/loans-api'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(v))

const SEVERITY_BADGE: Record<OverdueSeverity, { bg: string; text: string; label: string }> = {
  LOW: { bg: '#FEF3C7', text: '#92400E', label: 'Ringan' },
  MEDIUM: { bg: '#FED7AA', text: '#9A3412', label: 'Sedang' },
  HIGH: { bg: '#FECACA', text: '#991B1B', label: 'Tinggi' },
  CRITICAL: { bg: '#7F1D1D', text: '#FFFFFF', label: 'Kritis' },
}

const STATUS_BADGE: Record<BadDebtStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  WARNING_SENT: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  LEGAL_NOTICE: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  VISIT_SCHEDULED: { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
}

const STATUS_LABELS_EN: Record<string, string> = {
  PENDING: 'PENDING',
  WARNING_SENT: 'WARNING SENT',
  LEGAL_NOTICE: 'LEGAL NOTICE',
  VISIT_SCHEDULED: 'VISIT SCHEDULED',
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

// Urutan eskalasi (PENDING → WARNING_SENT → VISIT_SCHEDULED → LEGAL_NOTICE)
// LEGAL_NOTICE dipindah ke paling akhir karena merupakan langkah terakhir
// setelah kunjungan dijadwalkan.
const STATUS_ORDER: BadDebtStatus[] = [
  'PENDING', 'WARNING_SENT', 'VISIT_SCHEDULED', 'LEGAL_NOTICE',
]

const EmailIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
    />
  </svg>
)

const KebabIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
)

export default function ManagerCreditPage() {
  const [rows, setRows] = useState<ManagerOverdueLoanItem[]>([])
  const [statuses, setStatuses] = useState<{ value: BadDebtStatus; label: string }[]>([])
  const [summary, setSummary] = useState({
    total_overdue: 0,
    total_amount_overdue: '0',
    total_critical: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | BadDebtStatus>('')

  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [statusModal, setStatusModal] = useState<ManagerOverdueLoanItem | null>(null)
  const [newStatus, setNewStatus] = useState<BadDebtStatus>('WARNING_SENT')
  const [savingStatus, setSavingStatus] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null)
  const [emailConfirm, setEmailConfirm] = useState<ManagerOverdueLoanItem | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Status dropdown ditata sesuai urutan eskalasi resmi, bukan urutan dari API
  const orderedStatuses = STATUS_ORDER
    .map((value) => statuses.find((s) => s.value === value))
    .filter((s): s is { value: BadDebtStatus; label: string } => Boolean(s))

  const pageSize = 10

  const load = useCallback(
    async (nextPage: number, q: string, st: '' | BadDebtStatus) => {
      setLoading(true)
      setError('')
      try {
        const data = await getManagerOverdueLoans({
          page: nextPage,
          page_size: pageSize,
          search: q || undefined,
          status: st || undefined,
        })
        setRows(data.overdue_loans.results)
        setStatuses(data.monitoring_statuses)
        setSummary(data.summary)
        setPage(data.overdue_loans.current_page)
        setTotalPages(data.overdue_loans.total_pages)
        setCount(data.overdue_loans.count)
      } catch {
        setError('Gagal memuat daftar kredit macet.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    load(1, search, statusFilter)
  }, [load, search, statusFilter])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handlePage = (next: number) => {
    if (next < 1 || next > totalPages) return
    load(next, search, statusFilter)
  }

  const confirmSendEmail = async () => {
    if (!emailConfirm) return
    const item = emailConfirm
    setSendingEmailId(item.id)
    try {
      const res = await sendOverdueWarning(item.id)
      toast.success(res.message)
      setEmailConfirm(null)
      load(page, search, statusFilter)
    } catch {
      toast.error('Gagal mengirim email peringatan.')
    } finally {
      setSendingEmailId(null)
    }
  }

  const handleSaveStatus = async () => {
    if (!statusModal) return
    setSavingStatus(true)
    try {
      const res = await updateOverdueLoanStatus(statusModal.id, { status: newStatus })
      toast.success(res.message)
      setStatusModal(null)
      load(page, search, statusFilter)
    } catch {
      toast.error('Gagal memperbarui status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      const query = params.toString()
      const url = `/manager/loans/overdue/export/${query ? `?${query}` : ''}`
      const response = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `overdue_loans_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error('Gagal mengekspor data.')
    }
  }

  return (
    <DashboardLayout role="MANAGER">
      <DashboardHeader variant="default" title="Pemantauan Kredit" />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Pemantauan Kredit Macet
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Pantau dan tindak lanjuti pinjaman anggota yang sudah lewat jatuh tempo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8' }}>
              Total Pinjaman Jatuh Tempo
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {summary.total_overdue}
            </p>
          </div>
          <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8' }}>
              Nominal Tertunggak
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {fmtRp(summary.total_amount_overdue)}
            </p>
          </div>
          <div
            className="rounded-2xl px-6 py-5 transition-colors"
            style={{
              border: summary.total_critical > 0 ? '1px solid #FECACA' : '1px solid #F1F5F9',
              backgroundColor: summary.total_critical > 0 ? '#FEF2F2' : '#fff',
            }}
          >
            <div className="flex items-center gap-1.5">
              {summary.total_critical > 0 && (
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: '#DC2626' }}
                />
              )}
              <p className="text-xs font-semibold tracking-wider uppercase"
                 style={{ color: summary.total_critical > 0 ? '#991B1B' : '#8E99A8' }}>
                Kasus Kritis (90+ hari)
              </p>
            </div>
            <p
              className="font-bold text-3xl mt-1"
              style={{
                color: summary.total_critical > 0 ? '#991B1B' : '#242F43',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              {summary.total_critical}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Daftar Anggota dengan Tunggakan
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama anggota..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#242F43', color: '#fff' }}
                >
                  Cari
                </button>
              </form>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | BadDebtStatus)}
                className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              >
                <option value="">Semua Status</option>
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {STATUS_LABELS_EN[s.value] || s.label}
                  </option>
                ))}
              </select>

              {(search || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                    setStatusFilter('')
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                >
                  Reset
                </button>
              )}

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
          ) : rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#8E99A8' }}>
              Tidak ada pinjaman yang jatuh tempo saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {[
                      'NAMA ANGGOTA',
                      'HARI TERLAMBAT',
                      'NOMINAL TUNGGAKAN',
                      'NO. TELEPON',
                      'STATUS',
                      'TINDAKAN',
                    ].map((col) => (
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
                  {rows.map((row, i) => {
                    const sev = SEVERITY_BADGE[row.severity] ?? SEVERITY_BADGE.LOW
                    const st = STATUS_BADGE[row.status] ?? { bg: '#F3F4F6', text: '#6B7280', label: row.status_display }
                    const isCritical = row.severity === 'CRITICAL'
                    return (
                      <tr
                        key={row.id}
                        className="transition-colors"
                        style={{
                          // Highlight halus warna merah utk kasus kritis (90+ hari)
                          backgroundColor: isCritical ? '#FEF2F2' : undefined,
                          borderLeft: isCritical ? '3px solid #DC2626' : '3px solid transparent',
                          borderBottom: i < rows.length - 1 ? '1px solid #F8FAFC' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = isCritical ? '#FEE2E2' : '#FAFAFA'
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = isCritical ? '#FEF2F2' : ''
                        }}
                      >
                        <td
                          className="px-6 py-4 text-sm font-semibold"
                          style={{ color: '#242F43' }}
                        >
                          <div>{row.member_name}</div>
                          <div className="text-xs font-normal" style={{ color: '#8E99A8' }}>
                            {row.loan_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                            style={{ backgroundColor: sev.bg, color: sev.text }}
                          >
                            {row.days_late} hari
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43' }}>
                          {fmtRp(row.amount_overdue)}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                          {row.phone_number || '-'}
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
                          <div className="flex items-center gap-1 relative">
                            <button
                              type="button"
                              onClick={() => setEmailConfirm(row)}
                              disabled={sendingEmailId === row.id}
                              title="Kirim email peringatan"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                              style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                            >
                              <EmailIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                            >
                              <KebabIcon />
                            </button>
                            {openMenuId === row.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-9 z-20 bg-white rounded-xl py-2 min-w-[160px]"
                                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusModal(row)
                                    setNewStatus(row.status)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#FAFAFA]"
                                  style={{ color: '#242F43' }}
                                >
                                  Ubah Status
                                </button>
                                <Link
                                  href={`/dashboard/manager/loans/${row.id}`}
                                  className="block px-4 py-2 text-xs font-medium hover:bg-[#FAFAFA]"
                                  style={{ color: '#242F43' }}
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  Tinjau
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
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
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
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
      </main>

      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={() => !savingStatus && setStatusModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              className="font-bold text-lg"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
            >
              Ubah Status
            </h4>
            <p className="text-sm mt-2" style={{ color: '#525E71' }}>
              Perbarui status pemantauan untuk pinjaman <strong>{statusModal.loan_id}</strong> milik{' '}
              <strong>{statusModal.member_name}</strong>.
            </p>
            <div className="mt-4">
              <label className="text-xs font-semibold" style={{ color: '#525E71' }}>
                Ubah status menjadi..
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BadDebtStatus)}
                className="mt-2 w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              >
                {orderedStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {STATUS_LABELS_EN[s.value] || s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                disabled={savingStatus}
                className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: '#242F43' }}
              >
                {savingStatus ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emailConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={() => sendingEmailId === null && setEmailConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#92400E" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="font-bold text-lg"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                >
                  Kirim Email Peringatan?
                </h4>
                <p className="text-sm mt-1.5" style={{ color: '#525E71' }}>
                  Email peringatan tunggakan akan dikirim ke{' '}
                  <strong>{emailConfirm.member_name}</strong> ({emailConfirm.loan_id}). Status
                  pemantauan akan otomatis berubah menjadi{' '}
                  <strong>Peringatan Terkirim</strong> apabila masih{' '}
                  <em>Belum Ditindaklanjuti</em>.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setEmailConfirm(null)}
                disabled={sendingEmailId !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSendEmail}
                disabled={sendingEmailId !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: '#11447D' }}
              >
                {sendingEmailId === emailConfirm.id ? 'Mengirim...' : 'Ya, Kirim Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
