'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Calendar, ChevronLeft, ChevronRight, Loader, Search, SlidersHorizontal, X } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getApprovedLoans, getDisbursedLoans, type ApprovedLoan, type DisbursedLoan } from '@/lib/staff-api'

type PageInfo = {
  count: number
  total_pages: number
  page_size: number
  current_page: number
}

const PAGE_SIZE = 10

const fmt = (value: string | number) => {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  } catch {
    return String(value)
  }
}

const fmtDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeError = (error as { response?: { data?: { error?: unknown } } }).response?.data?.error
    if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
  }
  return fallback
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Disetujui' },
    ACTIVE: { bg: '#DCFCE7', color: '#166534', label: 'Aktif' },
    LUNAS: { bg: '#DCFCE7', color: '#166534', label: 'Lunas' },
    LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', color: '#92400E', label: 'Lunas (Telat)' },
    OVERDUE: { bg: '#FEE2E2', color: '#991B1B', label: 'Overdue' },
  }

  const style = map[status] || { bg: '#F1F5F9', color: '#525E71', label: status }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: style.bg, color: style.color, fontFamily: 'Inter, sans-serif' }}
    >
      {style.label}
    </span>
  )
}

const formatPageNumbers = (page: number, totalPages: number) => {
  const pages: Array<number | '…'> = []
  if (totalPages <= 7) {
    for (let index = 1; index <= totalPages; index += 1) pages.push(index)
    return pages
  }

  pages.push(1)
  if (page > 3) pages.push('…')
  for (let index = Math.max(2, page - 1); index <= Math.min(totalPages - 1, page + 1); index += 1) {
    pages.push(index)
  }
  if (page < totalPages - 2) pages.push('…')
  pages.push(totalPages)
  return pages
}

const SectionFooterPagination = ({
  page,
  totalPages,
  count,
  pageSize,
  onChange,
}: {
  page: number
  totalPages: number
  count: number
  pageSize: number
  onChange: (nextPage: number) => void
}) => {
  if (totalPages <= 1) return null

  const pages = formatPageNumbers(page, totalPages)

  return (
    <div
      className="px-6 py-3 flex items-center justify-between text-sm"
      style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
    >
      <span>
        Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} dari {count} data
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: item === page ? '#242F43' : 'transparent',
                color: item === page ? '#FFFFFF' : '#525E71',
                border: item === page ? 'none' : '1px solid #E5E7EB',
              }}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

const TableEmpty = ({ text }: { text: string }) => (
  <div className="px-6 py-12 text-center text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
    {text}
  </div>
)

const SectionHeader = ({
  title,
  subtitle,
  count,
}: {
  title: string
  subtitle: string
  count: number
}) => (
  <div className="px-6 py-4 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
    <div>
      <h3 className="font-bold text-base" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
        {title}
      </h3>
      <p className="text-xs mt-1" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
        {subtitle}
      </p>
    </div>
    <span
      className="text-[10px] font-bold px-2 py-1 rounded-full"
      style={{ color: '#8E99A8', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
    >
      {count} HASIL
    </span>
  </div>
)

const FilterPanel = ({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  onApply,
  onClear,
}: {
  startDate: string
  endDate: string
  onStartDate: (value: string) => void
  onEndDate: (value: string) => void
  onApply: () => void
  onClear: () => void
}) => (
  <div
    className="absolute top-[calc(100%+8px)] right-0 z-50 rounded-2xl border bg-white p-5 shadow-lg"
    style={{ borderColor: '#E5E7EB', minWidth: 300 }}
  >
    <p className="mb-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
      Filter Rentang Tanggal
    </p>
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E99A8' }}>
          Dari tanggal
        </label>
        <div className="relative">
          <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8E99A8' }} />
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDate(event.target.value)}
            className="w-full rounded-xl border bg-[#FAFAFA] py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E99A8' }}>
          Sampai tanggal
        </label>
        <div className="relative">
          <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8E99A8' }} />
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDate(event.target.value)}
            className="w-full rounded-xl border bg-[#FAFAFA] py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={onClear}
        className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold"
        style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
      >
        Terapkan
      </button>
    </div>
  </div>
)

export default function StaffDisbursementPage() {
  const router = useRouter()
  const filterRef = useRef<HTMLDivElement | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([])
  const [disbursedLoans, setDisbursedLoans] = useState<DisbursedLoan[]>([])

  const [approvedLoading, setApprovedLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)

  const [approvedPage, setApprovedPage] = useState(1)
  const [approvedPageInfo, setApprovedPageInfo] = useState<PageInfo>({
    count: 0,
    total_pages: 1,
    page_size: PAGE_SIZE,
    current_page: 1,
  })

  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageInfo, setHistoryPageInfo] = useState<PageInfo>({
    count: 0,
    total_pages: 1,
    page_size: PAGE_SIZE,
    current_page: 1,
  })

  const loadApproved = useCallback(
    async (pageNumber: number, query: string, fromDate: string, toDate: string) => {
      try {
        setApprovedLoading(true)
        const data = await getApprovedLoans({
          page: pageNumber,
          page_size: PAGE_SIZE,
          search: query || undefined,
          start_date: fromDate || undefined,
          end_date: toDate || undefined,
        })
        setApprovedLoans(data.results)
        setApprovedPageInfo({
          count: data.count,
          total_pages: data.total_pages,
          page_size: data.page_size,
          current_page: data.current_page,
        })
        setApprovedPage(data.current_page)
      } catch (error) {
        toast.error(getErrorMessage(error, 'Gagal memuat daftar pinjaman disetujui.'))
      } finally {
        setApprovedLoading(false)
      }
    },
    [],
  )

  const loadHistory = useCallback(async (pageNumber: number) => {
    try {
      setHistoryLoading(true)
      const data = await getDisbursedLoans({ page: pageNumber, page_size: PAGE_SIZE })
      setDisbursedLoans(data.results)
      setHistoryPageInfo({
        count: data.count,
        total_pages: data.total_pages,
        page_size: data.page_size,
        current_page: data.current_page,
      })
      setHistoryPage(data.current_page)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal memuat riwayat pencairan.'))
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadApproved(1, '', '', '')
    void loadHistory(1)
  }, [loadApproved, loadHistory])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasFilter = Boolean(startDate || endDate)

  const applySearch = () => {
    setApprovedPage(1)
    void loadApproved(1, searchInput.trim(), startDate, endDate)
    setSearch(searchInput.trim())
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStartDate('')
    setEndDate('')
    setApprovedPage(1)
    void loadApproved(1, '', '', '')
    setShowFilter(false)
  }

  const approvedRangeText = useMemo(() => {
    if (approvedPageInfo.count === 0) return 'Belum ada pinjaman yang disetujui.'
    const from = (approvedPageInfo.current_page - 1) * approvedPageInfo.page_size + 1
    const to = Math.min(approvedPageInfo.current_page * approvedPageInfo.page_size, approvedPageInfo.count)
    return `Menampilkan ${from}–${to} dari ${approvedPageInfo.count} data`
  }, [approvedPageInfo])

  const historyRangeText = useMemo(() => {
    if (historyPageInfo.count === 0) return 'Belum ada riwayat pencairan.'
    const from = (historyPageInfo.current_page - 1) * historyPageInfo.page_size + 1
    const to = Math.min(historyPageInfo.current_page * historyPageInfo.page_size, historyPageInfo.count)
    return `Menampilkan ${from}–${to} dari ${historyPageInfo.count} data`
  }, [historyPageInfo])

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader variant="default" title="Manajemen Pencairan" notifCount={0} notifHref="/dashboard/staff/notifications" />

      <main className="flex-1 px-8 py-7 space-y-6" style={{ background: '#F7F8FA', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
            Manajemen Pencairan
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Kelola daftar pinjaman yang siap dicairkan dan pantau riwayat pencairan sebelumnya.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8E99A8' }}>
              Pinjaman Disetujui
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {approvedPageInfo.count}
            </p>
            <p className="mt-2 text-xs" style={{ color: '#8E99A8' }}>
              Menunggu proses pencairan dana.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8E99A8' }}>
              Riwayat Pencairan
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {historyPageInfo.count}
            </p>
            <p className="mt-2 text-xs" style={{ color: '#8E99A8' }}>
              Pencairan yang sudah diproses.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="mr-auto">
              <h3 className="text-base font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Pinjaman Disetujui
              </h3>
              <p className="mt-1 text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Daftar pinjaman yang siap dicairkan kepada anggota.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                applySearch()
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8E99A8' }} />
                <input
                  type="text"
                  placeholder="Cari nama, ID atau tanggal..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-72 rounded-xl border bg-[#FAFAFA] py-2.5 pl-9 pr-9 text-sm outline-none"
                  style={{ borderColor: '#E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setSearch('')
                      void loadApproved(1, '', startDate, endDate)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E99A8]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setShowFilter((current) => !current)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                  style={{
                    border: `1px solid ${hasFilter ? '#242F43' : '#E5E7EB'}`,
                    backgroundColor: hasFilter ? '#242F43' : '#FFFFFF',
                    color: hasFilter ? '#FFFFFF' : '#525E71',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <SlidersHorizontal size={15} />
                  Filter
                  {hasFilter && (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#242F43]">
                      {[startDate, endDate].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {showFilter && (
                  <FilterPanel
                    startDate={startDate}
                    endDate={endDate}
                    onStartDate={setStartDate}
                    onEndDate={setEndDate}
                    onApply={() => {
                      setApprovedPage(1)
                      setShowFilter(false)
                      void loadApproved(1, searchInput.trim(), startDate, endDate)
                    }}
                    onClear={clearFilters}
                  />
                )}
              </div>

              {(search || startDate || endDate) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71', fontFamily: 'Inter, sans-serif' }}
                >
                  Atur Ulang
                </button>
              )}
            </form>
          </div>

          {approvedLoading && approvedLoans.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center">
              <Loader size={24} className="animate-spin" style={{ color: '#8E99A8' }} />
            </div>
          ) : approvedLoans.length === 0 ? (
            <TableEmpty text={search || startDate || endDate ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Tidak ada pinjaman yang disetujui saat ini.'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>LOAN ID</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>NAMA MEMBER</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>KATEGORI</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>NOMINAL</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>TGL PERSETUJUAN</th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLoans.map((loan, index) => (
                    <tr key={loan.id} style={{ borderBottom: index < approvedLoans.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#11447D' }}>{loan.loan_id}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#242F43' }}>{loan.member_name}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>{loan.category_display}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>{fmt(loan.amount)}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>{fmtDate((loan as ApprovedLoan).approved_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/staff/disbursement/${loan.id}`)}
                          className="rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
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

          {!approvedLoading && approvedLoans.length > 0 && (
            <SectionFooterPagination
              page={approvedPage}
              totalPages={approvedPageInfo.total_pages}
              count={approvedPageInfo.count}
              pageSize={approvedPageInfo.page_size}
              onChange={(nextPage) => {
                void loadApproved(nextPage, searchInput.trim(), startDate, endDate)
              }}
            />
          )}
        </section>

        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <SectionHeader
            title="Riwayat Pencairan Dana"
            subtitle="Dana yang sudah berhasil dicairkan kepada anggota."
            count={historyPageInfo.count}
          />

          {historyLoading && disbursedLoans.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center">
              <Loader size={24} className="animate-spin" style={{ color: '#8E99A8' }} />
            </div>
          ) : disbursedLoans.length === 0 ? (
            <TableEmpty text="Belum ada riwayat pencairan." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>LOAN ID</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>NAMA MEMBER</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>TOTAL DICAIRKAN</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>TGL PENCAIRAN</th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold tracking-wider" style={{ color: '#8E99A8' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursedLoans.map((loan, index) => (
                    <tr key={loan.id} style={{ borderBottom: index < disbursedLoans.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#11447D' }}>{loan.loan_id}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#242F43' }}>{loan.member_name}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>{fmt(loan.amount)}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>{fmtDate((loan as DisbursedLoan).disbursed_at)}</td>
                      <td className="px-6 py-4 text-center"><StatusBadge status={loan.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!historyLoading && disbursedLoans.length > 0 && (
            <SectionFooterPagination
              page={historyPage}
              totalPages={historyPageInfo.total_pages}
              count={historyPageInfo.count}
              pageSize={historyPageInfo.page_size}
              onChange={(nextPage) => {
                void loadHistory(nextPage)
              }}
            />
          )}
        </section>

        <div className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
          {approvedRangeText} • {historyRangeText}
        </div>
      </main>
    </DashboardLayout>
  )
}
