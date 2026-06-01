'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function StaffNotificationsPage() {
  return (
    <NotificationListPage
      role="STAFF"
      detailBasePath="/dashboard/staff/notifications"
    />
  )
}