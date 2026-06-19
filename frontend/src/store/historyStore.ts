import { create } from 'zustand'
import { api } from '../lib/api'

export interface RequestHistoryItem {
  id: string
  user_id: string
  workspace_id: string
  request_id: string | null
  name: string
  method: string
  url: string
  headers: { key: string; value: string; enabled: boolean }[]
  body_content: string | null
  response_status: number
  response_time_ms: number
  response_size_bytes: number
  response_body: string | null
  response_headers: Record<string, string>
  created_at: string
}

interface HistoryState {
  historyItems: RequestHistoryItem[]
  isLoading: boolean
  error: string | null

  fetchHistory: (workspaceId: string, search?: string, method?: string) => Promise<void>
  deleteHistoryItem: (id: string) => Promise<boolean>
  clearHistory: (workspaceId: string) => Promise<boolean>
}

export const useHistoryStore = create<HistoryState>((set) => ({
  historyItems: [],
  isLoading: false,
  error: null,

  fetchHistory: async (workspaceId, search = '', method = '') => {
    set({ isLoading: true, error: null })
    try {
      const params: Record<string, string> = { workspace_id: workspaceId }
      if (search) params.search = search
      if (method) params.method = method

      const res = await api.get('/api/v1/request_histories', { params })
      if (res.ok) {
        const data = await res.json()
        set({ historyItems: data.histories || [] })
      } else {
        set({ error: 'Failed to fetch request history' })
      }
    } catch (err) {
      set({ error: 'Network error loading request history' })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteHistoryItem: async (id) => {
    try {
      const res = await api.delete(`/api/v1/request_histories/${id}`)
      if (res.ok) {
        set((state) => ({
          historyItems: state.historyItems.filter((item) => item.id !== id)
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  clearHistory: async (workspaceId) => {
    try {
      const res = await api.delete(`/api/v1/request_histories/clear_all`, { params: { workspace_id: workspaceId } })
      if (res.ok) {
        set({ historyItems: [] })
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }
}))
