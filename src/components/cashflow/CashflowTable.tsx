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

interface CashflowTableProps {
  transactions: Transaction[]
  dateRange: {
    start: string
    end: string
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'PEMBAYARAN_ANGSURAN':
      return 'bg-green-100 text-green-800'
    case 'PENCAIRAN_PINJAMAN':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'PEMBAYARAN_ANGSURAN':
      return 'Pembayaran Angsuran'
    case 'PENCAIRAN_PINJAMAN':
      return 'Pencairan Pinjaman'
    default:
      return category
  }
}

export default function CashflowTable({
  transactions,
  dateRange,
}: CashflowTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-8 text-center">
        <p className="text-text-primary font-semibold">Tidak ada transaksi</p>
        <p className="text-text-tertiary text-sm">
          Tidak ada transaksi kas ditemukan untuk periode yang dipilih
        </p>
      </div>
    )
  }

  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0)
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0)
  const runningBalance = totalDebit - totalCredit

  return (
    <div className="bg-bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg border-b border-gray-200">
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Debit (+)
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Credit (-)
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-bg transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                  {formatDateTime(transaction.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-text-primary font-medium">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {transaction.loan_id} | {transaction.member_name}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      transaction.category
                    )}`}
                  >
                    {getCategoryLabel(transaction.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {transaction.debit > 0 ? (
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(transaction.debit)}
                    </span>
                  ) : (
                    <span className="text-sm text-text-tertiary">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {transaction.credit > 0 ? (
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(transaction.credit)}
                    </span>
                  ) : (
                    <span className="text-sm text-text-tertiary">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(transaction.balance)}
                </td>
              </tr>
            ))}

            <tr className="bg-bg border-t border-gray-200">
              <td colSpan={3} className="px-6 py-3 text-right text-xs font-semibold text-text-secondary">
                Daily Totals
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-text-primary">
                {formatCurrency(totalDebit)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-text-primary">
                {formatCurrency(totalCredit)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-bold text-text-primary">
                {formatCurrency(runningBalance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
