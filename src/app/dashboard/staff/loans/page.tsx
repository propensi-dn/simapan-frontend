'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Link from 'next/link'
import { getApprovedLoans, getDisbursedLoans, disburseLoans, ApprovedLoan, DisbursedLoan } from '@/lib/staff-api'
import DisburseLoanModal from './_components/DisburseLoanModal'
import toast from 'react-hot-toast'
import { Search, Calendar, ChevronLeft, ChevronRight, Loader } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'approved' | 'history'

// ── Icons ──────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    APPROVED: { bg: '#DBEAFE', text: '#1E40AF' },
    ACTIVE: { bg: '#D1FAE5', text: '#065F46' },
    LUNAS: { bg: '#D1FAE5', text: '#065F46' },
    LUNAS_AFTER_OVERDUE: { bg: '#FEF3C7', text: '#92400E' },
    OVERDUE: { bg: '#FEE2E2', text: '#991B1B' },
  }
  
  const style = statusColors[status] || { bg: '#E5E7EB', text: '#374151' }
  
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  )
}

const CurrencyFormat = ({ value }: { value: string }) => {
  try {
    const num = parseFloat(value)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  } catch {
    return value
  }
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function StaffLoansPage() {
  const [tab, setTab] = useState<Tab>('approved')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  
  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([])
  const [disbursedLoans, setDisbursedLoans] = useState<DisbursedLoan[]>([])
  const [loading, setLoading] = useState(false)
  const [approvedPageInfo, setApprovedPageInfo] = useState({
    count: 0,
    total_pages: 0,
    page_size: 10,
  })
  const [disbursedPageInfo, setDisbursedPageInfo] = useState({
    count: 0,
    total_pages: 0,
    page_size: 10,
  })
  
  const [selectedLoan, setSelectedLoan] = useState<ApprovedLoan | null>(null)
  const [disburseModalOpen, setDisburseModalOpen] = useState(false)
  const [disbursing, setDisbursing] = useState(false)

  // Fetch approved loans
  const fetchApprovedLoans = useCallback(async (searchTerm?: string, startD?: string, endD?: string, pageNum?: number) => {
    try {
      setLoading(true)
      const data = await getApprovedLoans({
        page: pageNum || page,
        page_size: 10,
        search: searchTerm !== undefined ? searchTerm : search,
        start_date: startD !== undefined ? startD : startDate,
        end_date: endD !== undefined ? endD : endDate,
      })
      setApprovedLoans(data.results)
      setApprovedPageInfo({
        count: data.count,
        total_pages: data.total_pages,
        page_size: data.page_size,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memuat daftar pinjaman')
    } finally {
      setLoading(false)
    }
  }, [page, search, startDate, endDate])

  // Fetch disbursed loans
  const fetchDisbursedLoans = useCallback(async (searchTerm?: string, startD?: string, endD?: string, pageNum?: number) => {
    try {
      setLoading(true)
      const data = await getDisbursedLoans({
        page: pageNum || page,
        page_size: 10,
        search: searchTerm !== undefined ? searchTerm : search,
        start_date: startD !== undefined ? startD : startDate,
        end_date: endD !== undefined ? endD : endDate,
      })
      setDisbursedLoans(data.results)
      setDisbursedPageInfo({
        count: data.count,
        total_pages: data.total_pages,
        page_size: data.page_size,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memuat riwayat pinjaman')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and pagination change
  useEffect(() => {
    if (tab === 'approved') {
      fetchApprovedLoans(search, startDate, endDate, page)
    } else {
      fetchDisbursedLoans(search, startDate, endDate, page)
    }
  }, [tab, page, search, startDate, endDate, fetchApprovedLoans, fetchDisbursedLoans])

  // Handle search
  const handleSearch = () => {
    setPage(1)
    if (tab === 'approved') {
      fetchApprovedLoans(search, startDate, endDate, 1)
    } else {
      fetchDisbursedLoans(search, startDate, endDate, 1)
    }
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    setPage(1)
    if (tab === 'approved') {
      fetchApprovedLoans('', '', '', 1)
    } else {
      fetchDisbursedLoans('', '', '', 1)
    }
  }

  // Handle disburse
  const handleDisburse = (loan: ApprovedLoan) => {
    setSelectedLoan(loan)
    setDisburseModalOpen(true)
  }

  const handleDisbursureConfirm = async (proof?: File) => {
    if (!selectedLoan) return
    
    try {
      setDisbursing(true)
      
      let formData: FormData | undefined
      if (proof) {
        formData = new FormData()
        formData.append('disbursement_proof', proof)
      }
      
      await disburseLoans(selectedLoan.id, formData)

      toast.success('Pinjaman berhasil dicairkan!')
      setDisburseModalOpen(false)
      setSelectedLoan(null)
      fetchApprovedLoans(search, startDate, endDate, 1)
      fetchDisbursedLoans(search, startDate, endDate, 1)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || 'Gagal mencairkan pinjaman')
    } finally {
      setDisbursing(false)
    }
  }

  // Pagination
  const currentPageData = tab === 'approved' ? approvedPageInfo : disbursedPageInfo

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader
        variant="default"
        title="Daftar Pinjaman"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/dashboard/staff">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <BackIcon />
              </button>
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              Kelola Pencairan Pinjaman
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#8E99A8' }}>
            Lihat daftar pinjaman yang siap dicairkan dan riwayat pencairan
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 bg-white rounded-xl border border-gray-200" style={{ width: 'fit-content' }}>
          <button
            onClick={() => {
              setTab('approved')
              setPage(1)
            }}
            className={`px-6 py-3 font-medium transition-all rounded-lg ${
              tab === 'approved'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{
              fontFamily: 'Inter, sans-serif',
              borderRadius: tab === 'approved' ? '0.5rem' : '0',
            }}
          >
            Pinjaman APPROVED ({approvedPageInfo.count})
          </button>
          <button
            onClick={() => {
              setTab('history')
              setPage(1)
            }}
            className={`px-6 py-3 font-medium transition-all rounded-lg ${
              tab === 'history'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{
              fontFamily: 'Inter, sans-serif',
              borderRadius: tab === 'history' ? '0.5rem' : '0',
            }}
          >
            Riwayat Pencairan ({disbursedPageInfo.count})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Cari Pinjaman</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Loan ID atau nama member"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Dari Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Ke Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={handleSearch}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cari
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="animate-spin text-blue-600" size={24} />
            </div>
          ) : tab === 'approved' && approvedLoans.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Tidak ada pinjaman APPROVED</p>
            </div>
          ) : tab === 'history' && disbursedLoans.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Tidak ada riwayat pencairan</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">LOAN ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">NAMA MEMBER</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">KATEGORI</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">NOMINAL</th>
                  {tab === 'approved' && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">TGL APPROVAL</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">ACTION</th>
                    </>
                  )}
                  {tab === 'history' && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">TGL PENCAIRAN</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">OLEH</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">STATUS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(tab === 'approved' ? approvedLoans : disbursedLoans).map((loan, idx) => (
                  <tr
                    key={loan.id}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{loan.loan_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{loan.member_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{loan.category_display}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      <CurrencyFormat value={loan.amount} />
                    </td>
                    
                    {tab === 'approved' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date((loan as ApprovedLoan).approved_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDisburse(loan as ApprovedLoan)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Cairkan Dana
                          </button>
                        </td>
                      </>
                    )}

                    {tab === 'history' && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date((loan as DisbursedLoan).disbursed_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(loan as DisbursedLoan).disbursed_by_name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <StatusBadge status={loan.status} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {currentPageData.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Menampilkan halaman {page} dari {currentPageData.total_pages} ({currentPageData.count} data)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: currentPageData.total_pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(currentPageData.total_pages, p + 1))}
                disabled={page === currentPageData.total_pages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Disburse Modal */}
      {selectedLoan && (
        <DisburseLoanModal
          isOpen={disburseModalOpen}
          onClose={() => {
            setDisburseModalOpen(false)
            setSelectedLoan(null)
          }}
          loan={selectedLoan}
          onConfirm={handleDisbursureConfirm}
          loading={disbursing}
        />
      )}
    </DashboardLayout>
  )
}
