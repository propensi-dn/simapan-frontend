'use client'

import { use } from 'react'
import NotificationDetailPage from '@/components/notifications/NotificationDetailPage'

export default function MemberNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <NotificationDetailPage
      id={Number(id)}
      role="MEMBER"
      listBasePath="/dashboard/member/notifications"
    />
  )
}
