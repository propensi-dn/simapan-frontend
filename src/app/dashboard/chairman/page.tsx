'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Label,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import StatCard from '@/components/ui/StatCard'
import api from '@/lib/axios'

// ── Types ──────────────────────────────────────────────────────────────────

interface LiquidityComponents {
  cash_in_bank: string
  loans_disbursed: string
}

interface MembershipTrend {
  month: string
  new_members: number
  resigned_members: number
}

interface ChairmanDashboardData {
  total_cash: string
  total_loans: string
  total_active_members: number
  liquidity_ratio: number
  liquidity_components: LiquidityComponents
  membership_trends: MembershipTrend[]
}

interface ChairmanProfile {
  full_name: string
  member_id: string | null
}

// ── Icons ──────────────────────────────────────────────────────────────────

const CashIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
  </svg>
)

const LoanIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3M3 6v3" />
  </svg>
)

const MemberIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Rp 0'
  if (num >= 1_000_000_000) {
    const m = num / 1_000_000_000
    return `Rp ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (num >= 1_000_000) {
    const jt = num / 1_000_000
    return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}Jt`
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)}Rb`
  }
  return `Rp ${num.toLocaleString('id-ID')}`
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse" style={{ border: '1px solid #F1F5F9' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#F1F5F9' }} />
      </div>
      <div className="h-3 rounded w-20 mb-2" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-6 rounded w-28 mb-1" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="h-3 rounded w-24" style={{ backgroundColor: '#F1F5F9' }} />
    </div>
  )
}

// ── Donut label ────────────────────────────────────────────────────────────

function DonutLabel({ viewBox, ratio }: {
  viewBox?: { cx?: number; cy?: number }
  ratio: number
}) {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0
  return (
    <g>
      <text
        x={cx} y={cy - 8}
        textAnchor="middle" dominantBaseline="middle"
        fill="#242F43" fontFamily="Montserrat, sans-serif" fontWeight={700} fontSize={26}
      >
        {ratio.toFixed(1)}%
      </text>
      <text
        x={cx} y={cy + 18}
        textAnchor="middle" dominantBaseline="middle"
        fill="#8E99A8" fontFamily="Inter, sans-serif" fontSize={11}
        style={{ letterSpacing: '0.08em' }}
      >
        LIKUIDITAS
      </text>
    </g>
  )
}

// ── Custom tooltip (line chart) ────────────────────────────────────────────

function TrendTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12,
      padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    }}>
      <p style={{ color: '#242F43', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ChairmanDashboardPage() {
  const [data, setData]       = useState<ChairmanDashboardData | null>(null)
  const [profile, setProfile] = useState<ChairmanProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      try {
        const [dashRes, profileRes] = await Promise.allSettled([
          api.get<ChairmanDashboardData>('/dashboards/chairman/'),
          api.get<ChairmanProfile>('/members/profile/'),
        ])
        if (cancelled) return

        if (dashRes.status === 'fulfilled') {
          setData(dashRes.value.data)
        } else {
          setError('Gagal memuat data dashboard.')
        }
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data)
        }
      } catch {
        if (!cancelled) setError('Terjadi kesalahan jaringan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  const userName  = profile?.full_name ?? 'Ketua'
  const userID    = profile?.member_id ?? undefined
  const firstName = userName.split(' ')[0]

  // ── Donut data ──────────────────────────────────────────────────────────
  const cashVal  = parseFloat(data?.liquidity_components.cash_in_bank  ?? '0')
  const loanVal  = parseFloat(data?.liquidity_components.loans_disbursed ?? '0')
  const pieData  = cashVal === 0 && loanVal === 0
    ? [{ name: 'Tidak ada data', value: 1 }]
    : [
        { name: 'Kas di Bank',         value: cashVal },
        { name: 'Pinjaman Dicairkan',  value: loanVal },
      ]
  const PIE_COLORS = ['#242F43', '#E5E7EB']

  return (
    <DashboardLayout role="CHAIRMAN" userName={userName} userID={userID}>

      <DashboardHeader
        variant="default"
        title="Dashboard"
        notifHref="/dashboard/chairman/notifications"
      />

      <main className="flex-1 p-8">

        {/* Welcome */}
        <div className="mb-2">
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
          >
            Dashboard Ketua
          </h2>
          <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
            Selamat datang, {firstName}. Berikut ringkasan kesehatan organisasi dan likuiditas keuangan.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'Inter, sans-serif' }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6 mt-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Kas"
                value={formatRupiah(data?.total_cash ?? '0')}
                subtitle="Total saldo simpanan anggota"
                icon={<CashIcon />}
                accent="#11447D"
              />
              <StatCard
                label="Total Pinjaman"
                value={formatRupiah(data?.total_loans ?? '0')}
                subtitle="Outstanding pinjaman aktif"
                icon={<LoanIcon />}
                accent="#F2A025"
              />
              <StatCard
                label="Anggota Aktif"
                value={(data?.total_active_members ?? 0).toLocaleString('id-ID')}
                subtitle="Anggota berstatus aktif"
                icon={<MemberIcon />}
                accent="#10B981"
              />
            </>
          )}
        </div>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4 mb-6">

          {/* Donut — Rasio Likuiditas */}
          <div
            className="col-span-2 bg-white rounded-2xl p-6"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-base"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
              >
                Rasio Likuiditas
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-56 animate-pulse">
                <div className="w-40 h-40 rounded-full" style={{ backgroundColor: '#F1F5F9' }} />
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={pieData.length > 1 ? 3 : 0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i] ?? '#E5E7EB'} />
                        ))}
                        <Label
                          content={<DonutLabel ratio={data?.liquidity_ratio ?? 0} />}
                          position="center"
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-2 space-y-2">
                  {[
                    { label: 'Kas di Bank',        value: data?.liquidity_components.cash_in_bank  ?? '0', color: '#242F43' },
                    { label: 'Pinjaman Dicairkan',  value: data?.liquidity_components.loans_disbursed ?? '0', color: '#E5E7EB' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color, border: item.color === '#E5E7EB' ? '1px solid #D1D5DB' : 'none' }} />
                        <span className="text-sm" style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#242F43', fontFamily: 'Montserrat, sans-serif' }}>
                        {formatRupiah(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Line chart — Tren Keanggotaan */}
          <div
            className="col-span-3 bg-white rounded-2xl p-6"
            style={{ border: '1px solid #F1F5F9' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-base"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
              >
                Tren Keanggotaan
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#11447D' }} />
                  <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>Anggota Baru</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#8E99A8' }} />
                  <span className="text-xs" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>Keluar</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse h-56 rounded-xl" style={{ backgroundColor: '#F1F5F9' }} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={data?.membership_trends ?? []}
                  margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="new_members"
                    name="Anggota Baru"
                    stroke="#11447D"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resigned_members"
                    name="Keluar"
                    stroke="#8E99A8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between text-xs pt-4"
          style={{ borderTop: '1px solid #F1F5F9', color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}
        >
          <span>Data diperbarui secara real-time dari sistem.</span>
          <div className="flex items-center gap-4">
            <button style={{ color: '#8E99A8' }}>Ekspor CSV</button>
            <button style={{ color: '#8E99A8' }}>Cetak Laporan</button>
          </div>
        </div>

      </main>
    </DashboardLayout>
  )
}
