import api from './axios'

// ── Types ─────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'REGISTRATION'
  | 'SAVING'
  | 'LOAN'
  | 'WITHDRAWAL'
  | 'RESIGNATION'
  | 'GENERAL'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  redirect_url: string
  created_at: string
}

export interface NotificationListItem {
  id: number
  type: NotificationType
  title: string
  is_read: boolean
  redirect_url: string
  created_at: string
}

export interface NotificationListResponse {
  count: number
  results: NotificationListItem[]
}

export interface UnreadCountResponse {
  unread_count: number
}

// ── API calls ─────────────────────────────────────────────────────────────

/** GET /api/notifications/ — list semua notifikasi user yang sedang login */
export async function getNotifications(params?: {
  is_read?: boolean
  type?: NotificationType
}): Promise<NotificationListResponse> {
  const { data } = await api.get('/notifications/', { params })
  return data
}

/** GET /api/notifications/{id}/ — detail + auto mark as read */
export async function getNotificationDetail(id: number): Promise<Notification> {
  const { data } = await api.get(`/notifications/${id}/`)
  return data
}

/** PATCH /api/notifications/{id}/ — explicitly mark as read */
export async function markNotificationRead(id: number): Promise<{ message: string }> {
  const { data } = await api.patch(`/notifications/${id}/`)
  return data
}

/** DELETE /api/notifications/ — mark ALL as read */
export async function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  const { data } = await api.delete('/notifications/')
  return data
}

/** GET /api/notifications/unread-count/ — badge count */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await api.get('/notifications/unread-count/')
  return data
}

/** DELETE /api/notifications/{id}/ — hapus notifikasi individual */
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}/`)
}