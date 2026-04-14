'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function StaffNotificationsPage() {
  return (
    <NotificationListPage
      role="STAFF"
      userName="Petugas"
      detailBasePath="/dashboard/staff/notifications"
    />
  )
}