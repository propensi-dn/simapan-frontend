'use client'

import { use } from 'react'
import NotificationDetailPage from '@/components/notifications/NotificationDetailPage'

export default function StaffNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <NotificationDetailPage
      id={Number(id)}
      role="STAFF"
      userName="Petugas"
      listBasePath="/dashboard/staff/notifications"
    />
  )
}