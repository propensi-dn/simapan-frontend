'use client'

import NotificationListPage from '@/components/notifications/NotificationListPage'

export default function MemberNotificationsPage() {
  return (
    <NotificationListPage
      role="MEMBER"
      detailBasePath="/dashboard/member/notifications"
    />
  )
}
