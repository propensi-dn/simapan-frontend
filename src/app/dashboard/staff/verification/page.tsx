'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import { getPendingMembers } from '@/lib/staff-api'
import type { PendingMember } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  VERIFIED: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  ACTIVE:   { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  INACTIVE: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
}

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
  </svg>
)

// ── Page ──────────────────────────────────────────────────────────────────

export default function PendingMembersPage() {
  const router = useRouter()

  const [members, setMembers]       = useState<PendingMember[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [count, setCount]           = useState(0)
  const [search, setSearch]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const pageSize = 10

  const fetchMembers = useCallback(async (page: number, q: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await getPendingMembers({ page, page_size: pageSize, search: q || undefined })
      setMembers(res.results)
      setTotalPages(res.total_pages)
      setCurrentPage(res.current_page)
      setCount(res.count)
    } catch {
      setError('Gagal memuat data. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers(1, search)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handlePage = (p: number) => {
    if (p < 1 || p > totalPages) return
    fetchMembers(p, search)
  }

  const paginationRange = () => {
    const delta = 2
    const range: (number | '…')[] = []
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i)
    }
    if (range[0] !== 1) { range.unshift('…'); range.unshift(1) }
    if (range[range.length - 1] !== totalPages) { range.push('…'); range.push(totalPages) }
    return range
  }

  return (
    <DashboardLayout role="STAFF" userName="Petugas">

      <DashboardHeader
        variant="default"
        title="Daftar Calon Anggota"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8">

        {/* Page title row */}
        <div className="mb-6">
          <h2 className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}>
            Calon Anggota Pending
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Daftar calon anggota yang menunggu verifikasi.
          </p>
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1px solid #F1F5F9' }}>

          {/* Toolbar */}
          <div className="px-6 py-4 flex items-center justify-between gap-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#8E99A8' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, email, atau NIK…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: '1px solid #E5E7EB',
                    color: '#242F43',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: '#FAFAFA',
                  }}
                />
              </div>
              <Button type="submit" size="sm" variant="primary">Cari</Button>
              {search && (
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setSearchInput(''); setSearch('') }}>
                  Reset
                </Button>
              )}
            </form>

            <span className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {count} calon anggota
            </span>
          </div>

          {/* Table */}
          {error ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
              {error}
              <button onClick={() => fetchMembers(currentPage, search)}
                className="ml-2 underline font-semibold" style={{ color: '#11447D' }}>
                Coba lagi
              </button>
            </div>
          ) : loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#11447D', borderTopColor: 'transparent' }} />
            </div>
          ) : members.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              {search ? `Tidak ada hasil untuk "${search}".` : 'Tidak ada calon anggota dengan status PENDING.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['NAMA', 'EMAIL', 'TANGGAL DAFTAR', 'NIK', 'STATUS', 'ACTION'].map(col => (
                    <th key={col}
                      className="px-6 py-3 text-left text-xs font-semibold tracking-wider"
                      style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const s = STATUS_STYLE[m.status] ?? STATUS_STYLE.PENDING
                  return (
                    <tr key={m.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                      style={{ borderBottom: i < members.length - 1 ? '1px solid #F8FAFC' : 'none' }}>

                      <td className="px-6 py-4 text-sm font-semibold"
                        style={{ color: '#242F43', fontFamily: 'Inter, sans-serif' }}>
                        {m.full_name}
                      </td>

                      <td className="px-6 py-4 text-sm"
                        style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {m.email}
                      </td>

                      <td className="px-6 py-4 text-sm"
                        style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                        {formatDate(m.registration_date)}
                      </td>

                      <td className="px-6 py-4 text-sm font-mono"
                        style={{ color: '#525E71', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
                        {m.nik}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: s.bg, color: s.text, fontFamily: 'Inter, sans-serif' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                          {m.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/dashboard/staff/verification/${m.id}/verify`)}
                          className="text-sm font-bold transition-all hover:opacity-70 underline-offset-2 hover:underline"
                          style={{ color: '#11447D', fontFamily: 'Inter, sans-serif' }}>
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && !error && members.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between text-sm"
              style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              <span>
                Halaman {currentPage} dari {totalPages} &bull; {count} total data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  ‹
                </button>

                {paginationRange().map((p, idx) =>
                  p === '…' ? (
                    <span key={`ellipsis-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-sm"
                      style={{ color: '#8E99A8' }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePage(p as number)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: p === currentPage ? '#242F43' : 'transparent',
                        color: p === currentPage ? '#FFFFFF' : '#525E71',
                        border: p === currentPage ? 'none' : '1px solid #E5E7EB',
                      }}>
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#525E71' }}>
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </DashboardLayout>
  )
}
