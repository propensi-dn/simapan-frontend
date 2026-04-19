'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import { getStaffLoanDashboard, LoanDashboard, UpcomingDueLoan } from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Loader, TrendingUp } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface PageInfo {
  count: number
  total_pages: number
  current_page: number
  page_size: number
}

// ── Icons ──────────────────────────────────────────────────────────────────
const ApprovedIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UnverifiedIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const OverdueIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: '#D1FAE5', text: '#065F46' },
    OVERDUE: { bg: '#FEE2E2', text: '#991B1B' },
    LUNAS: { bg: '#D1FAE5', text: '#065F46' },
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

// ── Format helpers ──────────────────────────────────────────────────────────
const formatCurrency = (value: string | number): string => {
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

// ── Main Page ──────────────────────────────────────────────────────────────
export default function StaffLoanDashboardPage() {
  const [dashboard, setDashboard] = useState<LoanDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    count: 0,
    total_pages: 0,
    current_page: 1,
    page_size: 10,
  })

  const fetchDashboard = useCallback(async (pageNum?: number) => {
    try {
      setLoading(true)
      const data = await getStaffLoanDashboard({
        page: pageNum || page,
        page_size: 10,
      })
      setDashboard(data)
      setPageInfo({
        count: data.upcoming_due_loans.count,
        total_pages: data.upcoming_due_loans.total_pages,
        current_page: data.upcoming_due_loans.current_page,
        page_size: data.upcoming_due_loans.page_size,
      })
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal memuat dashboard pinjaman')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchDashboard()
  }, [page, fetchDashboard])

  if (loading && !dashboard) {
    return (
      <DashboardLayout role="STAFF" userName="Staff" userID="STAFF-0001">
        <DashboardHeader variant="default" title="Dashboard Aktivitas Pinjaman" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="STAFF" userName="Staff" userID="STAFF-0001">
      <DashboardHeader
        variant="default"
        title="Dashboard Aktivitas Pinjaman"
      />

      <main className="flex-1 p-8 bg-gray-50 min-h-screen">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Pinjaman Disetujui"
            value={String(dashboard?.summary.total_approved_loans || 0)}
            subtitle={formatCurrency(dashboard?.summary.total_approved_amount || 0)}
            icon={<ApprovedIcon />}
            accent="#11447D"
          />
          <StatCard
            label="Cicilan Belum Terverifikasi"
            value={String(dashboard?.summary.total_unverified_installments || 0)}
            subtitle={formatCurrency(dashboard?.summary.total_unverified_amount || 0)}
            icon={<UnverifiedIcon />}
            accent="#F59E0B"
          />
          <StatCard
            label="Pinjaman Overdue"
            value={String(dashboard?.summary.total_overdue_loans || 0)}
            subtitle={formatCurrency(dashboard?.summary.total_overdue_amount || 0)}
            icon={<OverdueIcon />}
            accent="#EF4444"
          />
        </div>

        {/* Loan Activities Chart */}
        <div className="bg-white rounded-2xl p-6 mb-8" style={{ border: '1px solid #F1F5F9' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Aktivitas Pinjaman (6 Bulan Terakhir)
              </h2>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
                Jumlah pinjaman yang dicairkan per bulan
              </p>
            </div>
            <TrendingUp width={24} height={24} style={{ color: '#11447D' }} />
          </div>

          {/* Chart Container */}
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {dashboard?.loan_activities?.map((activity, index) => {
              const maxCount = Math.max(
                1,
                ...dashboard.loan_activities.map((a) => a.count)
              )
              const height = (activity.count / maxCount) * 100

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-lg hover:from-blue-500 hover:to-blue-400 transition-all cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                    title={`${activity.month}: ${activity.count} pinjaman (${formatCurrency(activity.amount)})`}
                  />
                  <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                    {activity.month.split('-')[1]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Due Loans Table */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Pinjaman Mendekati Due Date
              </h2>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
                Pinjaman dengan jatuh tempo dalam 2 minggu ke depan
              </p>
            </div>
          </div>

          {/* Table */}
          {dashboard?.upcoming_due_loans.results && dashboard.upcoming_due_loans.results.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Loan ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Nama Member
                      </th>
                      <th className="text-right py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Sisa Cicilan
                      </th>
                      <th className="text-center py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Due Date
                      </th>
                      <th className="text-center py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Sisa Hari
                      </th>
                      <th className="text-center py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-semibold" style={{ color: '#6B7280' }}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.upcoming_due_loans.results.map((loan: UpcomingDueLoan, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                        }}
                      >
                        <td className="py-3 px-4 font-semibold" style={{ color: '#242F43' }}>
                          {loan.loan_id}
                        </td>
                        <td className="py-3 px-4" style={{ color: '#374151' }}>
                          {loan.member_name}
                        </td>
                        <td className="py-3 px-4 text-right" style={{ color: '#374151' }}>
                          {formatCurrency(loan.remaining_balance)}
                        </td>
                        <td className="py-3 px-4 text-center" style={{ color: '#374151' }}>
                          {new Date(loan.next_due_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-semibold"
                            style={{
                              color: loan.days_until_due <= 3 ? '#DC2626' : '#F59E0B',
                            }}
                          >
                            {loan.days_until_due} hari
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={loan.status} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/dashboard/staff/loans/${loan.id}`}
                            className="inline-block px-4 py-2 rounded-lg font-semibold transition-all"
                            style={{
                              backgroundColor: '#11447D',
                              color: '#FFFFFF',
                              fontSize: '0.875rem',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0D2D54'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#11447D'
                            }}
                          >
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pageInfo.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                    Menampilkan {(pageInfo.current_page - 1) * pageInfo.page_size + 1}-
                    {Math.min(pageInfo.current_page * pageInfo.page_size, pageInfo.count)} dari {pageInfo.count}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: '#E5E7EB',
                        color: page === 1 ? '#9CA3AF' : '#374151',
                      }}
                    >
                      <ChevronLeft width={16} height={16} />
                      Sebelumnya
                    </button>
                    <span
                      className="flex items-center px-4 py-2 rounded-lg"
                      style={{ backgroundColor: '#F3F4F6', color: '#374151', fontFamily: 'Inter, sans-serif' }}
                    >
                      Halaman {pageInfo.current_page} dari {pageInfo.total_pages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(pageInfo.total_pages, page + 1))}
                      disabled={page === pageInfo.total_pages}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: '#E5E7EB',
                        color: page === pageInfo.total_pages ? '#9CA3AF' : '#374151',
                      }}
                    >
                      Selanjutnya
                      <ChevronRight width={16} height={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className="py-8 text-center rounded-lg"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <p style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Tidak ada pinjaman yang mendekati due date dalam 2 minggu ke depan
              </p>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
