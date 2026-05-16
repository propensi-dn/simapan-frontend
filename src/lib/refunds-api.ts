import api from './axios'

export type RefundSourceType = 'RESIGNATION' | 'INSTALLMENT' | 'WITHDRAWAL'
export type RefundStatus = 'PENDING' | 'COMPLETED'

export interface RefundItem {
  id: number
  source_type: RefundSourceType
  source_type_display: string
  loan_id: string | null
  member_name: string
  member_id: string
  amount: string
  status: RefundStatus
  status_display: string
  approved_at: string
  disbursed_at: string | null
}

export interface RefundDetail extends RefundItem {
  disbursed_by_email: string | null
  notes: string
  transfer_proof_url: string | null
  bank_info: {
    bank_name: string
    account_number: string
    account_holder: string
  } | null
}

export interface StaffRefundListResponse {
  summary: {
    total_pending: number
    total_completed: number
  }
  count: number
  total_pages: number
  current_page: number
  next: string | null
  previous: string | null
  results: RefundItem[]
}

export async function getStaffRefunds(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: RefundStatus
  start_date?: string
  end_date?: string
}): Promise<StaffRefundListResponse> {
  const { data } = await api.get('/staff/refunds/', { params })
  return data
}

export async function getStaffRefundDetail(id: number): Promise<RefundDetail> {
  const { data } = await api.get(`/staff/refunds/${id}/`)
  return data
}

export async function completeRefund(
  id: number,
  transferProof: File,
  notes?: string,
): Promise<{ message: string; id: number; status: RefundStatus; disbursed_at: string }> {
  const form = new FormData()
  form.append('transfer_proof', transferProof)
  if (notes) form.append('notes', notes)
  const { data } = await api.post(`/staff/refunds/${id}/status/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
