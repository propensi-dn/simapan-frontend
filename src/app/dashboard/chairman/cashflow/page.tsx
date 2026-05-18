'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import DateRangeFilter from '@/components/cashflow/DateRangeFilter'
import CashflowTable from '@/components/cashflow/CashflowTable'
import ShuCalculator from '@/components/cashflow/ShuCalculator'
import api from '@/lib/axios'

// ── Icons ──────────────────────────────────────────────────────────────────
const DebitIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
  </svg>
)

const CreditIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
  </svg>
)

const CashflowIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M4.5 5.25h15A1.5 1.5 0 0121 6.75v12A1.5 1.5 0 0119.5 20.25h-15A1.5 1.5 0 013 18.75v-12A1.5 1.5 0 014.5 5.25z" />
  </svg>
)

// ── Types ──────────────────────────────────────────────────────────────────
interface CashflowData {
  summary: {
    total_debit: number
    total_credit: number
    net_cash_flow: number
    interest_income_period: number
    estimated_shu_period: number
  }
  date_range: {
    start_date: string
    end_date: string
  }
  transactions: Transaction[]
  transaction_count: number
}

interface Transaction {
  id: string
  transaction_id: string
  date: string
  description: string
  category: string
  debit: number
  credit: number
  balance: number
  member_name: string
  loan_id: string
}

// ── Utility functions ──────────────────────────────────────────────────────
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatCompactCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  return `Rp ${formatted}`
}

const formatSignedCompactCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(value))

  return `${value < 0 ? '-' : ''}Rp ${formatted}`
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ChairmanCashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [grossProfit, setGrossProfit] = useState<number>(0)
  const [operationalExpenses, setOperationalExpenses] = useState<number>(0)
  const [estimatedShu, setEstimatedShu] = useState<number>(0)
  const [rangeMode, setRangeMode] = useState<'month' | 'custom'>('month')

  // Set default dates (current month)
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }, [])

  // Fetch cashflow data
  useEffect(() => {
    if (!startDate || !endDate) return

    const fetchCashflow = async () => {
      try {
        setLoading(true)
        const result = await api.get('/chairman/cashflow/', {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        })

        setData(result.data.data)
        
        // Untuk ketua, SHU calculator memakai pendapatan bunga periode ini sebagai basis.
        setGrossProfit(result.data.data.summary.interest_income_period)
        setError(null)
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { error?: string; message?: string } }
          message?: string
        }

        const backendMessage =
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to fetch cashflow data'

        const statusText = axiosErr.response?.status ? ` (${axiosErr.response.status})` : ''
        setError(`${backendMessage}${statusText}`)
      } finally {
        setLoading(false)
      }
    }

    fetchCashflow()
  }, [startDate, endDate])

  // Calculate estimated SHU
  useEffect(() => {
    const shu = Math.max(0, grossProfit - operationalExpenses)
    setEstimatedShu(shu)
  }, [grossProfit, operationalExpenses])

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const selectedPeriodLabel =
    rangeMode === 'custom'
      ? `${new Date(startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} (Custom Range)`
      : new Date(startDate || new Date()).toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric',
        })

  if (error) {
    return (
      <DashboardLayout role="CHAIRMAN" userName="Ketua" userID="">
        <DashboardHeader
          variant="default"
          title="Laporan Kas Periodik dan Estimasi SHU"
        />
        <main className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="CHAIRMAN" userName="Ketua" userID="">
      <DashboardHeader
        variant="default"
        title="Financial & SHU Report"
      />

      <main className="flex-1 p-6 md:p-8 bg-bg-sections">
        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary">Total Debit</p>
                <span className="text-text-tertiary"><DebitIcon /></span>
              </div>
              <p className="text-3xl font-extrabold text-text-primary leading-tight">{formatCompactCurrency(data.summary.total_debit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary">Total Credit</p>
                <span className="text-text-tertiary"><CreditIcon /></span>
              </div>
              <p className="text-3xl font-extrabold text-text-primary leading-tight">{formatCompactCurrency(data.summary.total_credit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary">Net Cash Flow</p>
                <span className="text-text-tertiary"><CashflowIcon /></span>
              </div>
              <p className="text-3xl font-extrabold text-text-primary leading-tight">{formatSignedCompactCurrency(data.summary.net_cash_flow)}</p>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-bg-card overflow-hidden mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 px-5 py-4 border-b border-gray-200 bg-bg">
            <div className="flex items-center gap-2 text-text-primary">
              <CalendarIcon />
              <h3 className="text-lg font-bold font-heading">Daily Cash Flow</h3>
            </div>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateRangeChange}
              onModeChange={setRangeMode}
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading transactions...</div>
          ) : (
            <CashflowTable
              transactions={data?.transactions || []}
              dateRange={{
                start: startDate,
                end: endDate,
              }}
            />
          )}
        </section>

        <ShuCalculator
          grossProfit={grossProfit}
          operationalExpenses={operationalExpenses}
          estimatedShu={estimatedShu}
          onOperationalExpensesChange={setOperationalExpenses}
          periodLabel={selectedPeriodLabel}
        />
      </main>
    </DashboardLayout>
  )
}
