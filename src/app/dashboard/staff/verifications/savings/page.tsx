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
  PENDING:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Menunggu' },
  SUCCESS:  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Terverifikasi' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Ditolak' },
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

const STATUS_TABS = [
  { key: 'PENDING',  label: 'Menunggu Verifikasi' },
  { key: 'SUCCESS',  label: 'Terverifikasi' },
  { key: 'REJECTED', label: 'Ditolak' },
  { key: 'ALL',      label: 'Semua' },
] as const

const TYPE_FILTERS = [
  { key: '',         label: 'Semua' },
  { key: 'POKOK',    label: 'Pokok' },
  { key: 'WAJIB',    label: 'Wajib' },
  { key: 'SUKARELA', label: 'Sukarela' },
] as const

export default function SavingsVerifListPage() {
  const [rows,       setRows]       = useState<SavingTransaction[]>([])
  const [count,      setCount]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  const [statusTab,  setStatusTab]  = useState<'PENDING'|'SUCCESS'|'REJECTED'|'ALL'>('PENDING')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchQ,    setSearchQ]    = useState('')

  const load = useCallback(async (p: number, status: string, type: string, q: string) => {
    setLoading(true); setError('')
    try {
      const res = await getSavingTransactions({
        page: p, page_size: 10,
        status:      status === 'ALL' ? undefined : status || undefined,
        saving_type: type || undefined,
        search:      q    || undefined,
      })
      setRows(res.results); setCount(res.count)
      setTotalPages(res.total_pages); setPage(res.current_page)
    } catch {
      setError('Gagal memuat data. Silakan coba lagi.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1, statusTab, typeFilter, searchQ) }, [statusTab, typeFilter, searchQ]) // eslint-disable-line

  const pageRange = (): (number | '…')[] => {
    const d = 2, out: (number | '…')[] = []
    for (let i = Math.max(1, page - d); i <= Math.min(totalPages, page + d); i++) out.push(i)
    if ((out[0] as number) > 1) { out.unshift('…'); out.unshift(1) }
    if ((out[out.length - 1] as number) < totalPages) { out.push('…'); out.push(totalPages) }
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

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Verifikasi Setoran Simpanan
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Tinjau dan verifikasi bukti transfer setoran simpanan anggota.
          </p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9' }}>

          {/* tabs */}
          <div className="flex" style={{ borderBottom: '1px solid #F1F5F9' }}>
            {STATUS_TABS.map(tab => {
              const active = statusTab === tab.key
              return (
                <button key={tab.key}
                  onClick={() => { setStatusTab(tab.key); setPage(1) }}
                  className="px-5 py-4 text-sm font-semibold transition-colors"
                  style={{
                    color: active ? '#11447D' : '#8E99A8',
                    borderBottom: active ? '2px solid #11447D' : '2px solid transparent',
                    marginBottom: -1, fontFamily: 'Inter, sans-serif',
                  }}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* toolbar */}
          <div className="px-6 py-3 flex flex-wrap items-center gap-3"
            style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="flex items-center gap-1.5">
              {TYPE_FILTERS.map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: typeFilter === f.key ? '#242F43' : '#F1F5F9',
                    color: typeFilter === f.key ? '#fff' : '#525E71',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <form onSubmit={e => { e.preventDefault(); setSearchQ(searchText) }}
              className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#B0BAC5" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input type="text" placeholder="Nama, email, ID transaksi…"
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', color: '#242F43', fontFamily: 'Inter, sans-serif', backgroundColor: '#FAFAFA' }}
                />
              </div>
              <Button type="submit" size="sm" variant="primary">Cari</Button>
              {searchQ && <Button type="button" size="sm" variant="outline"
                onClick={() => { setSearchText(''); setSearchQ('') }}>Reset</Button>}
            </form>
            <span className="ml-auto text-xs" style={{ color: '#B0BAC5', fontFamily: 'Inter, sans-serif' }}>
              {count} transaksi
            </span>
          </div>

          {/* body */}
          {error ? (
            <div className="py-16 text-center text-sm" style={{ color: '#EF4444' }}>
              {error}&nbsp;
              <button onClick={() => load(page, statusTab, typeFilter, searchQ)}
                className="underline font-semibold" style={{ color: '#11447D' }}>Coba lagi</button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: '#8E99A8' }}>
              Tidak ada transaksi{searchQ ? ` untuk "${searchQ}"` : ''}.
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
                  {rows.map((tx, i) => {
                    const st = TX_STATUS[tx.status]
                    const tp = TYPE_INFO[tx.saving_type]
                    const ms = MEMBER_STATUS[tx.member_status] ?? MEMBER_STATUS.PENDING
                    return (
                      <tr key={tx.id} className="hover:bg-[#FAFAFA] transition-colors"
                        style={{ borderBottom: i < rows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
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
                            className="text-sm font-bold transition-opacity hover:opacity-60"
                            style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                            {tx.status === 'PENDING' ? 'Tinjau →' : 'Lihat Detail'}
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
          {!loading && !error && rows.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid #F1F5F9' }}>
              <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Hal. {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => load(page - 1, statusTab, typeFilter, searchQ)} disabled={page === 1}
                  className="w-8 h-8 rounded-lg text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>‹</button>
                {pageRange().map((p, idx) =>
                  p === '…'
                    ? <span key={`e${idx}`} className="w-8 text-center text-sm" style={{ color: '#8E99A8' }}>…</span>
                    : <button key={p} onClick={() => load(p as number, statusTab, typeFilter, searchQ)}
                        className="w-8 h-8 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: p === page ? '#242F43' : 'transparent',
                          color: p === page ? '#fff' : '#525E71',
                          border: p === page ? 'none' : '1px solid #E5E7EB',
                        }}>{p}</button>
                )}
                <button onClick={() => load(page + 1, statusTab, typeFilter, searchQ)} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg text-sm disabled:opacity-30"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>›</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}