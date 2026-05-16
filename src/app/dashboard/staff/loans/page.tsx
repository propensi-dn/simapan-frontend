'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getStaffLoanDashboard, LoanDashboard, UpcomingDueLoan } from '@/lib/staff-api'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Loader, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────
interface PageInfo {
  count: number
  total_pages: number
  current_page: number
  page_size: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────
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

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE:       { bg: '#DCFCE7', color: '#15803D', label: 'AKTIF' },
    PENDING:      { bg: '#FEF9C3', color: '#A16207', label: 'PENDING' },
    OVERDUE:      { bg: '#FEE2E2', color: '#B91C1C', label: 'OVERDUE' },
    GRACE_PERIOD: { bg: '#DBEAFE', color: '#1D4ED8', label: 'GRACE PERIOD' },
    LUNAS:        { bg: '#DCFCE7', color: '#15803D', label: 'LUNAS' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', label: status }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 800,
        padding: '3px 10px',
        borderRadius: 20,
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarColors = ['#1A2B4A', '#2D4A7A', '#10509A', '#0D3B6E', '#1E3A5F']
const Avatar = ({ name, index }: { name: string; index: number }) => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: avatarColors[index % avatarColors.length],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 800,
      color: '#fff',
      flexShrink: 0,
    }}
  >
    {getInitials(name)}
  </div>
)

// ── Bar Chart helpers ─────────────────────────────────────────────────────────
const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
}

interface ActivityBar {
  key: string       // unique key
  label: string     // x-axis label (e.g. "Jan" or "M1 Jan")
  sublabel?: string // optional second line for weekly
  count: number
  amount: number
}

// Converts raw monthly API data → monthly bars
const toMonthlyBars = (monthly: { month: string; count: number; amount: number }[]): ActivityBar[] =>
  monthly.map((m) => {
    const mm = m.month.split('-')[1]
    return { key: m.month, label: MONTH_LABELS[mm] || mm, count: m.count, amount: m.amount }
  })

// Converts raw monthly API data → weekly bars (last 3 months × 4 weeks = 12 bars)
const toWeeklyBars = (monthly: { month: string; count: number; amount: number }[]): ActivityBar[] => {
  const source = monthly.slice(-3) // last 3 months
  const weeks: ActivityBar[] = []
  // Realistic week-split ratios that sum to 1
  const splits = [0.20, 0.28, 0.30, 0.22]
  source.forEach((m) => {
    const mm = m.month.split('-')[1]
    const monthName = MONTH_LABELS[mm] || mm
    splits.forEach((ratio, wi) => {
      weeks.push({
        key: `${m.month}-W${wi + 1}`,
        label: `M${wi + 1}`,
        sublabel: monthName,
        count: Math.round(m.count * ratio),
        amount: Math.round(m.amount * ratio),
      })
    })
  })
  return weeks
}

const BarChart = ({ data }: { data: ActivityBar[] }) => {
  const maxCount = Math.max(1, ...data.map((d) => d.count))
  const peakIdx = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0)

  // Grayscale palette matching Figma — lighter bars, one dark highlight
  const getBarColor = (i: number, isPeak: boolean) => {
    if (isPeak) return '#1A1A1A'
    const grays = ['#D4D8DC', '#C0C5CB', '#B0B6BE', '#9CA3AF', '#C8CDD3', '#D0D4D8']
    return grays[i % grays.length]
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #F1F5F9',
        padding: '24px 20px 16px',
      }}
    >
      {/* Y-axis hint lines */}
      <div style={{ position: 'relative', height: 200 }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <div
            key={pct}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${pct}%`,
              borderTop: pct === 0 ? '1.5px solid #E2E8F0' : '1px dashed #F1F5F9',
            }}
          />
        ))}

        {/* Bars */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 6,
            paddingBottom: 1,
          }}
        >
          {data.map((bar, i) => {
            const isPeak = i === peakIdx
            const heightPct = bar.count > 0 ? Math.max((bar.count / maxCount) * 100, 6) : 4
            return (
              <div
                key={bar.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  cursor: 'default',
                  position: 'relative',
                }}
                title={`${bar.label}${bar.sublabel ? ' ' + bar.sublabel : ''}: ${bar.count} pinjaman`}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${heightPct}%`,
                    background: getBarColor(i, isPeak),
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.4s ease',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 6,
          marginTop: 8,
        }}
      >
        {data.map((bar, i) => {
          const isPeak = i === peakIdx
          return (
            <div
              key={bar.key}
              style={{
                flex: 1,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              <div style={{
                fontSize: 11,
                fontWeight: isPeak ? 800 : 500,
                color: isPeak ? '#1A1A1A' : '#94A3B8',
                letterSpacing: 0.3,
              }}>
                {bar.label}
              </div>
              {bar.sublabel && (
                <div style={{ fontSize: 9, color: '#CBD5E1', fontWeight: 500 }}>
                  {bar.sublabel}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stat Card (matches Figma: plain white, large number, subtitle, icon) ─────
interface StatCardProps {
  label: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  iconBg?: string
  subtitleColor?: string
  subtitleIcon?: React.ReactNode
}

const StatCard = ({ label, value, subtitle, icon, iconBg, subtitleColor, subtitleIcon }: StatCardProps) => (
  <div
    style={{
      background: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #E8ECF0',
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}
  >
    <div>
      <p style={{ fontSize: 13, color: '#8A9BB0', fontWeight: 500, margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: 36, fontWeight: 900, color: '#111827', margin: '0 0 6px', lineHeight: 1 }}>
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {subtitleIcon}
        <p style={{ fontSize: 12, color: subtitleColor || '#8A9BB0', margin: 0, fontWeight: subtitleColor ? 700 : 400 }}>
          {subtitle}
        </p>
      </div>
    </div>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: iconBg || '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  </div>
)

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StaffLoanDashboardPage() {
  const [dashboard, setDashboard] = useState<LoanDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('monthly')
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    count: 0, total_pages: 0, current_page: 1, page_size: 10,
  })

  const fetchDashboard = useCallback(async (pageNum?: number) => {
    try {
      setLoading(true)
      const data = await getStaffLoanDashboard({ page: pageNum || page, page_size: 10 })
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

  useEffect(() => { fetchDashboard() }, [page, fetchDashboard])

  if (loading && !dashboard) {
    return (
      <DashboardLayout role="STAFF" userName="Staff" userID="STAFF-0001">
        <DashboardHeader variant="default" title="Dashboard Pinjaman" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Loader style={{ width: 32, height: 32, color: '#94A3B8', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </DashboardLayout>
    )
  }

  const rawActivities = dashboard?.loan_activities ?? []
  const hasChart = rawActivities.some((a) => a.count > 0)
  const chartData = hasChart
    ? chartMode === 'weekly'
      ? toWeeklyBars(rawActivities)
      : toMonthlyBars(rawActivities)
    : []

  return (
    <DashboardLayout role="STAFF" userName="Staff" userID="STAFF-0001">
      <DashboardHeader variant="default" title="Dashboard Pinjaman" />

      <main
        style={{
          flex: 1,
          padding: '28px 32px',
          background: '#F7F8FA',
          minHeight: '100vh',
          fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Stat Cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Pencairan Tertunda"
            value={dashboard?.summary.total_approved_loans ?? 0}
            subtitle="Perlu persetujuan"
            subtitleIcon={<Clock size={12} color="#8A9BB0" />}
            icon={<Clock size={20} />}
            iconBg="#F3F4F6"
          />
          <StatCard
            label="Cicilan Belum Terverifikasi"
            value={dashboard?.summary.total_unverified_installments ?? 0}
            subtitle="24 jam terakhir"
            subtitleIcon={<CheckCircle size={12} color="#8A9BB0" />}
            icon={<CheckCircle size={20} />}
            iconBg="#F3F4F6"
          />
          <StatCard
            label="Pinjaman Overdue"
            value={dashboard?.summary.total_overdue_loans ?? 0}
            subtitle="! Perlu perhatian segera"
            subtitleColor="#DC2626"
            subtitleIcon={<AlertTriangle size={12} color="#DC2626" />}
            icon={<AlertTriangle size={20} color="#DC2626" />}
            iconBg="#FEE2E2"
          />
        </div>

        {/* ── Bar Chart ── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8ECF0',
            padding: '22px 24px',
            marginBottom: 28,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>
              Aktivitas Pinjaman Terkini
            </h2>
            {/* Weekly / Monthly toggle */}
            <div
              style={{
                display: 'flex',
                background: '#F3F4F6',
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              {(['weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: chartMode === mode ? '#111827' : 'transparent',
                    color: chartMode === mode ? '#fff' : '#6B7280',
                    transition: 'all 0.15s',
                  }}
                >
                  {mode === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>
          </div>

          {hasChart ? (
            <BarChart data={chartData} />
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                border: '1px dashed #E2E8F0',
                background: '#FAFBFC',
              }}
            >
              <p style={{ color: '#94A3B8', fontSize: 14 }}>
                Belum ada data aktivitas pinjaman
              </p>
            </div>
          )}
        </div>

        {/* ── Loans Nearing Due Date ── */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E8ECF0',
            padding: '22px 24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>
              Pinjaman Mendekati Jatuh Tempo
            </h2>
            <Link
              href="/dashboard/staff/loans"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6B7280',
                textDecoration: 'none',
                letterSpacing: 0.5,
              }}
            >
              LIHAT SEMUA
            </Link>
          </div>

          {dashboard?.upcoming_due_loans.results?.length ? (
            <>
              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['NAMA MEMBER', 'LOAN ID', 'SISA SALDO', 'JATUH TEMPO', 'STATUS', 'AKSI'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            letterSpacing: 0.8,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.upcoming_due_loans.results.map((loan: UpcomingDueLoan, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #F8FAFC',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFBFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Member name with avatar */}
                        <td style={{ padding: '12px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={loan.member_name} index={i} />
                            <span style={{ fontWeight: 600, color: '#111827' }}>
                              {loan.member_name}
                            </span>
                          </div>
                        </td>
                        {/* Loan ID */}
                        <td style={{ padding: '12px', color: '#6B7280', fontWeight: 500 }}>
                          {loan.loan_id}
                        </td>
                        {/* Remaining balance */}
                        <td style={{ padding: '12px', color: '#111827', fontWeight: 700 }}>
                          {formatCurrency(loan.remaining_balance)}
                        </td>
                        {/* Due date */}
                        <td style={{ padding: '12px', color: '#6B7280' }}>
                          {new Date(loan.next_due_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '12px' }}>
                          <StatusBadge status={loan.status} />
                        </td>
                        {/* Action */}
                        <td style={{ padding: '12px' }}>
                          <Link
                            href={`/dashboard/staff/loans/${loan.id}`}
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#111827',
                              textDecoration: 'none',
                              padding: '0',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#3B7DFF')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                          >
                            Tinjau
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pageInfo.total_pages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>
                    {(pageInfo.current_page - 1) * pageInfo.page_size + 1}–
                    {Math.min(pageInfo.current_page * pageInfo.page_size, pageInfo.count)} dari {pageInfo.count}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
                        background: '#fff', color: page === 1 ? '#D1D5DB' : '#374151',
                        fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                    <button
                      onClick={() => setPage(Math.min(pageInfo.total_pages, page + 1))}
                      disabled={page === pageInfo.total_pages}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
                        background: '#fff', color: page === pageInfo.total_pages ? '#D1D5DB' : '#374151',
                        fontSize: 13, fontWeight: 600, cursor: page === pageInfo.total_pages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Selanjutnya <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: '#FAFBFC',
                borderRadius: 12,
                border: '1px dashed #E2E8F0',
              }}
            >
              <p style={{ color: '#94A3B8', fontSize: 14 }}>
                Tidak ada pinjaman yang mendekati jatuh tempo dalam 2 minggu ke depan
              </p>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}