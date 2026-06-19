import { create } from 'zustand'
import { api } from '../lib/api'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  isLoading: boolean

  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<boolean>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/api/v1/notifications')
      if (res.ok) {
        const data = await res.json()
        set({ notifications: data.notifications || [] })
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await api.post(`/api/v1/notifications/${id}/read`)
      if (res.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }
}))
