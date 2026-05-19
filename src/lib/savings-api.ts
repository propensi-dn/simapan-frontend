import api from './axios'

// ── Types ─────────────────────────────────────────────────────────────────

export type SavingType   = 'POKOK' | 'WAJIB' | 'SUKARELA'
export type SavingStatus = 'PENDING' | 'SUCCESS' | 'REJECTED'
export type WithdrawalStatus = 'PENDING' | 'COMPLETED'

export interface SavingTransaction {
  id:                    number
  saving_id:             string
  transaction_id:        string
  saving_type:           SavingType
  amount:                string
  status:                SavingStatus
  member_name:           string
  member_email:          string
  member_id:             string | null
  member_status:         string
  submitted_at:          string
  // detail only
  transfer_proof_url?:   string | null
  member_bank_name?:     string
  member_account_number?: string
  rejection_reason?:     string
  verified_at?:          string | null
  verified_by_email?:    string | null
}

export interface SavingsBalance {
  member_name:    string
  member_id:      string | null
  total_pokok:    string
  total_wajib:    string
  total_sukarela: string
  total:          string
  last_updated:   string | null
}

export interface VerifySavingPayload {
  action:           'approve' | 'reject'
  rejection_reason?: string
}

export interface VerifySavingResponse {
  message:          string
  member_activated: boolean
  member_id:        string | null
  transaction:      SavingTransaction
  balance:          SavingsBalance
}

export interface PaginatedSavings {
  count:        number
  total_pages:  number
  current_page: number
  page_size:    number
  next:         string | null
  previous:     string | null
  results:      SavingTransaction[]
}

export interface SavingsWithdrawal {
  id:             number
  withdrawal_id:  string
  amount:         string
  bank_name:      string
  account_number: string
  account_holder: string
  notes:          string
  status:         WithdrawalStatus
  created_at:     string
}

export interface WithdrawalCreatePayload {
  amount:         number
  bank_name:      string
  account_number: string
  account_holder: string
  notes?:         string
}

export interface WithdrawalCreateResponse {
  message: string
  data:    SavingsWithdrawal
}

export interface WithdrawalBalanceResponse {
  total_sukarela: string
}

// ── API calls ─────────────────────────────────────────────────────────────

/** GET /api/verifications/savings/ */
export async function getSavingTransactions(params: {
  page?:        number
  page_size?:   number
  status?:      string   // PENDING | SUCCESS | REJECTED | ALL
  saving_type?: string
  search?:      string
}): Promise<PaginatedSavings> {
  const { data } = await api.get('/verifications/savings/', { params })
  return data
}

/** GET /api/verifications/savings/{id}/ */
export async function getSavingDetail(id: number): Promise<SavingTransaction> {
  const { data } = await api.get(`/verifications/savings/${id}/`)
  return data
}

/** POST /api/verifications/savings/{id}/ */
export async function verifySaving(
  id: number,
  payload: VerifySavingPayload,
): Promise<VerifySavingResponse> {
  const { data } = await api.post(`/verifications/savings/${id}/`, payload)
  return data
}

/** GET /api/verifications/savings/balance/{member_pk}/ */
export async function getMemberSavingsBalance(memberPk: number): Promise<SavingsBalance> {
  const { data } = await api.get(`/verifications/savings/balance/${memberPk}/`)
  return data
}

/** GET /api/savings/withdrawals/balance/ */
export async function getWithdrawalBalance(): Promise<WithdrawalBalanceResponse> {
  const { data } = await api.get('/savings/withdrawals/balance/')
  return data
}

/** POST /api/savings/withdrawals/create/ */
export async function createWithdrawal(
  payload: WithdrawalCreatePayload,
): Promise<WithdrawalCreateResponse> {
  const { data } = await api.post('/savings/withdrawals/create/', payload)
  return data
}