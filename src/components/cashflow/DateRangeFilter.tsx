import { useEffect, useState } from 'react'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
  onModeChange?: (mode: 'month' | 'custom') => void
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  onModeChange,
}: DateRangeFilterProps) {
  const [isCustom, setIsCustom] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate)
  const [tempEndDate, setTempEndDate] = useState(endDate)

  useEffect(() => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
  }, [startDate, endDate])

  const applyMonthRange = () => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    onModeChange?.('month')
    onDateChange(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0])
  }

  const resetCustom = () => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
  }

  const currentMonthLabel = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  const formatRangeLabel = (value: string) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const activeLabel =
    startDate && endDate
      ? `${formatRangeLabel(startDate)} - ${formatRangeLabel(endDate)}`
      : currentMonthLabel

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) <= new Date(tempEndDate)) {
        onModeChange?.('custom')
        onDateChange(tempStartDate, tempEndDate)
        setIsCustom(false)
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={applyMonthRange}
        className="px-3 py-2 rounded-md border border-gray-300 bg-bg-card text-xs font-semibold text-text-secondary hover:bg-bg transition"
      >
        {activeLabel}
      </button>

      <button
        onClick={() => setIsCustom((prev) => !prev)}
        className={`px-3 py-2 rounded-md border text-xs font-semibold transition ${
          isCustom
            ? 'border-primary bg-primary-100 text-primary'
            : 'border-gray-300 bg-bg-card text-text-secondary hover:bg-bg'
        }`}
        >
        Custom Range{isCustom ? ' Active' : ''}
      </button>

      {isCustom && (
        <>
          <input
            type="date"
            value={tempStartDate}
            onChange={(e) => setTempStartDate(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-300 rounded-md bg-bg-card text-text-primary"
          />
          <input
            type="date"
            value={tempEndDate}
            onChange={(e) => setTempEndDate(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-300 rounded-md bg-bg-card text-text-primary"
          />
          <button
            onClick={handleApply}
            className="px-3 py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-[#0d3765] transition"
          >
            Apply
          </button>
          <button
            onClick={resetCustom}
            className="px-3 py-2 rounded-md border border-gray-300 bg-bg-card text-xs font-semibold text-text-secondary hover:bg-bg transition"
          >
            Reset
          </button>
        </>
      )}
    </div>
  )
}
