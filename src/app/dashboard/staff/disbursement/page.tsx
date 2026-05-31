'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getApprovedLoans, getDisbursedLoans, ApprovedLoan, DisbursedLoan } from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { Search, ChevronLeft, ChevronRight, Loader, CalendarDays, Banknote, History } from 'lucide-react'

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
    APPROVED:            { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6', label: 'Disetujui' },
    ACTIVE:              { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Aktif' },
    LUNAS:               { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Lunas' },
    LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'Lunas (Telat)' },
    OVERDUE:             { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'Overdue' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', label: status }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: s.bg, color: s.color }}
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
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

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
      className="px-6 py-3 flex items-center justify-between text-xs"
      style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}
    >
      <span>
        Menampilkan {from}–{to} dari {count} data
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-40"
          style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1" style={{ color: '#94A3B8' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className="w-7 h-7 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: p === page ? '#242F43' : '#FFFFFF',
                color: p === page ? '#FFFFFF' : '#6B7280',
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
          className="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-40"
          style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffDisbursementPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('approved')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([])
  const [disbursedLoans, setDisbursedLoans] = useState<DisbursedLoan[]>([])
  const [loading, setLoading] = useState(false)
  const [approvedPageInfo, setApprovedPageInfo] = useState({ count: 0, total_pages: 1, page_size: 10 })
  const [disbursedPageInfo, setDisbursedPageInfo] = useState({ count: 0, total_pages: 1, page_size: 10 })

  const fetchApproved = useCallback(async (s: string, sd: string, ed: string, p: number) => {
    try {
      setLoading(true)
      const data = await getApprovedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setApprovedLoans(data.results)
      setApprovedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Gagal memuat pinjaman')
    } finally { setLoading(false) }
  }, [])

  const fetchDisbursed = useCallback(async (s: string, sd: string, ed: string, p: number) => {
    try {
      setLoading(true)
      const data = await getDisbursedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setDisbursedLoans(data.results)
      setDisbursedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Gagal memuat riwayat')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'approved') fetchApproved(search, startDate, endDate, page)
    else fetchDisbursed(search, startDate, endDate, page)
  }, [tab, page, search, startDate, endDate, fetchApproved, fetchDisbursed])

  const applyFilters = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    setSearch(searchInput.trim())
    setStartDate(startDateInput)
    setEndDate(endDateInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput(''); setSearch('')
    setStartDateInput(''); setEndDateInput('')
    setStartDate(''); setEndDate('')
    setPage(1)
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setPage(1)
  }

  const pageInfo = tab === 'approved' ? approvedPageInfo : disbursedPageInfo
  const hasFilter = !!(search || startDate || endDate)

  const TAB_CONFIG = [
    { key: 'approved' as Tab, label: 'Pinjaman Disetujui' },
    { key: 'history' as Tab, label: 'Riwayat Pencairan' },
  ]

  return (
    <DashboardLayout role="STAFF">
      <DashboardHeader
        variant="default"
        title="Manajemen Pencairan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-6 md:p-8 space-y-6 min-h-screen" style={{ background: '#F8FAFC' }}>

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

        {/* ── Main Table Card ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid #F1F5F9' }}>
            {TAB_CONFIG.map(({ key, label }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className="px-5 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
                  style={{
                    color: active ? '#11447D' : '#8E99A8',
                    borderBottom: active ? '2px solid #11447D' : '2px solid transparent',
                    marginBottom: -1,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {label}
                  {key === 'approved' && approvedPageInfo.count > 0 && (
                    <span
                      className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: active ? '#DBEAFE' : '#F3F4F6', color: active ? '#1E40AF' : '#6B7280' }}
                    >
                      {approvedPageInfo.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + Filter Bar */}
          <form
            onSubmit={applyFilters}
            className="px-6 py-4 flex flex-wrap items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0BAC5]" size={15} />
              <input
                type="text"
                placeholder="Cari nama anggota atau Loan ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
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
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-36 pl-9 pr-2 py-2.5 rounded-xl text-sm outline-none"
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
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-36 pl-9 pr-2 py-2.5 rounded-xl text-sm outline-none"
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
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
            >
              Terapkan
            </button>

            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#525E71',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Atur Ulang
              </button>
            )}
          </form>

          {/* Table header label */}
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}
            >
              {tab === 'approved' ? 'Daftar Pinjaman Siap Dicairkan' : 'Riwayat Pencairan Dana'}
            </h3>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ color: '#8E99A8', backgroundColor: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}
            >
              {pageInfo.count} DATA
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={24} className="text-[#94A3B8] animate-spin" />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {tab === 'approved' ? (
                      <>
                        <Th>LOAN ID</Th>
                        <Th>NAMA ANGGOTA</Th>
                        <Th>KATEGORI</Th>
                        <Th align="right">NOMINAL</Th>
                        <Th>TGL PERSETUJUAN</Th>
                        <Th align="center">AKSI</Th>
                      </>
                    ) : (
                      <>
                        <Th>LOAN ID</Th>
                        <Th>NAMA ANGGOTA</Th>
                        <Th align="right">TOTAL DICAIRKAN</Th>
                        <Th>TGL PENCAIRAN</Th>
                        <Th align="center">STATUS</Th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tab === 'approved' && approvedLoans.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          text={hasFilter
                            ? 'Tidak ada hasil untuk filter yang dipilih.'
                            : 'Belum ada pinjaman yang menunggu pencairan.'}
                        />
                      </td>
                    </tr>
                  )}
                  {tab === 'history' && disbursedLoans.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          text={hasFilter
                            ? 'Tidak ada hasil untuk filter yang dipilih.'
                            : 'Belum ada riwayat pencairan dana.'}
                        />
                      </td>
                    </tr>
                  )}

                  {tab === 'approved' && approvedLoans.map((loan, i) => (
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
                        {fmtDate((loan as ApprovedLoan).approved_at)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => router.push(`/dashboard/staff/disbursement/${loan.id}`)}
                          className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80 whitespace-nowrap"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}
                        >
                          Cairkan Dana
                        </button>
                      </td>
                    </tr>
                  ))}

                  {tab === 'history' && disbursedLoans.map((loan, i) => (
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
                        {fmtDate((loan as DisbursedLoan).disbursed_at)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <StatusBadge status={loan.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pageInfo.total_pages > 1 && (
            <Pagination
              page={page}
              total={pageInfo.total_pages}
              count={pageInfo.count}
              pageSize={pageInfo.page_size}
              onChange={setPage}
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
