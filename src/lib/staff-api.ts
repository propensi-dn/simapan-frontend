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
