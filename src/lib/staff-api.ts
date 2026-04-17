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

export interface LoanDetail {
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
  return data
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
