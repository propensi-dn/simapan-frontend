'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/axios'

export interface UserProfileState {
  userName: string
  userID: string | undefined
  avatarUrl: string | undefined
  userStatus: string | undefined
  isLoading: boolean
}

// Deduplicates concurrent fetches within the same JS session
let activePromise: Promise<void> | null = null

export function useUserProfile(): UserProfileState {
  // Always start with loading=true so server and client render identically (no hydration mismatch)
  const [state, setState] = useState<UserProfileState>({
    userName: '',
    userID: undefined,
    avatarUrl: undefined,
    userStatus: undefined,
    isLoading: true,
  })

  useEffect(() => {
    const cached = Cookies.get('user_name')

    if (cached) {
      // Cookie already set — resolve immediately, no API call
      setState({
        userName: cached,
        userID: Cookies.get('user_id'),
        avatarUrl: Cookies.get('user_avatar'),
        userStatus: Cookies.get('user_status'),
        isLoading: false,
      })
      return
    }

    let cancelled = false

    if (!activePromise) {
      activePromise = api
        .get('/members/profile/')
        .then((res) => {
          const { full_name, member_id, profile_picture, status } = res.data
          const name = full_name || 'User'
          const id = member_id ? String(member_id) : undefined
          const avatar = profile_picture || undefined
          const userStatus = status || undefined

          Cookies.set('user_name', name, { expires: 1 })
          if (id) Cookies.set('user_id', id, { expires: 1 })
          if (avatar) Cookies.set('user_avatar', avatar, { expires: 1 })
          if (userStatus) Cookies.set('user_status', userStatus, { expires: 1 })
        })
        .catch(() => {})
        .finally(() => {
          activePromise = null
        })
    }

    activePromise
      .then(() => {
        if (!cancelled) {
          setState({
            userName: Cookies.get('user_name') || '',
            userID: Cookies.get('user_id'),
            avatarUrl: Cookies.get('user_avatar'),
            userStatus: Cookies.get('user_status'),
            isLoading: false,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setState((prev) => ({ ...prev, isLoading: false }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
