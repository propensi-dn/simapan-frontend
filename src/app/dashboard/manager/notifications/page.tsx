'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function ManagerNotificationsPage() {
  return (
    <NotificationListPage
      role="MANAGER"
      userName="Manajer"
      detailBasePath="/dashboard/manager/notifications"
    />
  )
}