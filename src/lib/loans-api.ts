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

export interface ManagerPendingLoanItem {
  id: number
  loan_id: string
  member_name: string
  category: LoanCategory
  category_display: string
  amount: string
  tenor: number
  application_date: string
  status: LoanStatus
}

export interface ManagerLoanHistoryItem extends ManagerPendingLoanItem {
  reviewed_at: string | null
  reviewed_by_email: string | null
  rejection_reason: string
}

export interface ManagerLoanSummary {
  total_pending: number
  total_requested_amount: string
  total_approved: number
  total_unverified_installments: number
  total_overdue: number
}

export interface ManagerLoanActivityItem {
  month: string
  total: number
}

export interface ManagerNearDueLoanItem {
  id: number
  member_name: string
  loan_id: string
  remaining_balance: string
  due_date: string
  status: LoanStatus
  status_display: string
  detail_url: string
}

export interface ManagerPendingLoansResponse {
  summary: ManagerLoanSummary
  pending_loans: {
    count: number
    total_pages: number
    current_page: number
    page_size: number
    next: string | null
    previous: string | null
    results: ManagerPendingLoanItem[]
  }
  history_loans: ManagerLoanHistoryItem[]
  all_loans: {
    count: number
    total_pages: number
    current_page: number
    page_size: number
    next: string | null
    previous: string | null
    results: ManagerAllLoanItem[]
  }
  loan_activity_barchart: ManagerLoanActivityItem[]
  near_due_loans: ManagerNearDueLoanItem[]
}

export interface ManagerAllLoanItem {
  id: number
  member_name: string
  loan_id: string
  remaining_balance: string
  due_date: string | null
  status: LoanStatus
  status_display: string
}

export interface ManagerLoanDetail {
  id: number
  loan_id: string
  member_name: string
  application_date: string
  status: LoanStatus
  status_display: string
  amount: string
  tenor: number
  category: LoanCategory
  category_display: string
  description: string
  credit_score: CreditScore
  total_savings: string
  active_loans_count: number
  bad_debt_history_count: number
  collateral_image_url: string | null
  salary_slip_url: string | null
}

export interface ManagerLoanDetailHistoryItem {
  id: number
  loan_id: string
  amount: string
  status: LoanStatus
  status_display: string
  application_date: string
}

export interface ManagerLoanDetailResponse {
  loan: ManagerLoanDetail
  member_previous_loans: ManagerLoanDetailHistoryItem[]
  scorecard: {
    eligibility_score: number
    indicators: Array<{
      label: string
      value: number | string
    }>
  }
  risk_assessment: Array<{
    label: string
    passed: boolean
  }>
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

/** GET /api/manager/loans/pending/ */
export async function getManagerPendingLoans(params?: {
  page?: number
  page_size?: number
  search?: string
  sort?: 'application_date' | '-application_date'
  history_limit?: number
  history_search?: string
  history_status?: 'APPROVED' | 'REJECTED'
  all_page?: number
  all_page_size?: number
  all_search?: string
  all_status?: LoanStatus
}): Promise<ManagerPendingLoansResponse> {
  const { data } = await api.get('/manager/loans/pending/', { params })
  return data
}

/** GET /api/manager/loans/{id}/ */
export async function getManagerLoanDetail(id: number): Promise<ManagerLoanDetailResponse> {
  const { data } = await api.get(`/manager/loans/${id}/`)
  return data
}

/** POST /api/manager/loans/{id}/status/ */
export async function reviewManagerLoan(
  id: number,
  payload: { action: 'approve' | 'reject'; reason?: string }
): Promise<{ message: string; loan_id: string; status: LoanStatus }> {
  const { data } = await api.post(`/manager/loans/${id}/status/`, payload)
  return data
}