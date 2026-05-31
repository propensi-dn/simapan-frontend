import Cookies from 'js-cookie'
import api from './axios'

export async function logout() {
  const refreshToken = Cookies.get('refresh_token')
  try {
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken })
    }
  } catch {
    // Tetap lanjut logout meski API error
  } finally {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('user_role')
    Cookies.remove('user_email')
    Cookies.remove('user_name')
    Cookies.remove('user_id')
    Cookies.remove('user_avatar')
    Cookies.remove('user_status')
  }
}

export function getRole(): string | undefined {
  return Cookies.get('user_role')
}

export function getEmail(): string | undefined {
  return Cookies.get('user_email')
}

export function getUserName(): string | undefined {
  return Cookies.get('user_name')
}

export function getUserID(): string | undefined {
  return Cookies.get('user_id')
}

export function getUserAvatar(): string | undefined {
  return Cookies.get('user_avatar')
}

export function getUserStatus(): string | undefined {
  return Cookies.get('user_status')
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token')
}