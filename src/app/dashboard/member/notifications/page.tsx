'use client'

import { useEffect, useState } from 'react'
import NotificationListPage from '@/components/notifications/NotificationListPage'
import api from '@/lib/axios'

type Profile = { full_name: string; member_id: string | null }

export default function MemberNotificationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(res => setProfile(res.data)).catch(() => {})
  }, [])

  return (
    <NotificationListPage
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={profile?.member_id ? `#${profile.member_id}` : undefined}
      detailBasePath="/dashboard/member/notifications"
    />
  )
}