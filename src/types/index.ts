// ────────────────────────────────────────────────────────────────────────────
// Member types
// ────────────────────────────────────────────────────────────────────────────

export type MemberStatus = 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'REJECTED' | 'INACTIVE'

/** Ringkas – untuk tabel daftar calon anggota */
export interface PendingMember {
  id: number
  full_name: string
  registration_date: string
  nik: string
  status: MemberStatus
  email: string
}

/** Lengkap – untuk halaman verifikasi */
export interface MemberDetail {
  id: number
  full_name: string
  place_of_birth: string
  date_of_birth: string
  gender: 'M' | 'F'
  occupation: string
  phone_number: string
  home_address: string
  city: string
  postal_code: string
  nik: string
  ktp_image: string | null
  selfie_image: string | null
  email: string
  status: MemberStatus
  rejection_reason: string | null
  registration_date: string
  verified_by_email: string | null
  verified_at: string | null
}

/** Respons paginasi dari backend */
export interface PaginatedResponse<T> {
  count: number
  total_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Payload POST ke /api/staff/members/{id}/verify/ */
export interface VerifyPayload {
  action: 'approve' | 'reject'
  rejection_reason?: string
}
