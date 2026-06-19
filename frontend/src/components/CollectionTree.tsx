import React, { useState } from 'react'
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Import, CheckCircle } from 'lucide-react'
import { useCollectionStore } from '../store/collectionStore'
import type { ApiRequest } from '../store/collectionStore'
import { motion, AnimatePresence } from 'framer-motion'

interface CollectionTreeProps {
  workspaceId: string
}

const METHOD_COLORS: Record<string, { text: string; bg: string }> = {
  GET:    { text: 'text-emerald-700', bg: 'bg-emerald-50' },
  POST:   { text: 'text-blue-700',    bg: 'bg-blue-50'    },
  PUT:    { text: 'text-amber-700',   bg: 'bg-amber-50'   },
  PATCH:  { text: 'text-indigo-700',  bg: 'bg-indigo-50'  },
  DELETE: { text: 'text-rose-700',    bg: 'bg-rose-50'    },
}

export default function CollectionTree({ workspaceId }: CollectionTreeProps) {
  const {
    collections, createCollection, deleteCollection, duplicateCollection,
    createRequest, deleteRequest, activeRequest, setActiveRequest, importCollection
  } = useCollectionStore()

  const [newColName, setNewColName] = useState('')
  const [showAddCol, setShowAddCol] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  
  // Deletion confirm states
  const [deleteConfirmCol, setDeleteConfirmCol] = useState<string | null>(null)
  const [deleteConfirmReq, setDeleteConfirmReq] = useState<string | null>(null)
  
  // Validation and Toast states
  const [colError, setColError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<{ collectionId: string; message: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleExpand = (id: string) =>
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameTrimmed = newColName.trim()
    if (!nameTrimmed) return

    if (collections.length >= 5) {
      setColError("Free Tier Limit Reached: You can create a maximum of 5 collections.")
      return
    }

    const nameExists = collections.some(c => c.name.toLowerCase() === nameTrimmed.toLowerCase())
    if (nameExists) {
      setColError("A collection with this name already exists.")
      return
    }

    setColError(null)
    const col = await createCollection(workspaceId, nameTrimmed)
    if (col) {
      setExpandedNodes(prev => ({ ...prev, [col.id]: true }))
      triggerToast('Collection created successfully!')
    }
    setNewColName('')
    setShowAddCol(false)
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importJson.trim()) return

    if (collections.length >= 5) {
      setImportError("Free Tier Limit Reached: You can create a maximum of 5 collections.")
      return
    }

    try {
      const parsed = JSON.parse(importJson)
      const name = parsed.info?.name || parsed.name || "Imported Collection"
      const nameExists = collections.some(c => c.name.toLowerCase() === name.toLowerCase())
      if (nameExists) {
        setImportError(`A collection named "${name}" already exists.`)
        return
      }
    } catch (err) {
      setImportError("Invalid JSON format.")
      return
    }

    setImportError(null)
    const ok = await importCollection(workspaceId, importJson)
    if (ok) {
      setImportJson('')
      setShowImport(false)
      triggerToast('Collection imported successfully!')
    } else {
      setImportError('Invalid JSON format or unsupported file')
    }
  }

  // Create request with a placeholder URL so backend validation passes,
  // then open it immediately in the main panel
  const handleAddRequest = async (collectionId: string) => {
    if (creatingFor) return
    const col = collections.find(c => c.id === collectionId)
    const requestCount = col?.requests?.length || 0
    if (requestCount >= 5) {
      setRequestError({
        collectionId,
        message: "Free Tier Limit Reached: Maximum 5 requests per collection."
      })
      // Clear it after 5 seconds
      setTimeout(() => {
        setRequestError(prev => prev?.collectionId === collectionId ? null : prev)
      }, 5000)
      return
    }

    setRequestError(null)

    // Auto-resolve naming duplicates if "New Request" already exists in collection
    let reqName = 'New Request'
    let counter = 1
    while (col?.requests?.some(r => r.name.toLowerCase() === reqName.toLowerCase())) {
      reqName = `New Request (${counter})`
      counter++
    }

    setCreatingFor(collectionId)
    setExpandedNodes(prev => ({ ...prev, [collectionId]: true }))
    const newReq = await createRequest(collectionId, null, reqName, 'GET', 'https://')
    setCreatingFor(null)
    if (newReq) {
      triggerToast('Request created successfully!')
    }
  }

  const renderRequest = (req: ApiRequest) => {
    const isActive = activeRequest?.id === req.id
    const m = METHOD_COLORS[req.method] || { text: 'text-zinc-500', bg: 'bg-zinc-100' }

    return (
      <div
        key={req.id}
        onClick={() => setActiveRequest(req)}
        className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all ${
          isActive
            ? 'bg-emerald-50 border border-emerald-200/60'
            : 'hover:bg-zinc-50 border border-transparent'
        }`}
      >
        {/* Method badge — fixed width so names always align */}
        <span className={`text-[9px] font-extrabold w-10 shrink-0 text-center px-1 py-0.5 rounded-md ${m.text} ${m.bg}`}>
          {req.method}
        </span>

        {/* Name — truncate with tooltip */}
        <span
          title={req.name}
          className={`text-[11px] flex-1 truncate font-medium ${
            isActive ? 'text-emerald-800 font-bold' : 'text-zinc-600'
          }`}
        >
          {req.name}
        </span>

        {deleteConfirmReq === req.id ? (
          <div className="flex items-center gap-1 shrink-0 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={async e => {
                e.stopPropagation()
                const ok = await deleteRequest(req.id)
                if (ok) {
                  setDeleteConfirmReq(null)
                  triggerToast('Request deleted successfully!')
                } else {
                  triggerToast('Failed to delete request', 'error')
                }
              }}
              className="px-2 py-0.5 text-[9px] font-extrabold text-white bg-rose-500 hover:bg-rose-600 rounded-md cursor-pointer transition-all shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                setDeleteConfirmReq(null)
              }}
              className="px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 hover:text-zinc-800 rounded-md cursor-pointer transition-all"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={e => {
              e.stopPropagation()
              setDeleteConfirmReq(req.id)
              setDeleteConfirmCol(null)
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all shrink-0"
            title="Delete request"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Premium limits badge */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm shadow-emerald-500/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
            Free Tier Usage
          </span>
          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
            Plan limits
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 font-semibold">Collections:</span>
            <span className="font-bold text-zinc-700">{collections.length} / 5</span>
          </div>
          <div className="w-full bg-zinc-150 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((collections.length / 5) * 100, 100)}%` }}
            />
          </div>
        </div>
        <p className="text-[9px] text-zinc-400 leading-relaxed mt-0.5">
          Limit: 5 collections & 5 requests per collection. Premium subscription for unlimited access is coming soon.
        </p>
      </div>

      {/* ── Top actions ─────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowAddCol(v => !v); setShowImport(false) }}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-200 hover:border-emerald-400 hover:text-emerald-700 px-2 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          New Collection
        </button>
        <button
          onClick={() => { setShowImport(v => !v); setShowAddCol(false) }}
          title="Import Collection"
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all cursor-pointer"
        >
          <Import className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── New collection form ──────────────────────── */}
      {showAddCol && (
        <form onSubmit={handleCreateCollection} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <input
            type="text" autoFocus required
            placeholder="Collection name..."
            value={newColName}
            onChange={e => {
              setNewColName(e.target.value)
              setColError(null)
            }}
            className="w-full bg-white border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 font-medium"
          />
          {colError && (
            <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-150 px-2.5 py-1.5 rounded-lg leading-relaxed">
              {colError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowAddCol(false); setColError(null); }} className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 cursor-pointer">Cancel</button>
            <button type="submit" className="text-xs bg-emerald-500 text-white font-bold rounded-lg px-3 py-1 hover:bg-emerald-600 cursor-pointer">Create</button>
          </div>
        </form>
      )}

      {/* ── Import form ──────────────────────────────── */}
      {showImport && (
        <form onSubmit={handleImport} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <textarea
            required placeholder="Paste Postman Collection JSON..."
            value={importJson}
            onChange={e => {
              setImportJson(e.target.value)
              setImportError(null)
            }}
            className="w-full h-24 bg-white border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {importError && (
            <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-150 px-2.5 py-1.5 rounded-lg leading-relaxed">
              {importError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowImport(false); setImportError(null); }} className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 cursor-pointer">Cancel</button>
            <button type="submit" className="text-xs bg-emerald-500 text-white font-bold rounded-lg px-3 py-1 hover:bg-emerald-600 cursor-pointer">Import</button>
          </div>
        </form>
      )}

      {/* ── Collections ──────────────────────────────── */}
      <div className="space-y-1.5">
        {collections.map(col => {
          const isExpanded = !!expandedNodes[col.id]
          const requests = col.requests || []
          const isCreating = creatingFor === col.id

          return (
            <div key={col.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">

              {/* Collection row */}
              <div className="group flex items-center gap-1.5 px-2 py-2 hover:bg-zinc-50 transition-all cursor-pointer select-none">

                {/* Expand chevron */}
                <button
                  className="shrink-0 text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors p-0.5"
                  onClick={() => toggleExpand(col.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                {/* Name + count — single line, truncate cleanly */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5" onClick={() => toggleExpand(col.id)}>
                  <span
                    title={col.name}
                    className="text-[11px] font-bold text-zinc-800 truncate leading-tight"
                  >
                    {col.name}
                  </span>
                  <span className="shrink-0 text-[9px] font-medium text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded-md">
                    {requests.length}
                  </span>
                </div>

                {/* Actions — always visible, small */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* + Req — always shown, not hidden on hover */}
                  <button
                    onClick={e => { e.stopPropagation(); handleAddRequest(col.id) }}
                    disabled={isCreating}
                    title="Add Request"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer transition-all disabled:opacity-40"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    {isCreating ? '…' : 'Req'}
                  </button>

                  {/* Duplicate & Delete — only on hover */}
                  {deleteConfirmCol === col.id ? (
                    <div className="flex items-center gap-1 shrink-0 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          const ok = await deleteCollection(col.id)
                          if (ok) {
                            setDeleteConfirmCol(null)
                            triggerToast('Collection deleted successfully!')
                          } else {
                            triggerToast('Failed to delete collection', 'error')
                          }
                        }}
                        className="px-2 py-0.5 text-[9px] font-extrabold text-white bg-rose-500 hover:bg-rose-600 rounded-md cursor-pointer transition-all shadow-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setDeleteConfirmCol(null)
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 hover:text-zinc-800 rounded-md cursor-pointer transition-all"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (collections.length >= 5) {
                            triggerToast("Free Tier Limit Reached: You can create a maximum of 5 collections.", "error")
                            return
                          }
                          const targetName = `${col.name} (Copy)`
                          const nameExists = collections.some(c => c.name.toLowerCase() === targetName.toLowerCase())
                          if (nameExists) {
                            triggerToast(`A collection named "${targetName}" already exists.`, "error")
                            return
                          }
                          duplicateCollection(col.id)
                          triggerToast('Collection duplicated successfully!')
                        }}
                        title="Duplicate"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-100 text-zinc-400 cursor-pointer transition-all"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setDeleteConfirmCol(col.id)
                          setDeleteConfirmReq(null)
                        }}
                        title="Delete"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 hover:text-rose-500 text-zinc-400 cursor-pointer transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Requests list */}
              {isExpanded && (
                <div className="px-2 pb-2 pt-0.5 border-t border-zinc-100 space-y-0.5">
                  {requests.map(r => renderRequest(r))}

                  {requestError?.collectionId === col.id && (
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-150 px-2.5 py-1.5 rounded-lg leading-relaxed mt-1 mb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {requestError.message}
                    </div>
                  )}

                  {requests.length === 0 && !isCreating && (
                    <button
                      onClick={() => handleAddRequest(col.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/40 cursor-pointer transition-all font-medium mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add first request
                    </button>
                  )}

                  {isCreating && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-emerald-600 font-medium">
                      <span className="animate-pulse">Creating request…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {collections.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
            No collections yet.<br />
            <button onClick={() => setShowAddCol(true)} className="text-emerald-600 font-bold hover:underline mt-1 cursor-pointer">
              Create your first →
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Toast alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === 'success' 
                ? 'bg-white border-emerald-150 text-emerald-900 shadow-emerald-500/5' 
                : 'bg-white border-rose-150 text-rose-900 shadow-rose-500/5'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
