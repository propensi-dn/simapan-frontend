import { useState, useEffect } from 'react'

interface ShuCalculatorProps {
  grossProfit: number
  operationalExpenses: number
  estimatedShu: number
  onOperationalExpensesChange: (value: number) => void
  periodLabel: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatCurrencyInput = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
}

const formatSignedCurrencyInput = (value: number) => {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(value))

  return `${value < 0 ? '-' : ''}Rp ${formatted}`
}

export default function ShuCalculator({
  grossProfit,
  operationalExpenses,
  estimatedShu,
  onOperationalExpensesChange,
  periodLabel,
}: ShuCalculatorProps) {
  const [inputExpenses, setInputExpenses] = useState<string>(
    operationalExpenses.toString()
  )

  const cashFlowBasis = grossProfit
  const calculatedShu = Math.max(0, grossProfit - operationalExpenses)

  useEffect(() => {
    setInputExpenses(operationalExpenses.toString())
  }, [operationalExpenses])

  const handleExpensesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setInputExpenses(value)
    onOperationalExpensesChange(parseInt(value) || 0)
  }

  const handleExpensesBlur = () => {
    const value = parseInt(inputExpenses) || 0
    onOperationalExpensesChange(value)
  }

  const taxProvision = Math.max(0, calculatedShu * 0.05)
  const netDistribution = Math.max(0, calculatedShu - taxProvision)

  const handleReset = () => {
    setInputExpenses('0')
    onOperationalExpensesChange(0)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 bg-bg-card rounded-xl border border-gray-200 p-6">
        <h3 className="text-2xl font-bold font-heading text-text-primary mb-5">SHU Calculator</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Gross Profit / Cash Flow Basis (Signed)
            </label>
            <div className="h-12 rounded-md border border-gray-200 bg-bg px-3 flex items-center text-text-secondary font-semibold">
              {formatSignedCurrencyInput(cashFlowBasis)}
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Positive means surplus, negative means deficit for the selected period.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Operational Expenses
            </label>
            <div className="h-12 rounded-md border border-gray-200 bg-bg-card px-3 flex items-center gap-2">
              <span className="text-text-secondary font-semibold">Rp</span>
              <input
                type="text"
                value={inputExpenses}
                onChange={handleExpensesChange}
                onBlur={handleExpensesBlur}
                placeholder="Enter expenses amount"
                className="w-full bg-transparent outline-none text-text-primary font-semibold"
              />
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Include utilities, salaries, and maintenance not captured in daily cash flow.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleExpensesBlur}
            className="px-5 py-2.5 rounded-md bg-text-primary text-white text-sm font-semibold hover:bg-primary-900 transition"
          >
            Recalculate Estimates
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-md border border-gray-300 bg-bg-card text-sm font-semibold text-text-secondary hover:bg-bg transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="xl:col-span-2 rounded-xl bg-text-primary text-white p-6 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-2">Calculated Result</p>
        <h4 className="text-4xl font-bold font-heading leading-tight mb-1">Estimated SHU</h4>
          <p className="text-sm text-gray-400 mb-7">Sisa Hasil Usaha for {periodLabel}.</p>

        <div className="text-6xl font-extrabold mb-4 leading-none">
          {formatSignedCurrencyInput(calculatedShu)}
        </div>

        <div className="inline-flex items-center self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-gray-200 mb-6">
          Real-time Calculation
        </div>

        <div className="mt-auto pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Tax Provision (5%)</p>
            <p className="text-xl font-bold">{formatCurrency(taxProvision)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Net Distribution</p>
            <p className="text-xl font-bold">{formatCurrency(netDistribution)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
