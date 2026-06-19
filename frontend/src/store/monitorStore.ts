import { create } from 'zustand'
import { api } from '../lib/api'

export interface MonitorLog {
  id: string
  api_monitor_id: string
  response_status: number
  response_time_ms: number
  success: boolean
  error_message: string | null
  created_at: string
}

export interface ApiMonitor {
  id: string
  workspace_id: string
  name: string
  url: string
  method: string
  headers: { key: string; value: string; enabled: boolean }[]
  body_content: string | null
  interval_minutes: number
  last_checked_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  uptime_percentage?: number
  avg_latency_ms?: number
  total_checks?: number
  recent_logs?: MonitorLog[]
}

interface MonitorState {
  monitors: ApiMonitor[]
  activeMonitor: ApiMonitor | null
  isLoading: boolean
  error: string | null

  fetchMonitors: (workspaceId: string) => Promise<void>
  fetchMonitorDetails: (id: string) => Promise<void>
  createMonitor: (workspaceId: string, monitor: Partial<ApiMonitor>) => Promise<ApiMonitor | null>
  updateMonitor: (id: string, updates: Partial<ApiMonitor>) => Promise<boolean>
  deleteMonitor: (id: string) => Promise<boolean>
  toggleMonitor: (id: string) => Promise<boolean>
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  monitors: [],
  activeMonitor: null,
  isLoading: false,
  error: null,

  fetchMonitors: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get('/api/v1/api_monitors', { params: { workspace_id: workspaceId } })
      if (res.ok) {
        const data = await res.json()
        set({ monitors: data.api_monitors || [] })
      } else {
        set({ error: 'Failed to load API monitors' })
      }
    } catch (err) {
      set({ error: 'Network error loading API monitors' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMonitorDetails: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get(`/api/v1/api_monitors/${id}`)
      if (res.ok) {
        const data = await res.json()
        set({ activeMonitor: data.api_monitor })
      }
    } catch (err) {
      set({ error: 'Network error fetching monitor details' })
    } finally {
      set({ isLoading: false })
    }
  },

  createMonitor: async (workspaceId, monitor) => {
    try {
      const res = await api.post('/api/v1/api_monitors', { workspace_id: workspaceId, ...monitor })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ monitors: [...state.monitors, data.api_monitor] }))
        return data.api_monitor
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateMonitor: async (id, updates) => {
    try {
      const res = await api.put(`/api/v1/api_monitors/${id}`, updates)
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          monitors: state.monitors.map((m) => m.id === id ? { ...m, ...data.api_monitor } : m),
          activeMonitor: state.activeMonitor?.id === id ? { ...state.activeMonitor, ...data.api_monitor } : state.activeMonitor
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteMonitor: async (id) => {
    try {
      const res = await api.delete(`/api/v1/api_monitors/${id}`)
      if (res.ok) {
        set((state) => ({
          monitors: state.monitors.filter((m) => m.id !== id),
          activeMonitor: state.activeMonitor?.id === id ? null : state.activeMonitor
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  toggleMonitor: async (id) => {
    try {
      const res = await api.post(`/api/v1/api_monitors/${id}/toggle_active`)
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          monitors: state.monitors.map((m) => m.id === id ? { ...m, is_active: data.api_monitor.is_active } : m)
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }
}))
