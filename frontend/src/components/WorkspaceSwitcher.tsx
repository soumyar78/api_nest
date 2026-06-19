import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { Workspace } from '../store/workspaceStore'
import { Check, ChevronDown, Plus, Settings, Trash, Edit3, X } from 'lucide-react'

export default function WorkspaceSwitcher() {
  const { 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspace, 
    createWorkspace,
    updateWorkspace,
    deleteWorkspace 
  } = useWorkspaceStore()

  const [isOpen, setIsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editWorkspaceName, setEditWorkspaceName] = useState('')
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    setLoading(true)
    setError(null)
    
    const ws = await createWorkspace(newWorkspaceName)
    setLoading(false)
    if (ws) {
      setNewWorkspaceName('')
      setShowCreateModal(false)
      setIsOpen(false)
    } else {
      setError('Failed to create workspace. Please check validations.')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorkspace || !editWorkspaceName.trim()) return
    setLoading(true)
    setError(null)
    
    const success = await updateWorkspace(editingWorkspace.id, editWorkspaceName)
    setLoading(false)
    if (success) {
      setEditingWorkspace(null)
      setEditWorkspaceName('')
    } else {
      setError('Failed to update workspace name.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workspace? This action is permanent and will delete all associated requests.')) {
      setLoading(true)
      const success = await deleteWorkspace(id)
      setLoading(false)
      if (success) {
        setEditingWorkspace(null)
      } else {
        alert('Failed to delete workspace. Note that personal workspaces cannot be deleted.')
      }
    }
  }

  // Create Workspace Modal — rendered via portal to escape sidebar stacking context
  const createModal = showCreateModal
    ? createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 shadow-2xl space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-850">Create New Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workspace Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Mobile API Team"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-800 text-xs font-semibold rounded-xl cursor-pointer transition-all hover:bg-zinc-100/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 transition-all"
                >
                  {loading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null

  // Manage Workspaces Modal — rendered via portal to escape sidebar stacking context
  const manageModal = showManageModal
    ? createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 p-6 shadow-2xl space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-850">Manage Workspaces</h3>
              <button onClick={() => setShowManageModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* List of Workspaces for management */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                  {editingWorkspace?.id === ws.id ? (
                    <form onSubmit={handleUpdate} className="flex-1 flex gap-2">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={editWorkspaceName}
                        onChange={(e) => setEditWorkspaceName(e.target.value)}
                        className="flex-1 bg-white border border-zinc-200 rounded-lg py-1.5 px-3 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                      <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 cursor-pointer">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingWorkspace(null)} className="px-3 py-1.5 bg-zinc-100 text-zinc-500 hover:bg-zinc-200 text-xs rounded-lg cursor-pointer">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-800">{ws.name}</span>
                        <span className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">
                          {activeWorkspace?.id === ws.id ? '🟢 Active' : 'Personal Workspace'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingWorkspace(ws)
                            setEditWorkspaceName(ws.name)
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all"
                          title="Rename Workspace"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {workspaces.length > 1 && (
                          <button
                            onClick={() => handleDelete(ws.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                            title="Delete Workspace"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-650 text-xs font-semibold rounded-xl hover:bg-zinc-100/60 cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        {/* Switcher Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-zinc-50 border border-zinc-200/85 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-zinc-300 hover:bg-zinc-100/60 transition-all text-left"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Workspace</span>
            <span className="text-xs font-extrabold text-zinc-850 truncate">
              {activeWorkspace?.name || 'Loading Workspace...'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 shadow-xl rounded-xl z-[60] p-2 space-y-1.5 max-h-64 overflow-y-auto">
            <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider px-2.5 py-1.5 border-b border-zinc-100">
              Switch Workspace
            </div>
            
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-all text-left cursor-pointer ${
                    activeWorkspace?.id === ws.id 
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/50' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
                  }`}
                >
                  <span className="truncate pr-4">{ws.name}</span>
                  {activeWorkspace?.id === ws.id && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-100 pt-1.5 space-y-1">
              <button
                onClick={() => {
                  setShowCreateModal(true)
                  setIsOpen(false)
                  setError(null)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-emerald-650 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg transition-all text-left cursor-pointer"
              >
                <Plus className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">Create Workspace</span>
              </button>
              <button
                onClick={() => {
                  setShowManageModal(true)
                  setIsOpen(false)
                  setError(null)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-lg transition-all text-left cursor-pointer"
              >
                <Settings className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold">Manage Workspaces</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portaled modals — rendered at document.body level to escape sidebar stacking context */}
      {createModal}
      {manageModal}
    </>
  )
}
