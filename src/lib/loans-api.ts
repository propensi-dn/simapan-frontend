import api from './axios'

// ── Types ─────────────────────────────────────────────────────────────────

export type LoanStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'LUNAS'
  | 'OVERDUE'
  | 'LUNAS_AFTER_OVERDUE'

export type InstallmentStatus = 'UNPAID' | 'PENDING' | 'PAID'

export type LoanCategory =
  | 'MODAL_USAHA'
  | 'PENDIDIKAN'
  | 'KESEHATAN'
  | 'RENOVASI_RUMAH'
  | 'KENDARAAN'
  | 'ELEKTRONIK'
  | 'PERNIKAHAN'
  | 'DANA_DARURAT'
  | 'LAINNYA'

export interface CreditScore {
  score: number
  label: 'Poor' | 'Fair' | 'Good' | 'Excellent'
}

export interface LoanSummary {
  total_outstanding:  string
  next_due_date:      string | null
  next_due_amount:    string | null
  next_due_loan_id:   string | null
  credit_score:       CreditScore
}

export interface Loan {
  id:                   number
  loan_id:              string
  category:             LoanCategory
  category_display:     string
  amount:               string
  tenor:                number
  status:               LoanStatus
  status_display:       string
  outstanding_balance:  string
  next_due_date:        string | null
  next_installment_amount: string | null
  application_date:     string
}

export interface Installment {
  id:                   number
  installment_number:   number
  due_date:             string
  amount:               string
  principal_component:  string
  interest_component:   string
  status:               InstallmentStatus
  transaction_id:       string | null
  paid_at:              string | null
  payment_method:       string | null
  transfer_proof:       string | null
  rejection_reason:     string
  submitted_at:         string | null
}

export interface LoanDetail extends Loan {
  description:          string
  progress_percent:     number
  disbursed_at:         string | null
  bank_account: {
    id:             number
    bank_name:      string
    account_number: string
    account_holder: string
    is_primary:     boolean
  } | null
  installments: Installment[]
}

export interface LoanSimulation {
  principal:            number
  interest_rate:        number
  interest_per_month:   number
  principal_per_month:  number
  monthly_installment:  number
  total_interest:       number
  total_repayment:      number
  tenor:                number
}

export interface BankAccount {
  id:             number
  bank_name:      string
  account_number: string
  account_holder: string
  is_primary:     boolean
}

export interface LoanFormData {
  bank_accounts:  BankAccount[]
  categories:     { value: LoanCategory; label: string }[]
  tenor_choices:  number[]
  interest_rate:  number
  min_amount:     number
  max_amount:     number
}

export interface LoanCreatePayload {
  category:         LoanCategory
  amount:           number
  tenor:            number
  description?:     string
  bank_account?:    number
  collateral_image?: File
  salary_slip?:     File
}

export interface LoanOverviewResponse {
  summary: LoanSummary
  loans:   Loan[]
}

// ── API calls ─────────────────────────────────────────────────────────────

/** GET /api/loans/ */
export async function getLoanOverview(params?: {
  status?: string
  search?: string
}): Promise<LoanOverviewResponse> {
  const { data } = await api.get('/loans/', { params })
  return data
}

/** GET /api/loans/{id}/ */
export async function getLoanDetail(id: number): Promise<LoanDetail> {
  const { data } = await api.get(`/loans/${id}/`)
  return data
}

/** GET /api/loans/create/ */
export async function getLoanFormData(): Promise<LoanFormData> {
  const { data } = await api.get('/loans/create/')
  return data
}

/** POST /api/loans/create/ */
export async function createLoan(payload: LoanCreatePayload): Promise<Loan> {
  const fd = new FormData()
  fd.append('category', payload.category)
  fd.append('amount', String(payload.amount))
  fd.append('tenor', String(payload.tenor))
  if (payload.description) fd.append('description', payload.description)
  if (payload.bank_account) fd.append('bank_account', String(payload.bank_account))
  if (payload.collateral_image) fd.append('collateral_image', payload.collateral_image)
  if (payload.salary_slip) fd.append('salary_slip', payload.salary_slip)

  const { data } = await api.post('/loans/create/', fd)
  return data
}

/** GET /api/loans/simulation/?amount=&tenor= */
export async function getSimulation(amount: number, tenor: number): Promise<LoanSimulation> {
  const { data } = await api.get('/loans/simulation/', { params: { amount, tenor } })
  return data
}