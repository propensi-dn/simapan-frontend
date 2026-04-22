import api from './axios'
import type { PaginatedResponse, PendingMember, MemberDetail, VerifyPayload } from '@/types'

/** GET /api/staff/members/pending/ */
export async function getPendingMembers(params: {
  page?: number
  page_size?: number
  search?: string
}): Promise<PaginatedResponse<PendingMember>> {
  const { data } = await api.get('/staff/members/pending/', { params })
  return data
}

/** GET /api/staff/members/{id}/verify/ */
export async function getMemberDetail(id: number): Promise<MemberDetail> {
  const { data } = await api.get(`/staff/members/${id}/verify/`)
  return data
}

/** POST /api/staff/members/{id}/verify/ */
export async function verifyMember(
  id: number,
  payload: VerifyPayload
): Promise<{ message: string; member: MemberDetail }> {
  const { data } = await api.post(`/staff/members/${id}/verify/`, payload)
  return data
}

// ── Loan Disbursement Types ────────────────────────────────────────────────

export interface ApprovedLoan {
  id: number
  loan_id: string
  member_name: string
  category: string
  category_display: string
  amount: string
  tenor: number
  status: string
  status_display: string
  approved_at: string
  application_date: string
}

export interface DisbursedLoan {
  id: number
  loan_id: string
  member_name: string
  category: string
  category_display: string
  amount: string
  tenor: number
  status: string
  status_display: string
  approved_at: string
  disbursed_at: string
  disbursed_by_name: string
}

export interface InstallmentSchedule {
  installment_number: number
  due_date: string
  amount: string
  principal_component: string
  interest_component: string
}

export interface BankAccount {
  id: number
  bank_name: string
  account_number: string
  account_holder: string
  is_primary: boolean
}

export interface LoanDetailResponse {
  id: number
  loan_id: string
  member_name: string
  amount: string
  tenor: number
  status: string
  status_display: string
  category_display: string
  monthly_installment: string
  total_repayment: string
  member_bank_account: BankAccount | null
  installment_schedule: InstallmentSchedule[]
}

export interface LoanDetail {
  loan_number: string
  member_name: string
  principal_amount: number
  tenor: number
  interest_rate: number
  bank_name: string
  account_number: string
  account_holder: string
  admin_fee: number
  installments: Array<{
    no: number
    due_date: string
    principal: number
    interest: number
    total: number
  }>
}

export interface LoanSummary {
  total_approved_loans: number
  total_approved_amount: string
}

export interface DisbursedSummary {
  total_disbursed_loans: number
  total_disbursed_amount: string
}

// ── API Functions ──────────────────────────────────────────────────────────

/** GET /api/staff/loans/approved/ */
export async function getApprovedLoans(params: {
  page?: number
  page_size?: number
  search?: string
  start_date?: string
  end_date?: string
}): Promise<PaginatedResponse<ApprovedLoan> & { summary: LoanSummary }> {
  const { data } = await api.get('/staff/loans/approved/', { params })
  return data
}

/** GET /api/staff/loans/disbursed/ */
export async function getDisbursedLoans(params: {
  page?: number
  page_size?: number
  search?: string
  start_date?: string
  end_date?: string
  status?: string
}): Promise<PaginatedResponse<DisbursedLoan> & { summary: DisbursedSummary }> {
  const { data } = await api.get('/staff/loans/disbursed/', { params })
  return data
}

/** GET /api/staff/loans/<id>/detail/ */
export async function getLoanDetail(id: number): Promise<LoanDetail> {
  const { data } = await api.get(`/staff/loans/${id}/detail/`)
  return transformLoanDetailResponse(data)
}

/** Transform API response to component format */
function transformLoanDetailResponse(apiData: LoanDetailResponse): LoanDetail {
  const installments = (apiData.installment_schedule || []).map((inst, idx) => ({
    no: inst.installment_number,
    due_date: inst.due_date,
    principal: parseFloat(inst.principal_component),
    interest: parseFloat(inst.interest_component),
    total: parseFloat(inst.amount),
  }))

  return {
    loan_number: apiData.loan_id,
    member_name: apiData.member_name,
    principal_amount: parseFloat(apiData.amount),
    tenor: apiData.tenor,
    interest_rate: 0.5, // 0.5% per month (fixed rate from backend)
    bank_name: apiData.member_bank_account?.bank_name || '',
    account_number: apiData.member_bank_account?.account_number || '',
    account_holder: apiData.member_bank_account?.account_holder || '',
    admin_fee: 0, // No admin fee in current backend
    installments,
  }
}

/** POST /api/staff/loans/<id>/disburse/ */
export async function disburseLoans(
  id: number,
  payload?: FormData
): Promise<{
  message: string
  loan_id: string
  status: string
  member_name: string
  amount: string
  disbursed_at: string
}> {
  const config = payload ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {}
  const { data } = await api.post(`/staff/loans/${id}/disburse/`, payload || {}, config)
  return data
}

// ── Loan Dashboard Types ───────────────────────────────────────────────────

export interface LoanActivity {
  month: string
  count: number
  amount: string
}

export interface UpcomingDueLoan {
  id: number
  loan_id: string
  member_name: string
  amount: string
  remaining_balance: string
  next_due_date: string
  status: string
  days_until_due: number
}

export interface DashboardSummary {
  total_approved_loans: number
  total_approved_amount: string
  total_unverified_installments: number
  total_unverified_amount: string
  total_overdue_loans: number
  total_overdue_amount: string
}

export interface LoanDashboard {
  summary: DashboardSummary
  loan_activities: LoanActivity[]
  upcoming_due_loans: PaginatedResponse<UpcomingDueLoan>
}

// ── Loan Dashboard API Functions ────────────────────────────────────────────

/** GET /api/staff/loans/dashboard/ */
export async function getStaffLoanDashboard(params?: {
  page?: number
  page_size?: number
}): Promise<LoanDashboard> {
  const { data } = await api.get('/staff/loans/dashboard/', { params })
  return data
}

// ── Staff Installment Payment Verification Types/API ─────────────────────

export type StaffInstallmentStatus = 'UNPAID' | 'PENDING' | 'PAID'

export interface StaffInstallmentPaymentItem {
  id: number
  loan_pk: number
  transaction_id: string | null
  submitted_at: string | null
  paid_at: string | null
  updated_at: string
  member_name: string
  loan_id: string
  amount: string
  status: StaffInstallmentStatus
  status_display: string
}

export interface StaffInstallmentPaymentDetail {
  id: number
  loan_pk: number
  transaction_id: string | null
  installment_number: number
  due_date: string
  submitted_at: string | null
  paid_at: string | null
  amount: string
  principal_component: string
  interest_component: string
  payment_method: string | null
  status: StaffInstallmentStatus
  status_display: string
  rejection_reason: string
  member_name: string
  member_email: string
  member_id: string | null
  loan_id: string
  transfer_proof_url: string | null
  verified_by_email: string | null
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
}

export interface StaffInstallmentVerifyResponse {
  message: string
  installment: StaffInstallmentPaymentDetail
  payment_breakdown?: {
    principal_component: string
    interest_component: string
  }
  loan_status?: string
  cash_in_recorded?: boolean
}

export async function getPendingInstallmentPayments(params: {
  scope?: 'pending' | 'history' | 'all'
  page?: number
  page_size?: number
  status?: string
  rejected_only?: boolean
  start_date?: string
  end_date?: string
  search?: string
}): Promise<PaginatedResponse<StaffInstallmentPaymentItem>> {
  const { data } = await api.get('/staff/installments/pending/', { params })
  return data
}

export async function getPendingInstallmentPaymentDetail(
  installmentId: number
): Promise<StaffInstallmentPaymentDetail> {
  const { data } = await api.get(`/staff/installments/pending/${installmentId}/`)
  return data
}

export async function verifyPendingInstallmentPayment(
  installmentId: number,
  payload: { action: 'approve' | 'reject'; rejection_reason?: string }
): Promise<StaffInstallmentVerifyResponse> {
  const { data } = await api.post(`/staff/installments/${installmentId}/status/`, payload)
  return data
}

// ── Staff Loan Monitoring Detail ───────────────────────────────

export interface StaffLoanInstallmentRow {
  id: number
  installment_number: number
  due_date: string
  amount: string
  status: StaffInstallmentStatus
  status_display: string
  payment_method: string | null
  submitted_at: string | null
  paid_at: string | null
  transaction_id: string | null
  transfer_proof_url: string | null
}

export interface StaffLoanMonitoringSummary {
  id: number
  loan_id: string
  member_name: string
  tenor: number
  status: string
  status_display: string
  amount: string
  outstanding_balance: string
  payment_progress_percent: number
  paid_installments: number
  total_installments: number
  next_due_date: string | null
}

export interface StaffLoanMonitoringDetailResponse {
  loan: StaffLoanMonitoringSummary
  installments: PaginatedResponse<StaffLoanInstallmentRow>
}

export async function getStaffLoanMonitoringDetail(
  loanId: number,
  params?: {
    page?: number
    page_size?: number
  }
): Promise<StaffLoanMonitoringDetailResponse> {
  const { data } = await api.get(`/staff/loans/${loanId}/`, { params })
  return data
}

export async function exportStaffLoanInstallmentsCsv(loanId: number): Promise<Blob> {
  const { data } = await api.get(`/staff/loans/${loanId}/export-csv/`, {
    responseType: 'blob',
  })
  return data
}
