'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import NotificationDetailPage from '@/components/notifications/NotificationDetailPage'
import api from '@/lib/axios'

type Profile = { full_name: string; member_id: string | null }

export default function MemberNotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    api.get('/members/profile/').then(res => setProfile(res.data)).catch(() => {})
  }, [])

  return (
    <NotificationDetailPage
      id={Number(id)}
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={profile?.member_id ? `#${profile.member_id}` : undefined}
      listBasePath="/dashboard/member/notifications"
    />
  )
}