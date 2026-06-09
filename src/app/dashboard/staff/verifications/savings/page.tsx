'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import {
  getSavingTransactions,
  type SavingTransaction,
  type SavingType,
  type SavingStatus,
} from '@/lib/savings-api'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const fmtRp = (v: string | number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(Number(v))

const TX_STATUS: Record<SavingStatus, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', label: 'PENDING' },
  SUCCESS:  { bg: '#ECFDF5', text: '#047857', dot: '#10B981', label: 'VERIFIED' },
  REJECTED: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'REJECTED' },
}

const TYPE_INFO: Record<SavingType, { bg: string; text: string; label: string }> = {
  POKOK:    { bg: '#DBEAFE', text: '#1E40AF', label: 'Simpanan Pokok'    },
  WAJIB:    { bg: '#D1FAE5', text: '#065F46', label: 'Simpanan Wajib'    },
  SUKARELA: { bg: '#FEF3C7', text: '#92400E', label: 'Simpanan Sukarela' },
}

const MEMBER_STATUS: Record<string, { bg: string; text: string }> = {
  VERIFIED: { bg: '#DBEAFE', text: '#1E40AF' },
  ACTIVE:   { bg: '#D1FAE5', text: '#065F46' },
  PENDING:  { bg: '#F3F4F6', text: '#6B7280' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
}

const STATUS_FILTERS = [
  { key: 'ALL',      label: 'Semua Status' },
  { key: 'SUCCESS',  label: 'Terverifikasi' },
  { key: 'REJECTED', label: 'Ditolak' },
] as const

const TYPE_FILTERS = [
  { key: '',         label: 'Semua' },
  { key: 'POKOK',    label: 'Pokok' },
  { key: 'WAJIB',    label: 'Wajib' },
  { key: 'SUKARELA', label: 'Sukarela' },
] as const

export default function SavingsVerifListPage() {
  // Pending Table State
  const [pendingRows,       setPendingRows]       = useState<SavingTransaction[]>([])
  const [pendingCount,      setPendingCount]      = useState(0)
  const [pendingTotalPages, setPendingTotalPages] = useState(1)
  const [pendingPage,       setPendingPage]       = useState(1)
  const [pendingLoading,    setPendingLoading]    = useState(true)
  const [pendingError,      setPendingError]      = useState('')

  const [pendingTypeFilter, setPendingTypeFilter] = useState('')
  const [pendingSearchText, setPendingSearchText] = useState('')
  const [pendingSearchQ,    setPendingSearchQ]    = useState('')

  // History Table State
  const [historyRows,       setHistoryRows]       = useState<SavingTransaction[]>([])
  const [historyCount,      setHistoryCount]      = useState(0)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyPage,       setHistoryPage]       = useState(1)
  const [historyLoading,    setHistoryLoading]    = useState(true)
  const [historyError,      setHistoryError]      = useState('')

  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'SUCCESS' | 'REJECTED'>('ALL')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('')
  const [historySearchText, setHistorySearchText] = useState('')
  const [historySearchQ,    setHistorySearchQ]    = useState('')

  const loadPending = useCallback(async (p: number, type: string, q: string) => {
    setPendingLoading(true); setPendingError('')
    try {
      const res = await getSavingTransactions({
        page: p, page_size: 10,
        status:      'PENDING',
        saving_type: type || undefined,
        search:      q    || undefined,
      })
      setPendingRows(res.results); setPendingCount(res.count)
      setPendingTotalPages(res.total_pages); setPendingPage(res.current_page)
    } catch {
      setPendingError('Gagal memuat data. Silakan coba lagi.')
    } finally { setPendingLoading(false) }
  }, [])

  const loadHistory = useCallback(async (p: number, status: string, type: string, q: string) => {
    setHistoryLoading(true); setHistoryError('')
    try {
      const res = await getSavingTransactions({
        page: p, page_size: 10,
        status:      status === 'ALL' ? undefined : status || undefined,
        saving_type: type || undefined,
        search:      q    || undefined,
      })
      setHistoryRows(res.results); setHistoryCount(res.count)
      setHistoryTotalPages(res.total_pages); setHistoryPage(res.current_page)
    } catch {
      setHistoryError('Gagal memuat data. Silakan coba lagi.')
    } finally { setHistoryLoading(false) }
  }, [])

  useEffect(() => { loadPending(1, pendingTypeFilter, pendingSearchQ) }, [pendingTypeFilter, pendingSearchQ, loadPending])
  useEffect(() => { loadHistory(1, historyStatusFilter, historyTypeFilter, historySearchQ) }, [historyStatusFilter, historyTypeFilter, historySearchQ, loadHistory])

  const getPageRange = (current: number, total: number): (number | '…')[] => {
    const d = 2, out: (number | '…')[] = []
    for (let i = Math.max(1, current - d); i <= Math.min(total, current + d); i++) out.push(i)
    if (out.length === 0) return out
    if ((out[0] as number) > 1) { out.unshift('…'); out.unshift(1) }
    if ((out[out.length - 1] as number) < total) { out.push('…'); out.push(total) }
    return out
  }

  return (
    <DashboardLayout role="STAFF">
      <DashboardHeader
        variant="default"
        title="Verifikasi Setoran Simpanan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8 space-y-8">
        <div>
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Verifikasi Setoran Simpanan
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Tinjau dan verifikasi bukti transfer setoran simpanan anggota.
          </p>
        </div>

        {/* Table 1: Permintaan Verifikasi Setoran */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          {/* toolbar */}
          <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              Permintaan Verifikasi Setoran
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <form onSubmit={e => { e.preventDefault(); setPendingSearchQ(pendingSearchText) }}
                className="flex items-center gap-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input type="text" placeholder="Cari transaksi..."
                    value={pendingSearchText} onChange={e => setPendingSearchText(e.target.value)}
                    className="w-64 pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                    style={{ border: '1px solid #E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif', backgroundColor: '#FAFAFA' }}
                  />
                </div>
                <button type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#242F43', color: '#fff' }}>
                  Cari
                </button>
                {pendingSearchQ && (
                  <button type="button"
                    onClick={() => { setPendingSearchText(''); setPendingSearchQ('') }}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                    Reset
                  </button>
                )}
              </form>

              {/* Type Filter Dropdown */}
              <select
                value={pendingTypeFilter}
                onChange={e => setPendingTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                {TYPE_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.key === '' ? 'Semua Jenis' : f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* body */}
          {pendingError ? (
            <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
              {pendingError}&nbsp;
              <button onClick={() => loadPending(pendingPage, pendingTypeFilter, pendingSearchQ)}
                className="underline font-semibold" style={{ color: '#11447D' }}>Coba lagi</button>
            </div>
          ) : pendingLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : pendingRows.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#8E99A8' }}>
              Tidak ada permintaan verifikasi{pendingSearchQ ? ` untuk "${pendingSearchQ}"` : ''}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['ID TRANSAKSI', 'ANGGOTA', 'JENIS SIMPANAN', 'NOMINAL', 'STATUS', 'TGL SUBMIT', 'AKSI'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((tx, i) => {
                    const st = TX_STATUS[tx.status]
                    const tp = TYPE_INFO[tx.saving_type]
                    const ms = MEMBER_STATUS[tx.member_status] ?? MEMBER_STATUS.PENDING
                    return (
                      <tr key={tx.id} className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < pendingRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <td className="px-5 py-4">
                          <p className="text-xs font-mono font-semibold" style={{ color: '#11447D' }}>{tx.saving_id}</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: '#B0BAC5' }}>{tx.transaction_id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>{tx.member_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#8E99A8' }}>{tx.member_email}</p>
                          <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: ms.bg, color: ms.text, fontFamily: 'Inter, sans-serif' }}>
                            {tx.member_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: tp.bg, color: tp.text, fontFamily: 'Inter, sans-serif' }}>
                            {tp.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-sm"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                            {fmtRp(tx.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: st.bg, color: st.text, fontFamily: 'Inter, sans-serif' }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                          {fmtDate(tx.submitted_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/staff/verifications/savings/${tx.id}`}
                            className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                            Tinjau
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination */}
          {!pendingLoading && !pendingError && (
            <div className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Halaman {pendingPage} dari {pendingTotalPages} • {pendingCount} total data
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => loadPending(pendingPage - 1, pendingTypeFilter, pendingSearchQ)} disabled={pendingPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>‹</button>
                {getPageRange(pendingPage, pendingTotalPages).map((p, idx) =>
                  p === '…'
                    ? <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>…</span>
                    : <button key={p} onClick={() => loadPending(p as number, pendingTypeFilter, pendingSearchQ)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: p === pendingPage ? '#242F43' : 'transparent',
                          color: p === pendingPage ? '#fff' : '#525E71',
                          border: p === pendingPage ? 'none' : '1px solid #E5E7EB',
                        }}>{p}</button>
                )}
                <button onClick={() => loadPending(pendingPage + 1, pendingTypeFilter, pendingSearchQ)} disabled={pendingPage === pendingTotalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* Table 2: Riwayat Verifikasi Setoran */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>
          {/* toolbar */}
          <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="font-bold text-base" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
              Riwayat Verifikasi Setoran
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <form onSubmit={e => { e.preventDefault(); setHistorySearchQ(historySearchText) }}
                className="flex items-center gap-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input type="text" placeholder="Cari transaksi..."
                    value={historySearchText} onChange={e => setHistorySearchText(e.target.value)}
                    className="w-64 pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                    style={{ border: '1px solid #E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif', backgroundColor: '#FAFAFA' }}
                  />
                </div>
                <button type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#242F43', color: '#fff' }}>
                  Cari
                </button>
                {historySearchQ && (
                  <button type="button"
                    onClick={() => { setHistorySearchText(''); setHistorySearchQ('') }}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                    style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                    Reset
                  </button>
                )}
              </form>

              {/* Status Filter Dropdown */}
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                {STATUS_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Type Filter Dropdown */}
              <select
                value={historyTypeFilter}
                onChange={e => setHistoryTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#242F43', fontFamily: 'Inter, sans-serif' }}
              >
                {TYPE_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.key === '' ? 'Semua Jenis' : f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* body */}
          {historyError ? (
            <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
              {historyError}&nbsp;
              <button onClick={() => loadHistory(historyPage, historyStatusFilter, historyTypeFilter, historySearchQ)}
                className="underline font-semibold" style={{ color: '#11447D' }}>Coba lagi</button>
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : historyRows.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#8E99A8' }}>
              Tidak ada riwayat transaksi{historySearchQ ? ` untuk "${historySearchQ}"` : ''}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['ID TRANSAKSI', 'ANGGOTA', 'JENIS SIMPANAN', 'NOMINAL', 'STATUS', 'TGL SUBMIT', 'AKSI'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider"
                        style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((tx, i) => {
                    const st = TX_STATUS[tx.status]
                    const tp = TYPE_INFO[tx.saving_type]
                    const ms = MEMBER_STATUS[tx.member_status] ?? MEMBER_STATUS.PENDING
                    return (
                      <tr key={tx.id} className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < historyRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <td className="px-5 py-4">
                          <p className="text-xs font-mono font-semibold" style={{ color: '#11447D' }}>{tx.saving_id}</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: '#B0BAC5' }}>{tx.transaction_id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>{tx.member_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#8E99A8' }}>{tx.member_email}</p>
                          <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: ms.bg, color: ms.text, fontFamily: 'Inter, sans-serif' }}>
                            {tx.member_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: tp.bg, color: tp.text, fontFamily: 'Inter, sans-serif' }}>
                            {tp.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-sm"
                            style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                            {fmtRp(tx.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ backgroundColor: st.bg, color: st.text, fontFamily: 'Inter, sans-serif' }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                          {fmtDate(tx.submitted_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/staff/verifications/savings/${tx.id}`}
                            className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: '#242F43', fontFamily: 'Inter, sans-serif' }}>
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

          {/* pagination */}
          {!historyLoading && !historyError && (
            <div className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Halaman {historyPage} dari {historyTotalPages} • {historyCount} total data
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => loadHistory(historyPage - 1, historyStatusFilter, historyTypeFilter, historySearchQ)} disabled={historyPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>‹</button>
                {getPageRange(historyPage, historyTotalPages).map((p, idx) =>
                  p === '…'
                    ? <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#8E99A8' }}>…</span>
                    : <button key={p} onClick={() => loadHistory(p as number, historyStatusFilter, historyTypeFilter, historySearchQ)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: p === historyPage ? '#242F43' : 'transparent',
                          color: p === historyPage ? '#fff' : '#525E71',
                          border: p === historyPage ? 'none' : '1px solid #E5E7EB',
                        }}>{p}</button>
                )}
                <button onClick={() => loadHistory(historyPage + 1, historyStatusFilter, historyTypeFilter, historySearchQ)} disabled={historyPage === historyTotalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>›</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}