'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'

type DepositItem = {
  id: number
  saving_id: string
  saving_type: 'MANDATORY' | 'VOLUNTARY'
  amount: string
  status: string
  member_name: string
  member_email: string
  created_at: string
}

function formatRupiah(val: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Number(val))
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const TYPE_STYLE = {
  MANDATORY: { bg: '#DBEAFE', text: '#1E40AF', label: 'Wajib' },
  VOLUNTARY: { bg: '#F3E8FF', text: '#6B21A8', label: 'Sukarela' },
}

export default function DepositQueuePage() {
  const router = useRouter()
  const [items, setItems]             = useState<DepositItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [count, setCount]             = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages]   = useState(1)

  const fetchData = useCallback(async (page: number, q: string, type: string) => {
    setLoading(true)
    try {
      const res = await api.get('/verifications/deposits/', {
        params: { page, search: q || undefined, saving_type: type || undefined }
      })
      setItems(res.data.results)
      setCount(res.data.count)
      setTotalPages(res.data.total_pages)
      setCurrentPage(res.data.current_page)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(1, search, typeFilter) }, [search, typeFilter, fetchData])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="font-bold text-2xl mb-1"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
          Antrian Simpanan Wajib & Sukarela
        </h2>
        <p className="text-sm" style={{ color: '#8E99A8' }}>
          Verifikasi bukti transfer simpanan wajib dan sukarela dari anggota aktif.
        </p>
      </div>

      <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>
        {/* Toolbar */}
        <div className="px-6 py-4 flex items-center gap-4 flex-wrap"
          style={{ borderBottom: '1px solid #F1F5F9' }}>
          <form
            onSubmit={e => { e.preventDefault(); setSearch(searchInput) }}
            className="flex gap-2 flex-1 min-w-0 max-w-sm">
            <input
              type="text"
              placeholder="Cari nama, email, saving ID…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#242F43' }}>
              Cari
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch('') }}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                Reset
              </button>
            )}
          </form>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E5E7EB', color: '#242F43', backgroundColor: '#fff' }}>
            <option value="">Semua Tipe</option>
            <option value="MANDATORY">Wajib</option>
            <option value="VOLUNTARY">Sukarela</option>
          </select>
          <span className="text-sm ml-auto" style={{ color: '#8E99A8' }}>{count} transaksi pending</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: '#8E99A8' }}>
            Tidak ada transaksi pending.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['SAVING ID', 'TIPE', 'NAMA ANGGOTA', 'EMAIL', 'JUMLAH', 'TANGGAL', 'ACTION'].map(col => (
                  <th key={col}
                    className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                    style={{ color: '#8E99A8' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const ts = TYPE_STYLE[item.saving_type]
                return (
                  <tr key={item.id}
                    style={{ borderBottom: i < items.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                    <td className="px-6 py-4 text-sm font-mono font-semibold" style={{ color: '#11447D' }}>
                      {item.saving_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: ts.bg, color: ts.text }}>
                        {ts.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#242F43' }}>
                      {item.member_name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#525E71' }}>
                      {item.member_email}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: '#242F43' }}>
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#8E99A8' }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/verifications/deposits/${item.id}`)}
                        className="text-sm font-bold hover:opacity-70 hover:underline underline-offset-2"
                        style={{ color: '#11447D' }}>
                        Review →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between text-sm"
            style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8' }}>
            <span>Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => fetchData(currentPage - 1, search, typeFilter)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                ‹
              </button>
              <button
                onClick={() => fetchData(currentPage + 1, search, typeFilter)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}