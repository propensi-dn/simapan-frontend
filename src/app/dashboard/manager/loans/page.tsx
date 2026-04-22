'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  getManagerPendingLoans,
  type ManagerLoanSummary,
  type ManagerPendingLoanItem,
  type ManagerAllLoanItem,
  type ManagerLoanActivityItem,
  type ManagerNearDueLoanItem,
  type LoanStatus,
} from '@/lib/loans-api'

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Number(v))

const fmtDate = (iso: string | null) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function ManagerLoansPage() {
  const [summary, setSummary] = useState<ManagerLoanSummary | null>(null)
  const [pendingRows, setPendingRows] = useState<ManagerPendingLoanItem[]>([])
  const [allRows, setAllRows] = useState<ManagerAllLoanItem[]>([])
  const [activityRows, setActivityRows] = useState<ManagerLoanActivityItem[]>([])
  const [nearDueRows, setNearDueRows] = useState<ManagerNearDueLoanItem[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'application_date' | '-application_date'>('-application_date')
  const [allSearchInput, setAllSearchInput] = useState('')
  const [allSearch, setAllSearch] = useState('')
  const [allStatus, setAllStatus] = useState<'' | LoanStatus>('')
  const [allPage, setAllPage] = useState(1)
  const [allTotalPages, setAllTotalPages] = useState(1)
  const [allCount, setAllCount] = useState(0)

  const pageSize = 10
  const allPageSize = 10

  const load = useCallback(async (
    nextPage: number,
    q: string,
    nextSort: 'application_date' | '-application_date',
    nextAllSearch: string,
    nextAllStatus: '' | LoanStatus,
    nextAllPage: number,
  ) => {
    setLoading(true)
    setError('')
    try {
      const data = await getManagerPendingLoans({
        page: nextPage,
        page_size: pageSize,
        search: q || undefined,
        sort: nextSort,
        all_search: nextAllSearch || undefined,
        all_status: nextAllStatus || undefined,
        all_page: nextAllPage,
        all_page_size: allPageSize,
      })
      setSummary(data.summary)
      setPendingRows(data.pending_loans.results)
      setAllRows(data.all_loans.results)
      setActivityRows(data.loan_activity_barchart)
      setNearDueRows(data.near_due_loans)
      setPage(data.pending_loans.current_page)
      setTotalPages(data.pending_loans.total_pages)
      setCount(data.pending_loans.count)
      setAllPage(data.all_loans.current_page)
      setAllTotalPages(data.all_loans.total_pages)
      setAllCount(data.all_loans.count)
    } catch {
      setError('Gagal memuat daftar pinjaman. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1, search, sort, allSearch, allStatus, 1)
  }, [load, search, sort, allSearch, allStatus])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handlePage = (next: number) => {
    if (next < 1 || next > totalPages) return
    load(next, search, sort, allSearch, allStatus, allPage)
  }

  const handleAllSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setAllSearch(allSearchInput)
  }

  const handleAllPage = (next: number) => {
    if (next < 1 || next > allTotalPages) return
    load(page, search, sort, allSearch, allStatus, next)
  }

  const paginationRange = () => {
    const delta = 2
    const range: (number | '...')[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    if (range[0] !== 1) { range.unshift('...'); range.unshift(1) }
    if (range[range.length - 1] !== totalPages) { range.push('...'); range.push(totalPages) }
    return range
  }

  return (
    <DashboardLayout role="MANAGER" userName="Manajer" userID="MGR-0001">
      <DashboardHeader variant="default" title="Persetujuan Pinjaman" notifCount={0} />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Daftar Pengajuan Pinjaman
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Daftar pengajuan pinjaman yang menunggu peninjauan manajer.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Total Pengajuan Pending
            </p>
            <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {summary?.total_pending ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Total Pinjaman Disetujui
            </p>
            <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {summary?.total_approved ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Total Pinjaman Terlambat
            </p>
            <p className="font-bold text-3xl" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              {summary?.total_overdue ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #F1F5F9' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
                Aktivitas Pinjaman (6 Bulan)
              </h3>
              <p className="text-xs" style={{ color: '#8E99A8' }}>
                Total nominal pending: {fmtRp(summary?.total_requested_amount ?? 0)}
              </p>
            </div>
            <div className="flex items-end gap-2 h-40">
              {activityRows.map((item) => {
                const max = Math.max(...activityRows.map(x => x.total), 1)
                const h = Math.max(0, Math.round((item.total / max) * 100))
                return (
                  <div key={item.month} className="flex-1 h-full flex flex-col items-center gap-1.5">
                    <div className="w-full h-28 flex items-end">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: item.total > 0 ? `${Math.max(8, h)}%` : '2px',
                          backgroundColor: item.total > 0 ? '#242F43' : '#E5E7EB',
                        }}
                      />
                    </div>
                    <span className="text-[10px]" style={{ color: '#8E99A8' }}>{item.month}</span>
                    <span className="text-[10px] font-semibold" style={{ color: '#525E71' }}>{item.total}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h3 className="font-bold text-base" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                Jatuh Tempo Dalam 14 Hari
              </h3>
            </div>
            {nearDueRows.length === 0 ? (
              <div className="px-5 py-10 text-sm text-center" style={{ color: '#8E99A8' }}>
                Tidak ada pinjaman yang mendekati jatuh tempo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['NAMA ANGGOTA', 'ID PINJAMAN', 'SISA PINJAMAN', 'JATUH TEMPO', 'STATUS', 'AKSI'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                          style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nearDueRows.map((loan, i) => {
                      const st = STATUS_BADGE[loan.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
                      return (
                        <tr key={loan.id} style={{ borderBottom: i < nearDueRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                          <td className="px-4 py-3 text-sm" style={{ color: '#242F43' }}>{loan.member_name}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#525E71' }}>{loan.loan_id}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#242F43' }}>{fmtRp(loan.remaining_balance)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#525E71' }}>{fmtDate(loan.due_date)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                              style={{ backgroundColor: st.bg, color: st.text }}>
                              {loan.status_display}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/dashboard/manager/loans/${loan.id}`}
                              className="text-xs font-bold px-2.5 py-1 rounded-md"
                              style={{ backgroundColor: '#242F43', color: '#fff' }}>
                              Lihat Detail
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama anggota..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 rounded-xl text-sm outline-none"
                  style={{
                    border: '1px solid #E5E7EB',
                    color: '#242F43',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: '#FAFAFA',
                  }}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#242F43', color: '#fff' }}>
                  Cari
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearch('') }}
                  className="px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  Atur Ulang
                </button>
              )}
            </form>

            <button
              onClick={() => setSort(prev => prev === '-application_date' ? 'application_date' : '-application_date')}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
              Urutkan Tanggal: {sort === '-application_date' ? 'Terbaru' : 'Terlama'}
            </button>

            <span className="ml-auto text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {count} pengajuan
            </span>
          </div>

          {error ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#EF4444' }}>
              {error}
              <button
                onClick={() => load(page, search, sort, allSearch, allStatus, allPage)}
                className="ml-2 underline font-semibold"
                style={{ color: '#11447D' }}>
                Coba lagi
              </button>
            </div>
          ) : loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : pendingRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#8E99A8' }}>
              {search ? `Tidak ada hasil untuk "${search}".` : 'Tidak ada pinjaman PENDING.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['NAMA ANGGOTA', 'KATEGORI PINJAMAN', 'NOMINAL PENGAJUAN', 'TENOR', 'TANGGAL PENGAJUAN', 'AKSI'].map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((loan, i) => (
                    <tr key={loan.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                      style={{ borderBottom: i < pendingRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {loan.member_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {loan.category_display}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {fmtRp(loan.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {loan.tenor} bulan
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {fmtDate(loan.application_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/manager/loans/${loan.id}`}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all"
                          style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                          Tinjau
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pendingRows.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Halaman {page} dari {totalPages} • {count} total data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  {'<'}
                </button>

                {paginationRange().map((p, idx) =>
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  {'>'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          <div className="px-6 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base mr-auto" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              Semua Pinjaman
            </h3>

            <form onSubmit={handleAllSearch} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari anggota..."
                value={allSearchInput}
                onChange={e => setAllSearchInput(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#242F43', color: '#fff' }}>
                Cari
              </button>
            </form>

            <select
              value={allStatus}
              onChange={e => setAllStatus(e.target.value as '' | LoanStatus)}
              className="px-3 py-2 rounded-xl text-xs outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43' }}>
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="APPROVED">Disetujui</option>
              <option value="ACTIVE">Aktif</option>
              <option value="OVERDUE">Jatuh Tempo Terlewat</option>
              <option value="LUNAS">Lunas</option>
              <option value="LUNAS_AFTER_OVERDUE">Lunas Setelah Terlambat</option>
              <option value="REJECTED">Ditolak</option>
            </select>

            {(allSearch || allStatus) && (
              <button
                type="button"
                onClick={() => {
                  setAllSearchInput('')
                  setAllSearch('')
                  setAllStatus('')
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                Atur Ulang
              </button>
            )}
          </div>

          {allRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-center" style={{ color: '#8E99A8' }}>
              Tidak ada data pinjaman untuk filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['NAMA ANGGOTA', 'ID PINJAMAN', 'SISA PINJAMAN', 'JATUH TEMPO', 'STATUS', 'AKSI'].map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((loan, i) => {
                    const st = STATUS_BADGE[loan.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
                    return (
                      <tr key={loan.id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < allRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                          {loan.member_name}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                          {loan.loan_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                          {fmtRp(loan.remaining_balance)}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                          {fmtDate(loan.due_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
                            style={{ backgroundColor: st.bg, color: st.text, fontFamily: 'Inter, sans-serif' }}>
                            {loan.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/manager/loans/${loan.id}`}
                            className="text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: '#242F43', color: '#fff' }}>
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && allRows.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Menampilkan {(allPage - 1) * allPageSize + 1}–{Math.min(allPage * allPageSize, allCount)} dari {allCount} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAllPage(allPage - 1)}
                  disabled={allPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  {'<'}
                </button>
                <span className="px-3 text-xs" style={{ color: '#525E71' }}>{allPage}</span>
                <button
                  onClick={() => handleAllPage(allPage + 1)}
                  disabled={allPage === allTotalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  {'>'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
