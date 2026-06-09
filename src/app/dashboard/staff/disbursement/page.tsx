'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getApprovedLoans, getDisbursedLoans, ApprovedLoan, DisbursedLoan } from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { Search, Loader, CalendarDays, Banknote, History } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = 'approved' | 'history'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (value: string | number) => {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(num)
  } catch { return String(value) }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    PENDING:             { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B', label: 'PENDING' },
    APPROVED:            { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'APPROVED' },
    REJECTED:            { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'REJECTED' },
    ACTIVE:              { bg: '#ECFDF5', color: '#047857', dot: '#10B981', label: 'ACTIVE' },
    LUNAS:               { bg: '#F0FDFA', color: '#0F766E', dot: '#14B8A6', label: 'PAID' },
    OVERDUE:             { bg: '#FFF1F2', color: '#BE123C', dot: '#BE123C', label: 'OVERDUE' },
    LUNAS_AFTER_OVERDUE: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', label: 'PAID AFTER OVERDUE' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', label: status }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: s.bg, color: s.color, textTransform: 'uppercase' }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({
  page, total, count, pageSize, onChange,
}: { page: number; total: number; count: number; pageSize: number; onChange: (p: number) => void }) => {
  const pages: (number | '…')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i)
    if (page < total - 2) pages.push('…')
    pages.push(total)
  }

  return (
    <div
      className="px-6 py-3 flex items-center justify-between text-sm"
      style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
    >
      <span>
        Halaman {page} dari {total} • {count} total data
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
              style={{
                backgroundColor: p === page ? '#242F43' : 'transparent',
                color: p === page ? '#FFFFFF' : '#525E71',
                border: p === page ? 'none' : '1px solid #E5E7EB',
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === total}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffDisbursementPage() {
  const router = useRouter()

  // Table 1: Approved (Siap Dicairkan) State & Filters
  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([])
  const [approvedLoading, setApprovedLoading] = useState(false)
  const [approvedPageInfo, setApprovedPageInfo] = useState({ count: 0, total_pages: 1, page_size: 10 })
  const [approvedPage, setApprovedPage] = useState(1)

  const [approvedSearchInput, setApprovedSearchInput] = useState('')
  const [approvedSearch, setApprovedSearch] = useState('')
  const [approvedStartDateInput, setApprovedStartDateInput] = useState('')
  const [approvedEndDateInput, setApprovedEndDateInput] = useState('')
  const [approvedStartDate, setApprovedStartDate] = useState('')
  const [approvedEndDate, setApprovedEndDate] = useState('')

  // Table 2: Disbursed (Riwayat Pencairan) State & Filters
  const [disbursedLoans, setDisbursedLoans] = useState<DisbursedLoan[]>([])
  const [disbursedLoading, setDisbursedLoading] = useState(false)
  const [disbursedPageInfo, setDisbursedPageInfo] = useState({ count: 0, total_pages: 1, page_size: 10 })
  const [disbursedPage, setDisbursedPage] = useState(1)

  const [disbursedSearchInput, setDisbursedSearchInput] = useState('')
  const [disbursedSearch, setDisbursedSearch] = useState('')
  const [disbursedStartDateInput, setDisbursedStartDateInput] = useState('')
  const [disbursedEndDateInput, setDisbursedEndDateInput] = useState('')
  const [disbursedStartDate, setDisbursedStartDate] = useState('')
  const [disbursedEndDate, setDisbursedEndDate] = useState('')

  // Loading callbacks
  const fetchApproved = useCallback(async (s: string, sd: string, ed: string, p: number) => {
    try {
      setApprovedLoading(true)
      const data = await getApprovedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setApprovedLoans(data.results)
      setApprovedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Gagal memuat pinjaman')
    } finally { setApprovedLoading(false) }
  }, [])

  const fetchDisbursed = useCallback(async (s: string, sd: string, ed: string, p: number) => {
    try {
      setDisbursedLoading(true)
      const data = await getDisbursedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setDisbursedLoans(data.results)
      setDisbursedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Gagal memuat riwayat')
    } finally { setDisbursedLoading(false) }
  }, [])

  useEffect(() => {
    fetchApproved(approvedSearch, approvedStartDate, approvedEndDate, approvedPage)
  }, [approvedPage, approvedSearch, approvedStartDate, approvedEndDate, fetchApproved])

  useEffect(() => {
    fetchDisbursed(disbursedSearch, disbursedStartDate, disbursedEndDate, disbursedPage)
  }, [disbursedPage, disbursedSearch, disbursedStartDate, disbursedEndDate, fetchDisbursed])

  const applyApprovedFilters = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    setApprovedSearch(approvedSearchInput.trim())
    setApprovedStartDate(approvedStartDateInput)
    setApprovedEndDate(approvedEndDateInput)
    setApprovedPage(1)
  }

  const clearApprovedFilters = () => {
    setApprovedSearchInput(''); setApprovedSearch('')
    setApprovedStartDateInput(''); setApprovedEndDateInput('')
    setApprovedStartDate(''); setApprovedEndDate('')
    setApprovedPage(1)
  }

  const applyDisbursedFilters = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    setDisbursedSearch(disbursedSearchInput.trim())
    setDisbursedStartDate(disbursedStartDateInput)
    setDisbursedEndDate(disbursedEndDateInput)
    setDisbursedPage(1)
  }

  const clearDisbursedFilters = () => {
    setDisbursedSearchInput(''); setDisbursedSearch('')
    setDisbursedStartDateInput(''); setDisbursedEndDateInput('')
    setDisbursedStartDate(''); setDisbursedEndDate('')
    setDisbursedPage(1)
  }

  const hasApprovedFilter = !!(approvedSearch || approvedStartDate || approvedEndDate)
  const hasDisbursedFilter = !!(disbursedSearch || disbursedStartDate || disbursedEndDate)

  return (
    <DashboardLayout role="STAFF">
      <DashboardHeader
        variant="default"
        title="Manajemen Pencairan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-6 md:p-8 space-y-8 min-h-screen" style={{ background: '#F8FAFC' }}>

        {/* ── Page Header ── */}
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Manajemen Pencairan
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Proses pencairan dana pinjaman yang telah disetujui dan pantau riwayat pencairan.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="bg-white rounded-2xl px-6 py-5 flex items-start justify-between"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div>
              <p
                className="text-xs font-semibold tracking-wider uppercase mb-1"
                style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
              >
                Menunggu Pencairan
              </p>
              <p
                className="font-bold text-3xl"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                {approvedPageInfo.count}
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: approvedPageInfo.count > 0 ? '#EF4444' : '#8E99A8', fontFamily: 'Inter, sans-serif' }}
              >
                {approvedPageInfo.count > 0 ? 'Perlu tindakan segera' : 'Tidak ada yang tertunda'}
              </p>
            </div>
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: approvedPageInfo.count > 0 ? '#FEE2E2' : '#F3F4F6', color: approvedPageInfo.count > 0 ? '#DC2626' : '#6B7280' }}
            >
              <Banknote size={20} />
            </div>
          </div>

          <div
            className="bg-white rounded-2xl px-6 py-5 flex items-start justify-between"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div>
              <p
                className="text-xs font-semibold tracking-wider uppercase mb-1"
                style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
              >
                Total Dicairkan
              </p>
              <p
                className="font-bold text-3xl"
                style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
              >
                {disbursedPageInfo.count}
              </p>
              <p className="text-xs mt-2" style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}>
                Pencairan berhasil diproses
              </p>
            </div>
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
            >
              <History size={20} />
            </div>
          </div>
        </div>

        {/* Table 1: Pinjaman Siap Dicairkan */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          {/* Search + Filter Bar */}
          <form
            onSubmit={applyApprovedFilters}
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Pinjaman Siap Dicairkan
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0BAC5]" size={15} />
                <input
                  type="text"
                  placeholder="Cari nama anggota atau Loan ID..."
                  value={approvedSearchInput}
                  onChange={(e) => setApprovedSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FAFAFA',
                    color: '#242F43',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={14} />
                  <input
                    type="date"
                    value={approvedStartDateInput}
                    onChange={(e) => setApprovedStartDateInput(e.target.value)}
                    className="w-36 pl-9 pr-2 py-2 rounded-xl text-xs outline-none"
                    style={{
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#525E71',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: '#8E99A8' }}>—</span>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={14} />
                  <input
                    type="date"
                    value={approvedEndDateInput}
                    onChange={(e) => setApprovedEndDateInput(e.target.value)}
                    className="w-36 pl-9 pr-2 py-2 rounded-xl text-xs outline-none"
                    style={{
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#525E71',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                Cari
              </button>

              {hasApprovedFilter && (
                <button
                  type="button"
                  onClick={clearApprovedFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    border: '1px solid #E5E7EB',
                    color: '#525E71',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Table */}
          {approvedLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={24} className="text-[#94A3B8] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <Th>LOAN ID</Th>
                    <Th>NAMA ANGGOTA</Th>
                    <Th>KATEGORI</Th>
                    <Th align="right">NOMINAL</Th>
                    <Th>TGL PERSETUJUAN</Th>
                    <Th align="center">AKSI</Th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          text={hasApprovedFilter
                            ? 'Tidak ada hasil untuk filter yang dipilih.'
                            : 'Belum ada pinjaman yang menunggu pencairan.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    approvedLoans.map((loan, i) => (
                      <tr
                        key={loan.id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < approvedLoans.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                      >
                        <td style={tdStyle}>
                          <span className="font-bold" style={{ color: '#11447D', letterSpacing: '-0.2px' }}>
                            {loan.loan_id}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span className="font-semibold" style={{ color: '#242F43' }}>{loan.member_name}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#6B7280' }}>{loan.category_display}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span className="font-bold" style={{ color: '#242F43' }}>{fmt(loan.amount)}</span>
                        </td>
                        <td style={{ ...tdStyle, color: '#525E71' }}>
                          {fmtDate(loan.approved_at)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => router.push(`/dashboard/staff/disbursement/${loan.id}`)}
                            className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                          >
                            Cairkan Dana
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!approvedLoading && approvedPageInfo.total_pages > 1 && (
            <Pagination
              page={approvedPage}
              total={approvedPageInfo.total_pages}
              count={approvedPageInfo.count}
              pageSize={approvedPageInfo.page_size}
              onChange={setApprovedPage}
            />
          )}
        </div>

        {/* Table 2: Riwayat Pencairan Dana */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          {/* Search + Filter Bar */}
          <form
            onSubmit={applyDisbursedFilters}
            className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Riwayat Pencairan Dana
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0BAC5]" size={15} />
                <input
                  type="text"
                  placeholder="Cari nama anggota atau Loan ID..."
                  value={disbursedSearchInput}
                  onChange={(e) => setDisbursedSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FAFAFA',
                    color: '#242F43',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={14} />
                  <input
                    type="date"
                    value={disbursedStartDateInput}
                    onChange={(e) => setDisbursedStartDateInput(e.target.value)}
                    className="w-36 pl-9 pr-2 py-2 rounded-xl text-xs outline-none"
                    style={{
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#525E71',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: '#8E99A8' }}>—</span>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E99A8]" size={14} />
                  <input
                    type="date"
                    value={disbursedEndDateInput}
                    onChange={(e) => setDisbursedEndDateInput(e.target.value)}
                    className="w-36 pl-9 pr-2 py-2 rounded-xl text-xs outline-none"
                    style={{
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#525E71',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                Cari
              </button>

              {hasDisbursedFilter && (
                <button
                  type="button"
                  onClick={clearDisbursedFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    border: '1px solid #E5E7EB',
                    color: '#525E71',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Table */}
          {disbursedLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={24} className="text-[#94A3B8] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <Th>LOAN ID</Th>
                    <Th>NAMA ANGGOTA</Th>
                    <Th align="right">TOTAL DICAIRKAN</Th>
                    <Th>TGL PENCAIRAN</Th>
                    <Th align="center">STATUS</Th>
                  </tr>
                </thead>
                <tbody>
                  {disbursedLoans.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          text={hasDisbursedFilter
                            ? 'Tidak ada hasil untuk filter yang dipilih.'
                            : 'Belum ada riwayat pencairan dana.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    disbursedLoans.map((loan, i) => (
                      <tr
                        key={loan.id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < disbursedLoans.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                      >
                        <td style={tdStyle}>
                          <span className="font-bold" style={{ color: '#11447D', letterSpacing: '-0.2px' }}>
                            {loan.loan_id}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span className="font-semibold" style={{ color: '#242F43' }}>{loan.member_name}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span className="font-bold" style={{ color: '#242F43' }}>{fmt(loan.amount)}</span>
                        </td>
                        <td style={{ ...tdStyle, color: '#525E71' }}>
                          {fmtDate(loan.disbursed_at)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <StatusBadge status={loan.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!disbursedLoading && disbursedPageInfo.total_pages > 1 && (
            <Pagination
              page={disbursedPage}
              total={disbursedPageInfo.total_pages}
              count={disbursedPageInfo.count}
              pageSize={disbursedPageInfo.page_size}
              onChange={setDisbursedPage}
            />
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const tdStyle: React.CSSProperties = {
  padding: '14px 24px',
  verticalAlign: 'middle',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
}

const Th = ({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
  <th
    style={{
      padding: '12px 24px',
      textAlign: align || 'left',
      fontSize: 11,
      fontWeight: 600,
      color: '#8E99A8',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      fontFamily: 'Inter, sans-serif',
    }}
  >
    {children}
  </th>
)

const EmptyState = ({ text }: { text: string }) => (
  <div
    className="mx-6 my-8 rounded-xl py-10 text-center text-sm"
    style={{ backgroundColor: '#FAFAFA', border: '1px dashed #E2E8F0', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
  >
    {text}
  </div>
)
