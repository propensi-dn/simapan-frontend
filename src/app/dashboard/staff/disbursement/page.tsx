'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getApprovedLoans, getDisbursedLoans, ApprovedLoan, DisbursedLoan } from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader, X, Calendar } from 'lucide-react'

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
  const map: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED:            { bg: '#DBEAFE', color: '#1E40AF', label: 'Disetujui' },
    ACTIVE:              { bg: '#D1FAE5', color: '#065F46', label: 'Aktif' },
    LUNAS:               { bg: '#D1FAE5', color: '#065F46', label: 'Lunas' },
    LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', color: '#92400E', label: 'Lunas (Telat)' },
    OVERDUE:             { bg: '#FEE2E2', color: '#991B1B', label: 'Overdue' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', label: status }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: 0.3,
    }}>
      {s.label}
    </span>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null

  // build page list: 1 2 3 … 9
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

  const btn = (content: React.ReactNode, active: boolean, disabled: boolean, onClick: () => void, key: string | number) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36, borderRadius: 8,
        border: active ? 'none' : '1px solid #E5E7EB',
        background: active ? '#111827' : disabled ? '#F9FAFB' : '#fff',
        color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
        fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 8px',
      }}
    >
      {content}
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {btn(<ChevronLeft size={15} />, false, page === 1, () => onChange(page - 1), 'prev')}
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#94A3B8', fontSize: 14 }}>…</span>
          : btn(p, p === page, false, () => onChange(p as number), p)
      )}
      {btn(<ChevronRight size={15} />, false, page === total, () => onChange(page + 1), 'next')}
    </div>
  )
}

// ── Filter Panel ──────────────────────────────────────────────────────────────
const FilterPanel = ({
  startDate, endDate, onStartDate, onEndDate, onApply, onClear,
}: {
  startDate: string; endDate: string
  onStartDate: (v: string) => void; onEndDate: (v: string) => void
  onApply: () => void; onClear: () => void
}) => (
  <div style={{
    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
    background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: 20, minWidth: 300,
  }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
      Filter Rentang Tanggal
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
          DARI TANGGAL
        </label>
        <div style={{ position: 'relative' }}>
          <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="date" value={startDate} onChange={(e) => onStartDate(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
          SAMPAI TANGGAL
        </label>
        <div style={{ position: 'relative' }}>
          <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="date" value={endDate} onChange={(e) => onEndDate(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <button
        onClick={onClear}
        style={{
          flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #E5E7EB',
          background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Reset
      </button>
      <button
        onClick={onApply}
        style={{
          flex: 1, padding: '8px', borderRadius: 8, border: 'none',
          background: '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Terapkan
      </button>
    </div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffDisbursementPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('approved')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)

  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([])
  const [disbursedLoans, setDisbursedLoans] = useState<DisbursedLoan[]>([])
  const [loading, setLoading] = useState(false)
  const [approvedPageInfo, setApprovedPageInfo] = useState({ count: 0, total_pages: 0, page_size: 10 })
  const [disbursedPageInfo, setDisbursedPageInfo] = useState({ count: 0, total_pages: 0, page_size: 10 })

  const fetchApproved = useCallback(async (s = search, sd = startDate, ed = endDate, p = page) => {
    try {
      setLoading(true)
      const data = await getApprovedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setApprovedLoans(data.results)
      setApprovedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memuat pinjaman')
    } finally { setLoading(false) }
  }, [])

  const fetchDisbursed = useCallback(async (s = search, sd = startDate, ed = endDate, p = page) => {
    try {
      setLoading(true)
      const data = await getDisbursedLoans({ page: p, page_size: 10, search: s, start_date: sd, end_date: ed })
      setDisbursedLoans(data.results)
      setDisbursedPageInfo({ count: data.count, total_pages: data.total_pages, page_size: data.page_size })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memuat riwayat')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'approved') fetchApproved(search, startDate, endDate, page)
    else fetchDisbursed(search, startDate, endDate, page)
  }, [tab, page])

  const handleSearch = () => {
    setPage(1)
    if (tab === 'approved') fetchApproved(search, startDate, endDate, 1)
    else fetchDisbursed(search, startDate, endDate, 1)
  }

  const handleClear = () => {
    setSearch(''); setStartDate(''); setEndDate(''); setPage(1); setShowFilter(false)
    if (tab === 'approved') fetchApproved('', '', '', 1)
    else fetchDisbursed('', '', '', 1)
  }

  const handleApplyFilter = () => {
    setShowFilter(false); setPage(1)
    if (tab === 'approved') fetchApproved(search, startDate, endDate, 1)
    else fetchDisbursed(search, startDate, endDate, 1)
  }

  const pageInfo = tab === 'approved' ? approvedPageInfo : disbursedPageInfo
  const hasFilter = startDate || endDate

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader
        variant="default"
        title="Manajemen Pencairan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main style={{
        flex: 1,
        padding: '28px 32px',
        background: '#F7F8FA',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      }}>

        {/* ── Top bar: Tabs left, Search+Filter right ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24,
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, background: '#fff',
            border: '1px solid #E5E7EB', borderRadius: 12, padding: 4,
          }}>
            {([
              { key: 'approved', label: 'Pinjaman Disetujui' },
              { key: 'history',  label: 'Riwayat Peminjaman' },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setPage(1) }}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: tab === key ? '#111827' : 'transparent',
                  color: tab === key ? '#fff' : '#6B7280',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: '#94A3B8',
              }} />
              <input
                type="text"
                placeholder="Cari nama, ID atau tanggal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  padding: '9px 12px 9px 34px', borderRadius: 10,
                  border: '1px solid #E5E7EB', fontSize: 13,
                  color: '#111827', background: '#fff',
                  outline: 'none', width: 280,
                }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); handleSearch() }}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 10,
                  border: `1px solid ${hasFilter ? '#111827' : '#E5E7EB'}`,
                  background: hasFilter ? '#111827' : '#fff',
                  color: hasFilter ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={15} />
                Filter
                {hasFilter && (
                  <span style={{
                    background: '#fff', color: '#111827',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {[startDate, endDate].filter(Boolean).length}
                  </span>
                )}
              </button>
              {showFilter && (
                <FilterPanel
                  startDate={startDate} endDate={endDate}
                  onStartDate={setStartDate} onEndDate={setEndDate}
                  onApply={handleApplyFilter} onClear={handleClear}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #E8ECF0',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
              <Loader size={24} style={{ color: '#94A3B8', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                  {tab === 'approved' ? (
                    <>
                      <Th>LOAN ID</Th>
                      <Th>NAMA MEMBER</Th>
                      <Th>KATEGORI</Th>
                      <Th align="right">NOMINAL</Th>
                      <Th>TGL PERSETUJUAN</Th>
                      <Th align="center">AKSI</Th>
                    </>
                  ) : (
                    <>
                      <Th>LOAN ID</Th>
                      <Th>NAMA MEMBER</Th>
                      <Th align="right">TOTAL DICAIRKAN</Th>
                      <Th>TGL PENCAIRAN</Th>
                      <Th align="center">STATUS</Th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tab === 'approved' && approvedLoans.length === 0 && (
                  <tr><td colSpan={6}><Empty text="Tidak ada pinjaman yang disetujui" /></td></tr>
                )}
                {tab === 'history' && disbursedLoans.length === 0 && (
                  <tr><td colSpan={5}><Empty text="Tidak ada riwayat pencairan" /></td></tr>
                )}

                {tab === 'approved' && approvedLoans.map((loan, i) => (
                  <tr
                    key={loan.id}
                    style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFBFD')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' }}>
                        {loan.loan_id}
                      </span>
                    </td>
                    <td style={tdStyle}>{loan.member_name}</td>
                    <td style={tdStyle}>
                      <span style={{ color: '#6B7280' }}>{loan.category_display}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                      {fmt(loan.amount)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>
                      {fmtDate((loan as ApprovedLoan).approved_at)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => router.push(`/dashboard/staff/disbursement/${loan.id}`)}
                        style={{
                          padding: '8px 20px', borderRadius: 8, border: 'none',
                          background: '#111827', color: '#fff',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          transition: 'background 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1F2937')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#111827')}
                      >
                        Cairkan Dana
                      </button>
                    </td>
                  </tr>
                ))}

                {tab === 'history' && disbursedLoans.map((loan, i) => (
                  <tr
                    key={loan.id}
                    style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFBFD')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' }}>
                        {loan.loan_id}
                      </span>
                    </td>
                    <td style={tdStyle}>{loan.member_name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                      {fmt(loan.amount)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>
                      {fmtDate((loan as DisbursedLoan).disbursed_at)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {pageInfo.total_pages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 20,
          }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              Menampilkan {(page - 1) * pageInfo.page_size + 1}–
              {Math.min(page * pageInfo.page_size, pageInfo.count)} dari {pageInfo.count} data
            </span>
            <Pagination page={page} total={pageInfo.total_pages} onChange={setPage} />
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const tdStyle: React.CSSProperties = {
  padding: '16px 20px', color: '#374151', verticalAlign: 'middle',
}

const Th = ({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
  <th style={{
    padding: '12px 20px',
    textAlign: align || 'left',
    fontSize: 11, fontWeight: 700,
    color: '#94A3B8', letterSpacing: 0.8,
    whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
)

const Empty = ({ text }: { text: string }) => (
  <div style={{
    padding: '60px 20px', textAlign: 'center',
    color: '#94A3B8', fontSize: 14,
  }}>
    {text}
  </div>
)