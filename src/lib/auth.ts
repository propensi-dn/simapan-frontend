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
  }
}

export function getRole(): string | undefined {
  return Cookies.get('user_role')
}

export function getEmail(): string | undefined {
  return Cookies.get('user_email')
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token')
}