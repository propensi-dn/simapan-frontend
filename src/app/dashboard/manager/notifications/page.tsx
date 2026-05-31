'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function ManagerNotificationsPage() {
  return (
    <NotificationListPage
      role="MANAGER"
      detailBasePath="/dashboard/manager/notifications"
    />
  )
}