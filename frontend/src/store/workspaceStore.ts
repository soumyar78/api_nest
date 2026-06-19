import { create } from 'zustand'
import { api } from '../lib/api'

export interface Workspace {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceStats {
  total_collections: number
  average_latency_ms: number
  success_rate_percentage: number
  recent_requests_count: number
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  stats: WorkspaceStats | null
  isLoading: boolean
  error: string | null
  
  fetchWorkspaces: () => Promise<void>
  setActiveWorkspace: (workspace: Workspace) => void
  fetchStats: (workspaceId: string) => Promise<void>
  createWorkspace: (name: string) => Promise<Workspace | null>
  updateWorkspace: (workspaceId: string, name: string) => Promise<boolean>
  deleteWorkspace: (workspaceId: string) => Promise<boolean>
  clear: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get('/api/v1/workspaces')
      if (res.ok) {
        const data = await res.json()
        const workspacesList = data.workspaces || []
        set({ workspaces: workspacesList })
        
        // Default to the first workspace if none is active or active one is missing
        const currentActive = get().activeWorkspace
        if (workspacesList.length > 0) {
          const stillExists = currentActive && workspacesList.some((w: Workspace) => w.id === currentActive.id)
          if (!stillExists) {
            get().setActiveWorkspace(workspacesList[0])
          } else if (currentActive) {
            // Refresh active workspace metadata
            const updated = workspacesList.find((w: Workspace) => w.id === currentActive.id)
            if (updated) set({ activeWorkspace: updated })
          }
        } else {
          set({ activeWorkspace: null, stats: null })
        }
      } else {
        set({ error: 'Failed to fetch workspaces' })
      }
    } catch (err) {
      set({ error: 'A network error occurred while loading workspaces' })
    } finally {
      set({ isLoading: false })
    }
  },

  setActiveWorkspace: (workspace: Workspace) => {
    set({ activeWorkspace: workspace })
    get().fetchStats(workspace.id)
  },

  fetchStats: async (workspaceId: string) => {
    try {
      const res = await api.get(`/api/v1/workspaces/${workspaceId}/stats`)
      if (res.ok) {
        const data = await res.json()
        set({ stats: data.stats })
      }
    } catch (err) {
      console.error('Failed to fetch workspace statistics:', err)
    }
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/api/v1/workspaces', { name })
      if (res.ok) {
        const data = await res.json()
        const newWorkspace = data.workspace
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          activeWorkspace: newWorkspace
        }))
        get().fetchStats(newWorkspace.id)
        return newWorkspace
      } else {
        const data = await res.json()
        set({ error: data.errors?.join(', ') || data.error || 'Failed to create workspace' })
        return null
      }
    } catch (err) {
      set({ error: 'A network error occurred' })
      return null
    } finally {
      set({ isLoading: false })
    }
  },

  updateWorkspace: async (workspaceId: string, name: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.put(`/api/v1/workspaces/${workspaceId}`, { name })
      if (res.ok) {
        const data = await res.json()
        const updatedWorkspace = data.workspace
        set((state) => ({
          workspaces: state.workspaces.map((w) => w.id === workspaceId ? updatedWorkspace : w),
          activeWorkspace: state.activeWorkspace?.id === workspaceId ? updatedWorkspace : state.activeWorkspace
        }))
        return true
      } else {
        const data = await res.json()
        set({ error: data.errors?.join(', ') || data.error || 'Failed to update workspace' })
        return false
      }
    } catch (err) {
      set({ error: 'A network error occurred' })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  deleteWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.delete(`/api/v1/workspaces/${workspaceId}`)
      if (res.ok) {
        set((state) => {
          const filtered = state.workspaces.filter((w) => w.id !== workspaceId)
          const nextActive = filtered.length > 0 ? filtered[0] : null
          return {
            workspaces: filtered,
            activeWorkspace: nextActive
          }
        })
        const nextActive = get().activeWorkspace
        if (nextActive) {
          get().fetchStats(nextActive.id)
        } else {
          set({ stats: null })
        }
        return true
      } else {
        const data = await res.json()
        set({ error: data.error || 'Failed to delete workspace' })
        return false
      }
    } catch (err) {
      set({ error: 'A network error occurred' })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  clear: () => {
    set({ workspaces: [], activeWorkspace: null, stats: null, error: null })
  }
}))
