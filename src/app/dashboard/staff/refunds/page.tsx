'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  completeRefund,
  getStaffRefundDetail,
  getStaffRefunds,
  type RefundDetail,
  type RefundItem,
  type RefundStatus,
} from '@/lib/refunds-api'

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

export default function StaffRefundsPage() {
  const [pendingRows, setPendingRows] = useState<RefundItem[]>([])
  const [historyRows, setHistoryRows] = useState<RefundItem[]>([])
  const [summary, setSummary] = useState({ total_pending: 0, total_completed: 0 })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Pagination – pending
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  // Pagination – history (status=COMPLETED)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyCount, setHistoryCount] = useState(0)

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal state
  const [confirmItem, setConfirmItem] = useState<RefundItem | null>(null)
  const [detailData, setDetailData] = useState<RefundDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pageSize = 10

  const loadPending = useCallback(
    async (nextPage: number, q: string, sd: string, ed: string) => {
      try {
        const data = await getStaffRefunds({
          page: nextPage,
          page_size: pageSize,
          search: q || undefined,
          status: 'PENDING' as RefundStatus,
          start_date: sd || undefined,
          end_date: ed || undefined,
        })
        setSummary(data.summary)
        setPendingRows(data.results)
        setPage(data.current_page)
        setTotalPages(data.total_pages)
        setCount(data.count)
      } catch {
        setError('Gagal memuat daftar pengembalian dana.')
      }
    },
    [],
  )

  const loadHistory = useCallback(
    async (nextPage: number) => {
      try {
        const data = await getStaffRefunds({
          page: nextPage,
          page_size: pageSize,
          status: 'COMPLETED' as RefundStatus,
        })
        setSummary(data.summary)
        setHistoryRows(data.results)
        setHistoryPage(data.current_page)
        setHistoryTotalPages(data.total_pages)
        setHistoryCount(data.count)
      } catch {
        // silent – summary may already be loaded
      }
    },
    [],
  )

  const reload = useCallback(
    async (p: number, h: number, q: string, sd: string, ed: string) => {
      setLoading(true)
      setError('')
      await Promise.all([loadPending(p, q, sd, ed), loadHistory(h)])
      setLoading(false)
    },
    [loadPending, loadHistory],
  )

  useEffect(() => {
    reload(1, 1, search, startDate, endDate)
  }, [reload, search, startDate, endDate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleReset = () => {
    setSearchInput('')
    setSearch('')
    setStartDate('')
    setEndDate('')
  }

  const openModal = async (item: RefundItem) => {
    setConfirmItem(item)
    setStep(1)
    setDetailData(null)
    setProofFile(null)
    setLoadingDetail(true)
    try {
      const detail = await getStaffRefundDetail(item.id)
      setDetailData(detail)
    } catch {
      toast.error('Gagal memuat detail pengembalian.')
      setConfirmItem(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeModal = () => {
    if (submitting) return
    setConfirmItem(null)
    setDetailData(null)
    setStep(1)
    setProofFile(null)
  }

  const handleSubmitTransfer = async () => {
    if (!confirmItem || !proofFile) return
    setSubmitting(true)
    try {
      await completeRefund(confirmItem.id, proofFile)
      toast.success('Dana berhasil dicairkan.')
      closeModal()
      reload(page, historyPage, search, startDate, endDate)
    } catch {
      toast.error('Gagal mencairkan dana. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="STAFF" userName="Petugas">
      <DashboardHeader variant="default" title="Pengembalian Dana" />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Pengembalian Dana
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Kelola daftar dana yang perlu dikembalikan kepada anggota beserta riwayat pencairannya.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8' }}>
              Menunggu Pencairan
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {summary.total_pending}
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: summary.total_pending > 0 ? '#EF4444' : '#8E99A8' }}
            >
              {summary.total_pending > 0 ? 'Membutuhkan tindakan segera' : 'Tidak ada yang tertunda'}
            </p>
          </div>
          <div className="bg-white rounded-2xl px-6 py-5" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8' }}>
              Total Selesai Dicairkan
            </p>
            <p
              className="font-bold text-3xl mt-1"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              {summary.total_completed}
            </p>
            <p className="text-xs mt-2" style={{ color: '#10B981' }}>
              Pengembalian berhasil diproses
            </p>
          </div>
        </div>

        {/* Pending table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div
            className="px-6 py-4 flex flex-wrap items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <h3
              className="font-bold text-base mr-auto"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Daftar Dana yang Perlu Dikembalikan
            </h3>

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
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#242F43', color: '#fff' }}
              >
                Cari
              </button>
            </form>

            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: '#525E71' }}>Dari:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              />
              <label className="text-xs" style={{ color: '#525E71' }}>s/d:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              />
            </div>

            {(search || startDate || endDate) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
              >
                Atur Ulang
              </button>
            )}
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
              {search || startDate || endDate
                ? 'Tidak ada hasil untuk filter yang dipilih.'
                : 'Tidak ada dana yang perlu dikembalikan saat ini.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['LOAN ID', 'NAMA ANGGOTA', 'TOTAL PENGEMBALIAN', 'TANGGAL APPROVAL', 'AKSI'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((row, i) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                      style={{
                        borderBottom: i < pendingRows.length - 1 ? '1px solid #F8FAFC' : 'none',
                      }}
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {row.loan_id || (
                          <span className="italic" style={{ color: '#8E99A8' }}>
                            {row.source_type === 'RESIGNATION' ? 'Resign' : '-'}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-semibold"
                        style={{ color: '#242F43' }}
                      >
                        <div>{row.member_name}</div>
                        <div className="text-xs font-normal" style={{ color: '#8E99A8' }}>
                          {row.member_id || ''}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-bold"
                        style={{ color: '#242F43' }}
                      >
                        {fmtRp(row.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {fmtDate(row.approved_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openModal(row)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: '#242F43' }}
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

          {!loading && !error && pendingRows.length > 0 && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}
            >
              <span>
                Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} dari{' '}
                {count} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (page > 1) reload(page - 1, historyPage, search, startDate, endDate)
                  }}
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
                  onClick={() => {
                    if (page < totalPages)
                      reload(page + 1, historyPage, search, startDate, endDate)
                  }}
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

        {/* History table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3
              className="font-bold text-base"
              style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
            >
              Riwayat Pencairan Dana
            </h3>
            <p className="text-xs mt-1" style={{ color: '#8E99A8' }}>
              Dana yang sudah berhasil dicairkan kepada anggota.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 flex justify-center">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }}
              />
            </div>
          ) : historyRows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm" style={{ color: '#8E99A8' }}>
              Belum ada riwayat pencairan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['LOAN ID', 'NAMA ANGGOTA', 'TOTAL PENGEMBALIAN', 'TANGGAL PENCAIRAN'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                          style={{ color: '#8E99A8' }}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: i < historyRows.length - 1 ? '1px solid #F8FAFC' : 'none',
                      }}
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {row.loan_id || (
                          <span className="italic" style={{ color: '#8E99A8' }}>
                            {row.source_type === 'RESIGNATION' ? 'Resign' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43' }}>
                        <div>{row.member_name}</div>
                        <div className="text-xs font-normal" style={{ color: '#8E99A8' }}>
                          {row.member_id || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43' }}>
                        {fmtRp(row.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                        {fmtDate(row.disbursed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && historyRows.length > 0 && (
            <div
              className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}
            >
              <span>
                Menampilkan {(historyPage - 1) * pageSize + 1}–
                {Math.min(historyPage * pageSize, historyCount)} dari {historyCount} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (historyPage > 1)
                      reload(page, historyPage - 1, search, startDate, endDate)
                  }}
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
                  onClick={() => {
                    if (historyPage < historyTotalPages)
                      reload(page, historyPage + 1, search, startDate, endDate)
                  }}
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

      {/* Modal - Step 1: Konfirmasi + Step 2: Upload bukti */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={() => closeModal()}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="py-12 flex justify-center">
                <div
                  className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#11447D', borderTopColor: 'transparent' }}
                />
              </div>
            ) : step === 1 ? (
              <>
                <h4
                  className="font-bold text-lg"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                >
                  Konfirmasi Pencairan Dana
                </h4>
                <p className="text-sm mt-2" style={{ color: '#525E71' }}>
                  Tinjau detail pengembalian sebelum melanjutkan pencairan.
                </p>

                <div
                  className="mt-5 rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
                >
                  {confirmItem.loan_id && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#525E71' }}>Loan ID</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>
                        {confirmItem.loan_id}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#525E71' }}>Nama Anggota</span>
                    <span className="font-semibold" style={{ color: '#242F43' }}>
                      {confirmItem.member_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#525E71' }}>ID Anggota</span>
                    <span className="font-semibold" style={{ color: '#242F43' }}>
                      {confirmItem.member_id || '-'}
                    </span>
                  </div>
                  <div
                    className="flex justify-between text-sm pt-3"
                    style={{ borderTop: '1px solid #E5E7EB' }}
                  >
                    <span style={{ color: '#525E71' }}>Total Pengembalian</span>
                    <span
                      className="font-bold text-base"
                      style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {fmtRp(confirmItem.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: '#242F43' }}
                  >
                    Konfirmasi Pencairan Dana
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4
                  className="font-bold text-lg"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
                >
                  Upload Bukti Transfer
                </h4>
                <p className="text-sm mt-2" style={{ color: '#525E71' }}>
                  Transfer dana ke rekening anggota berikut, lalu unggah bukti transfer.
                </p>

                {detailData?.bank_info ? (
                  <div
                    className="mt-5 rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
                  >
                    <p
                      className="text-xs font-semibold tracking-wider uppercase"
                      style={{ color: '#8E99A8' }}
                    >
                      Informasi Rekening Tujuan
                    </p>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#525E71' }}>Bank</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>
                        {detailData.bank_info.bank_name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#525E71' }}>No. Rekening</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>
                        {detailData.bank_info.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#525E71' }}>Atas Nama</span>
                      <span className="font-semibold" style={{ color: '#242F43' }}>
                        {detailData.bank_info.account_holder}
                      </span>
                    </div>
                    <div
                      className="flex justify-between text-sm pt-3"
                      style={{ borderTop: '1px solid #E5E7EB' }}
                    >
                      <span style={{ color: '#525E71' }}>Jumlah Transfer</span>
                      <span
                        className="font-bold text-base"
                        style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {fmtRp(confirmItem.amount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mt-5 rounded-xl p-4 text-sm"
                    style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
                  >
                    Info bank anggota tidak tersedia. Hubungi anggota untuk konfirmasi rekening.
                  </div>
                )}

                <div className="mt-5">
                  <label
                    className="block text-xs font-semibold mb-2"
                    style={{ color: '#525E71' }}
                  >
                    Bukti Transfer (Wajib)
                  </label>
                  <div
                    className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
                    style={{
                      borderColor: proofFile ? '#10B981' : '#E5E7EB',
                      backgroundColor: proofFile ? '#F0FDF4' : '#FAFAFA',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {proofFile ? (
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#065F46' }}>
                          {proofFile.name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                          Klik untuk mengganti file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm" style={{ color: '#525E71' }}>
                          Klik untuk memilih file bukti transfer
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#8E99A8' }}>
                          Format: JPG, PNG, PDF
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitTransfer}
                    disabled={submitting || !proofFile}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#242F43' }}
                  >
                    {submitting ? 'Memproses...' : 'Submit Transfer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
