'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function ChairmanNotificationsPage() {
  return (
    <NotificationListPage
      role="CHAIRMAN"
      detailBasePath="/dashboard/chairman/notifications"
    />
  )
}