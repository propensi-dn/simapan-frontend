'use client'

import { use } from 'react'
import NotificationDetailPage from '@/components/notifications/NotificationDetailPage'

export default function ManagerNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <NotificationDetailPage
      id={Number(id)}
      role="MANAGER"
      userName="Manajer"
      listBasePath="/dashboard/manager/notifications"
    />
  )
}