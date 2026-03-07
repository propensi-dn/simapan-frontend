import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT token ke setiap request
api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    const headers = config.headers as {
      setContentType?: (value?: string) => void
      delete?: (name: string) => void
      [key: string]: unknown
    }

    if (typeof headers.setContentType === 'function') {
      headers.setContentType(undefined)
    }
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type')
      headers.delete('content-type')
    }

    delete (headers as Record<string, unknown>)['Content-Type']
    delete (headers as Record<string, unknown>)['content-type']
  }

  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 → redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      Cookies.remove('user_role')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api