import { create } from 'zustand'
import { api } from '../lib/api'

export interface ApiRequest {
  id: string
  name: string
  method: string
  url: string
  headers: { key: string; value: string; enabled: boolean }[]
  params: { key: string; value: string; enabled: boolean }[]
  body_type: string
  body_content: string
  auth_type: string
  auth_config: Record<string, any>
  collection_id: string
  folder_id: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  collection_id: string
  parent_id: string | null
  children: Folder[]
  requests: ApiRequest[]
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  name: string
  description: string | null
  workspace_id: string
  folders: Folder[]
  requests: ApiRequest[]
  created_at: string
  updated_at: string
}

interface CollectionState {
  collections: Collection[]
  activeRequest: ApiRequest | null
  isLoading: boolean
  error: string | null

  fetchCollections: (workspaceId: string) => Promise<void>
  setActiveRequest: (request: ApiRequest | null) => void
  createCollection: (workspaceId: string, name: string, description?: string) => Promise<Collection | null>
  updateCollection: (id: string, name: string, description?: string) => Promise<boolean>
  deleteCollection: (id: string) => Promise<boolean>
  duplicateCollection: (id: string) => Promise<boolean>
  importCollection: (workspaceId: string, fileData: string) => Promise<boolean>
  
  createFolder: (collectionId: string, name: string, parentId?: string | null) => Promise<Folder | null>
  updateFolder: (id: string, name: string) => Promise<boolean>
  deleteFolder: (id: string) => Promise<boolean>

  createRequest: (collectionId: string, folderId: string | null, name: string, method: string, url: string) => Promise<ApiRequest | null>
  updateRequest: (id: string, updates: Partial<ApiRequest>) => Promise<boolean>
  deleteRequest: (id: string) => Promise<boolean>
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  activeRequest: null,
  isLoading: false,
  error: null,

  fetchCollections: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get(`/api/v1/collections`, { params: { workspace_id: workspaceId } })
      if (res.ok) {
        const data = await res.json()
        set({ collections: data.collections || [] })
      } else {
        set({ error: 'Failed to fetch collections' })
      }
    } catch (err) {
      set({ error: 'Network error fetching collections' })
    } finally {
      set({ isLoading: false })
    }
  },

  setActiveRequest: (request) => {
    set({ activeRequest: request })
  },

  createCollection: async (workspaceId, name, description) => {
    try {
      const res = await api.post(`/api/v1/collections`, { workspace_id: workspaceId, name, description })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ collections: [...state.collections, data.collection] }))
        return data.collection
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateCollection: async (id, name, description) => {
    try {
      const res = await api.put(`/api/v1/collections/${id}`, { name, description })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          collections: state.collections.map((c) => c.id === id ? { ...c, ...data.collection } : c)
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteCollection: async (id) => {
    try {
      const res = await api.delete(`/api/v1/collections/${id}`)
      if (res.ok) {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          activeRequest: state.activeRequest?.collection_id === id ? null : state.activeRequest
        }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  duplicateCollection: async (id) => {
    try {
      const res = await api.post(`/api/v1/collections/${id}/duplicate`)
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ collections: [...state.collections, data.collection] }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  importCollection: async (workspaceId, fileData) => {
    try {
      const res = await api.post(`/api/v1/collections/import`, { workspace_id: workspaceId, file_data: fileData })
      if (res.ok) {
        const data = await res.json()
        set((state) => ({ collections: [...state.collections, data.collection] }))
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  createFolder: async (collectionId, name, parentId = null) => {
    try {
      const res = await api.post(`/api/v1/folders`, { collection_id: collectionId, name, parent_id: parentId })
      if (res.ok) {
        const data = await res.json()
        // Refresh collections
        const activeReq = get().activeRequest
        if (activeReq) {
          const workspaceId = activeReq.workspace_id
          await get().fetchCollections(workspaceId)
        } else {
          // fallback search workspace
          const firstCol = get().collections.find(c => c.id === collectionId)
          if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        }
        return data.folder
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateFolder: async (id, name) => {
    try {
      const res = await api.put(`/api/v1/folders/${id}`, { name })
      if (res.ok) {
        // Refresh collections
        const firstCol = get().collections[0]
        if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteFolder: async (id) => {
    try {
      const res = await api.delete(`/api/v1/folders/${id}`)
      if (res.ok) {
        // Refresh collections
        const firstCol = get().collections[0]
        if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        if (get().activeRequest?.folder_id === id) {
          set({ activeRequest: null })
        }
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  createRequest: async (collectionId, folderId, name, method, url) => {
    try {
      const res = await api.post(`/api/v1/requests`, {
        collection_id: collectionId,
        folder_id: folderId,
        name,
        method,
        url,
        headers: [],
        params: [],
        body_type: 'none',
        body_content: '',
        auth_type: 'none',
        auth_config: {}
      })
      if (res.ok) {
        const data = await res.json()
        const newReq = data.request
        // Refresh collections
        const firstCol = get().collections.find(c => c.id === collectionId)
        if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        set({ activeRequest: newReq })
        return newReq
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  updateRequest: async (id, updates) => {
    try {
      const res = await api.put(`/api/v1/requests/${id}`, updates)
      if (res.ok) {
        const data = await res.json()
        const updated = data.request
        
        // Update local state
        if (get().activeRequest?.id === id) {
          set({ activeRequest: updated })
        }
        
        // Refresh collections list
        const firstCol = get().collections[0]
        if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  },

  deleteRequest: async (id) => {
    try {
      const res = await api.delete(`/api/v1/requests/${id}`)
      if (res.ok) {
        // Update local state
        if (get().activeRequest?.id === id) {
          set({ activeRequest: null })
        }
        // Refresh collections list
        const firstCol = get().collections[0]
        if (firstCol) await get().fetchCollections(firstCol.workspace_id)
        return true
      }
    } catch (err) {
      console.error(err)
    }
    return false
  }
}))
