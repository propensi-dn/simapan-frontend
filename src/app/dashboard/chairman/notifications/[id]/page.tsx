'use client'

import { use } from 'react'
import NotificationDetailPage from '@/components/notifications/NotificationDetailPage'

export default function ChairmanNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <NotificationDetailPage
      id={Number(id)}
      role="CHAIRMAN"
      userName="Ketua"
      listBasePath="/dashboard/chairman/notifications"
    />
  )
}