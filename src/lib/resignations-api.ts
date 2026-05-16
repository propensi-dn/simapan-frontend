import api from './axios'

export type ResignationStatus = 'PENDING' | 'REJECTED' | 'APPROVED' | 'RESIGNED'

export interface ResignationSettlement {
  member_name: string
  member_id: string | null
  total_pokok: string
  total_wajib: string
  total_sukarela: string
  total_savings: string
  total_loan_outstanding: string
  estimated_payout: string
  can_resign: boolean
  has_pending_request: boolean
  has_active_resignation: boolean
  pending_request_id: number | null
  is_member?: boolean
}

export interface ResignationRequestDetail {
  id: number
  member_name: string
  member_id: string | null
  status: ResignationStatus
  status_display: string
  total_pokok_snapshot: string
  total_wajib_snapshot: string
  total_sukarela_snapshot: string
  total_savings_snapshot: string
  total_loan_outstanding_snapshot: string
  estimated_payout: string
  rejection_reason: string
  submitted_at: string
  reviewed_at: string | null
  resolved_at: string | null
}

export interface ManagerResignationListItem {
  id: number
  member_name: string
  member_id: string | null
  request_date: string
  status: ResignationStatus
  status_display: string
  estimated_payout: string
}

export interface ManagerResignationHistoryItem {
  id: number
  member_name: string
  member_id: string | null
  approval_date: string | null
  estimated_payout: string
}

export interface PaginatedPayload<T> {
  count: number
  total_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ManagerResignationListResponse {
  summary: {
    total_pending: number
    total_approved: number
    total_inactive: number
  }
  pending_requests: PaginatedPayload<ManagerResignationListItem>
  history_requests: PaginatedPayload<ManagerResignationHistoryItem>
}

export interface ManagerResignationDetailResponse {
  id: number
  member_name: string
  member_id: string | null
  request_date: string
  status: ResignationStatus
  status_display: string
  rejection_reason: string
  reviewed_at: string | null
  snapshot: {
    total_pokok: string
    total_wajib: string
    total_sukarela: string
    total_savings: string
    total_loan_outstanding: string
    estimated_payout: string
  }
  loan_history: {
    id: number
    loan_id: string
    amount: string
    status: string
    status_display: string
    application_date: string
    outstanding_balance: string
  }[]
}

// ── API calls ─────────────────────────────────────────────────────────────

/** GET /api/resignations/settlement/ */
export async function getResignationSettlement(): Promise<ResignationSettlement> {
  const { data } = await api.get('/resignations/settlement/')
  return data
}

/** POST /api/resignations/ */
export async function createResignationRequest(): Promise<ResignationRequestDetail> {
  const { data } = await api.post('/resignations/', {})
  return data
}

/** GET /api/resignations/me/ */
export async function getMyResignation(): Promise<{ request: ResignationRequestDetail | null }> {
  const { data } = await api.get('/resignations/me/')
  return data
}

/** GET /api/manager/resignations/ */
export async function getManagerResignations(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: ResignationStatus
  history_page?: number
  history_page_size?: number
  history_search?: string
}): Promise<ManagerResignationListResponse> {
  const { data } = await api.get('/manager/resignations/', { params })
  return data
}

/** GET /api/manager/resignations/{id}/ */
export async function getManagerResignationDetail(id: number): Promise<ManagerResignationDetailResponse> {
  const { data } = await api.get(`/manager/resignations/${id}/`)
  return data
}

/** POST /api/manager/resignations/{id}/status/ */
export async function reviewManagerResignation(
  id: number,
  payload: { action: 'approve' | 'reject'; reason?: string },
): Promise<{ message: string; status: ResignationStatus; estimated_payout: string }> {
  const { data } = await api.post(`/manager/resignations/${id}/status/`, payload)
  return data
}

/** GET /api/manager/resignations/export/ - returns blob */
export function getManagerResignationExportUrl(params?: { status?: ResignationStatus }) {
  const search = new URLSearchParams()
  if (params?.status) search.append('status', params.status)
  const query = search.toString()
  return `/manager/resignations/export/${query ? `?${query}` : ''}`
}
