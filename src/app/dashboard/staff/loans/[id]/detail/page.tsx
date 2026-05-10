'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import {
  exportStaffLoanInstallmentsCsv,
  getStaffLoanMonitoringDetail,
  StaffLoanInstallmentRow,
  StaffLoanMonitoringSummary,
} from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Eye, FileText, X } from 'lucide-react'

const formatCurrency = (value: string | number): string => {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof value === 'string' ? Number(value) : value)
  } catch {
    return String(value)
  }
}

const formatDate = (value: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeMessage = (error as { response?: { data?: { error?: unknown } } }).response?.data?.error
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }
  }
  return fallback
}

const InstallmentStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    PAID: { bg: '#111827', text: '#FFFFFF' },
    PENDING: { bg: '#FFF7ED', text: '#C2410C' },
    UNPAID: { bg: '#F3F4F6', text: '#6B7280' },
  }

  const style = styles[status] || { bg: '#F3F4F6', text: '#6B7280' }

  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-md"
      style={{ backgroundColor: style.bg, color: style.text, fontFamily: 'Inter, sans-serif' }}
    >
      {status}
    </span>
  )
}

export default function StaffLoanDetailMonitoringPage() {
  const params = useParams<{ id: string }>()
  const loanPk = Number(params.id)

  const [loan, setLoan] = useState<StaffLoanMonitoringSummary | null>(null)
  const [rows, setRows] = useState<StaffLoanInstallmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)

  const loadDetail = useCallback(async (targetPage: number) => {
    if (!Number.isFinite(loanPk)) return
    try {
      setLoading(true)
      const data = await getStaffLoanMonitoringDetail(loanPk, {
        page: targetPage,
        page_size: pageSize,
      })
      setLoan(data.loan)
      setRows(data.installments.results)
      setCount(data.installments.count)
      setTotalPages(Math.max(data.installments.total_pages, 1))
      setPage(data.installments.current_page)
      setPageSize(data.installments.page_size)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat detail pinjaman.'))
    } finally {
      setLoading(false)
    }
  }, [loanPk, pageSize])

  useEffect(() => {
    loadDetail(1)
  }, [loadDetail])

  const progressPercent = useMemo(() => {
    return Math.max(0, Math.min(100, loan?.payment_progress_percent || 0))
  }, [loan])

  const showingFrom = useMemo(() => {
    if (count === 0) return 0
    return (page - 1) * pageSize + 1
  }, [count, page, pageSize])

  const showingTo = useMemo(() => {
    if (count === 0) return 0
    return Math.min(page * pageSize, count)
  }, [count, page, pageSize])

  const handleExport = async () => {
    if (!loan) return

    try {
      setExporting(true)
      const blob = await exportStaffLoanInstallmentsCsv(loan.id)
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `loan_installments_${loan.loan_id}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
      toast.success('Export CSV berhasil')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Gagal export CSV.'))
    } finally {
      setExporting(false)
    }
  }

  const openProofModal = (url: string | null) => {
    if (!url) {
      toast.error('Bukti transfer tidak tersedia untuk cicilan ini.')
      return
    }
    setProofUrl(url)
    setProofModalOpen(true)
  }

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader
        variant="default"
        title={
          <span className="text-sm font-normal" style={{ fontFamily: 'Inter, sans-serif', color: '#8E99A8' }}>
            <Link href="/dashboard/staff/installments" className="hover:underline">
              Pembayaran Cicilan
            </Link>
            <span className="mx-2">›</span>
            <span className="font-semibold" style={{ color: '#242F43' }}>
              {loan?.loan_id || `Pinjaman #${loanPk}`}
            </span>
          </span>
        }
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8 bg-[#F8FAFC] min-h-screen space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {loan ? `#${loan.loan_id} - ${loan.member_name}` : 'Detail Pinjaman'}
            </h1>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              PROGRES PEMBAYARAN
            </p>
            <div className="flex items-end justify-between">
              <div className="w-full pr-4">
                <div className="h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%`, backgroundColor: '#111827' }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                  {(loan?.paid_installments || 0)} dari {(loan?.total_installments || 0)} Bulan Sudah Dibayar
                </p>
              </div>
              <span className="text-2xl font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                {progressPercent.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              SISA TAGIHAN
            </p>
            <p className="text-4xl font-bold" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
              {loan ? formatCurrency(loan.outstanding_balance) : '-'}
            </p>
            <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Pokok + Bunga
            </p>
          </div>

          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              JATUH TEMPO BERIKUTNYA
            </p>
            <p className="text-4xl font-bold" style={{ color: '#111827', fontFamily: 'Montserrat, sans-serif' }}>
              {formatDate(loan?.next_due_date || null)}
            </p>
            <p className="text-xs mt-2" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Siklus {loan?.paid_installments ?? 0}/{loan?.total_installments ?? 0}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
              Jadwal Cicilan Lengkap
            </h2>
            <Button type="button" size="sm" variant="ghost" onClick={handleExport} loading={exporting}>
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  {['BULAN', 'JATUH TEMPO', 'JUMLAH', 'STATUS', 'AKSI'].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-[11px] font-semibold"
                      style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Memuat detail cicilan...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-sm" style={{ color: '#8E99A8' }}>
                      Belum ada data cicilan.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: index < rows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        {row.installment_number}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <InstallmentStatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'PAID' ? (
                          <button
                            type="button"
                            onClick={() => openProofModal(row.transfer_proof_url)}
                            className="inline-flex items-center gap-1 text-sm"
                            style={{ color: '#6B7280' }}
                            title="Lihat bukti transfer"
                          >
                            <Eye size={16} />
                            Lihat
                          </button>
                        ) : row.status === 'PENDING' ? (
                          <Link
                            href={`/dashboard/staff/installments/${row.id}`}
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#111827', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
                          >
                            Tinjau
                          </Link>
                        ) : (
                          <span className="text-sm" style={{ color: '#B0BAC5' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}>
            <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Menampilkan {showingFrom} sampai {showingTo} dari {count} data
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDetail(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md disabled:opacity-40"
                style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadDetail(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md disabled:opacity-40"
                style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {proofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProofModalOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                Bukti Transfer Cicilan
              </h3>
              <button type="button" onClick={() => setProofModalOpen(false)} style={{ color: '#8E99A8' }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              {proofUrl?.toLowerCase().endsWith('.pdf') ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                    <FileText size={16} />
                    Dokumen PDF
                  </div>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-semibold"
                    style={{ color: '#11447D' }}
                  >
                    Buka PDF di tab baru
                  </a>
                </div>
              ) : (
                <img src={proofUrl || ''} alt="Bukti Transfer" className="max-h-[70vh] mx-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
