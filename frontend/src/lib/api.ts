import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token))
  refreshSubscribers = []
}

export async function apiClient(path: string, options: RequestOptions = {}): Promise<Response> {
  const { accessToken, logout, login } = useAuthStore.getState()
  const url = new URL(`${API_URL}${path}`)

  if (options.params) {
    Object.keys(options.params).forEach((key) =>
      url.searchParams.append(key, options.params![key])
    )
  }

  const headers = new Headers(options.headers || {})
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Include credentials (cookies) for CORS requests
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  }

  try {
    const response = await fetch(url.toString(), config)

    if (response.status === 401 && !path.includes('/api/v1/auth/')) {
      // Handle automatic token refresh
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })

          if (refreshRes.ok) {
            const data = await refreshRes.json()
            login(data.access_token, data.user)
            isRefreshing = false
            onRefreshed(data.access_token)
          } else {
            isRefreshing = false
            logout()
            throw new Error('Session expired')
          }
        } catch (err) {
          isRefreshing = false
          logout()
          return Promise.reject(err)
        }
      }

      // Wait for token refresh to complete and retry original request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`)
          resolve(fetch(url.toString(), config))
        })
      })
    }

    return response;
  } catch (error) {
    return Promise.reject(error)
  }
}

// REST helper methods
export const api = {
  get: (path: string, options?: RequestOptions) =>
    apiClient(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestOptions) =>
    apiClient(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (path: string, body?: any, options?: RequestOptions) =>
    apiClient(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (path: string, body?: any, options?: RequestOptions) =>
    apiClient(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (path: string, options?: RequestOptions) =>
    apiClient(path, { ...options, method: 'DELETE' }),
}
