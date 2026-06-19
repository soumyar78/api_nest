import { create } from 'zustand'
import { api } from '../lib/api'

export interface EnvVariable {
  id: string
  environment_id: string
  key: string
  value: string
  secret: boolean
  created_at: string
  updated_at: string
}

export interface Environment {
  id: string
  name: string
  workspace_id: string
  is_active: boolean
  environment_variables: EnvVariable[]
  created_at: string
  updated_at: string
}

interface EnvironmentState {
  environments: Environment[]
  activeEnvironment: Environment | null
  selectedEnvId: string | null
  isLoading: boolean
  error: string | null

  setSelectedEnvId: (id: string | null) => void
  fetchEnvironments: (workspaceId: string) => Promise<void>
  createEnvironment: (workspaceId: string, name: string) => Promise<Environment | null>
  updateEnvironment: (id: string, name: string) => Promise<boolean>
  deleteEnvironment: (id: string) => Promise<boolean>
  activateEnvironment: (id: string) => Promise<boolean>
  
  createVariable: (environmentId: string, key: string, value: string, secret?: boolean) => Promise<EnvVariable | null>
  updateVariable: (environmentId: string, id: string, key: string, value: string, secret?: boolean) => Promise<boolean>
  deleteVariable: (environmentId: string, id: string) => Promise<boolean>
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  activeEnvironment: null,
  selectedEnvId: null,
  isLoading: false,
  error: null,

  setSelectedEnvId: (id) => set({ selectedEnvId: id }),

  fetchEnvironments: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get(`/api/v1/environments`, { params: { workspace_id: workspaceId } })
      if (res.ok) {
        const data = await res.json()
        const list = data.environments || []
        
        let nextSelectedId = get().selectedEnvId
        if (!nextSelectedId || !list.some((e: Environment) => e.id === nextSelectedId)) {
          const active = list.find((e: Environment) => e.is_active)
          nextSelectedId = active ? active.id : (list.length > 0 ? list[0].id : null)
        }

        set({ 
          environments: list,
          activeEnvironment: list.find((e: Environment) => e.is_active) || null,
          selectedEnvId: nextSelectedId
        })
      } else {
        set({ error: 'Failed to fetch environments' })
      }
    } catch (err) {
      set({ error: 'Network error fetching environments' })
    } finally {
      set({ isLoading: false })
    }
  },

  createEnvironment: async (workspaceId, name) => {
    try {
      const res = await api.post(`/api/v1/environments`, { workspace_id: workspaceId, name })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ 
          environments: [...state.environments, data.environment],
          selectedEnvId: data.environment.id
        }))
        return data.environment
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateEnvironment: async (id, name) => {
    try {
      const res = await api.put(`/api/v1/environments/${id}`, { name })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          environments: state.environments.map((e) => e.id === id ? { ...e, ...data.environment } : e),
          activeEnvironment: state.activeEnvironment?.id === id ? { ...state.activeEnvironment, ...data.environment } : state.activeEnvironment
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteEnvironment: async (id) => {
    try {
      const res = await api.delete(`/api/v1/environments/${id}`)
      if (res.ok) {
        set((state) => {
          const filtered = state.environments.filter((e) => e.id !== id)
          let nextSelectedId = state.selectedEnvId
          if (nextSelectedId === id) {
            const active = filtered.find(e => e.is_active)
            nextSelectedId = active ? active.id : (filtered.length > 0 ? filtered[0].id : null)
          }
          return {
            environments: filtered,
            activeEnvironment: state.activeEnvironment?.id === id ? null : state.activeEnvironment,
            selectedEnvId: nextSelectedId
          }
        })
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  activateEnvironment: async (id) => {
    try {
      const res = await api.post(`/api/v1/environments/${id}/activate`)
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          environments: state.environments.map((e) => 
            e.id === id ? { ...e, is_active: true } : { ...e, is_active: false }
          ),
          activeEnvironment: state.environments.find(e => e.id === id) || null
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  createVariable: async (environmentId, key, value, secret = false) => {
    try {
      const res = await api.post(`/api/v1/environments/${environmentId}/environment_variables`, { key, value, secret })
      if (res.ok) {
        const data = await res.json()
        
        const env = get().environments.find(e => e.id === environmentId)
        if (env) {
          get().fetchEnvironments(env.workspace_id)
        }
        
        return data.variable
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateVariable: async (environmentId, id, key, value, secret = false) => {
    try {
      const res = await api.put(`/api/v1/environments/${environmentId}/environment_variables/${id}`, { key, value, secret })
      if (res.ok) {
        const env = get().environments.find(e => e.id === environmentId)
        if (env) {
          get().fetchEnvironments(env.workspace_id)
        }
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteVariable: async (environmentId, id) => {
    try {
      const res = await api.delete(`/api/v1/environments/${environmentId}/environment_variables/${id}`)
      if (res.ok) {
        const env = get().environments.find(e => e.id === environmentId)
        if (env) {
          get().fetchEnvironments(env.workspace_id)
        }
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }
}))
