import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Shield, Eye, EyeOff, Database } from 'lucide-react'
import { useEnvironmentStore } from '../store/environmentStore'

interface EnvironmentManagerProps {
  workspaceId: string
}

// ────────────────────────────────────────────────────────────────────────
// 1. ENVIRONMENT SIDEBAR (Rendered in the Sidebar Panel)
// ────────────────────────────────────────────────────────────────────────
export function EnvironmentSidebar({ workspaceId }: EnvironmentManagerProps) {
  const {
    environments,
    fetchEnvironments,
    createEnvironment,
    deleteEnvironment,
    activateEnvironment,
    selectedEnvId,
    setSelectedEnvId
  } = useEnvironmentStore()

  const [showAddEnv, setShowAddEnv] = useState(false)
  const [newEnvName, setNewEnvName] = useState('')

  useEffect(() => {
    fetchEnvironments(workspaceId)
  }, [workspaceId])

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEnvName.trim()) return
    const created = await createEnvironment(workspaceId, newEnvName.trim())
    if (created) {
      setNewEnvName('')
      setShowAddEnv(false)
    }
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Top action button */}
      <button
        onClick={() => setShowAddEnv(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-750 bg-white border border-zinc-200 hover:border-emerald-400 hover:text-emerald-700 px-2 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
      >
        <Plus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        New Environment
      </button>

      {/* New Environment form */}
      {showAddEnv && (
        <form onSubmit={handleCreateEnvironment} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            autoFocus
            required
            placeholder="Environment name (e.g. Staging)"
            value={newEnvName}
            onChange={e => setNewEnvName(e.target.value)}
            className="w-full bg-white border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 font-medium"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddEnv(false)}
              className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-emerald-500 text-white font-bold rounded-lg px-3 py-1 hover:bg-emerald-600 cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* List of Environments */}
      <div className="space-y-1">
        {environments.map(env => {
          const isActive = env.is_active
          const isSelected = env.id === selectedEnvId

          return (
            <div
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={`group flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-800'
                  : 'hover:bg-zinc-50 border-transparent text-zinc-650'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Database className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span className={`text-[11px] truncate font-medium ${isSelected ? 'font-bold text-emerald-900' : ''}`}>
                  {env.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                {isActive && (
                  <span className="shrink-0 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md group-hover:hidden transition-all">
                    Active
                  </span>
                )}
                
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isActive && (
                    <button
                      onClick={() => activateEnvironment(env.id)}
                      title="Set Active"
                      className="p-1 rounded-md hover:bg-zinc-150 text-zinc-450 hover:text-emerald-600 cursor-pointer transition-all"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`Delete environment "${env.name}"?`)) deleteEnvironment(env.id) }}
                    title="Delete"
                    className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-500 text-zinc-450 cursor-pointer transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {environments.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
            No environments yet.<br />
            <button
              onClick={() => setShowAddEnv(true)}
              className="text-emerald-600 font-bold hover:underline mt-1 cursor-pointer"
            >
              Create your first →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// 2. ENVIRONMENT VARIABLES PANEL (Rendered in the Main Panel)
// ────────────────────────────────────────────────────────────────────────
export function EnvironmentVariablesPanel({ workspaceId }: EnvironmentManagerProps) {
  const {
    environments,
    activateEnvironment,
    createVariable,
    deleteVariable,
    selectedEnvId
  } = useEnvironmentStore()

  // Variable input states
  const [varKey, setVarKey] = useState('')
  const [varVal, setVarVal] = useState('')
  const [varSecret, setVarSecret] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const currentEnv = environments.find(e => e.id === selectedEnvId)

  const handleAddVariable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEnvId || !varKey.trim()) return
    await createVariable(selectedEnvId, varKey.trim(), varVal, varSecret)
    setVarKey('')
    setVarVal('')
    setVarSecret(false)
  }

  const toggleShowSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!currentEnv) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px] shadow-xs shadow-zinc-500/5 animate-in fade-in duration-300">
        <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 mb-5">
          <Database className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 mb-1.5">No Environment Selected</h3>
        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
          Select an environment from the sidebar or create a new one to manage its variables.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs shadow-zinc-500/5 space-y-6">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900">Variables in "{currentEnv.name}"</h2>
              {currentEnv.is_active ? (
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  Active
                </span>
              ) : (
                <button
                  onClick={() => activateEnvironment(currentEnv.id)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-emerald-700 bg-zinc-50 border border-zinc-200 hover:bg-emerald-50 hover:border-emerald-250 px-2.5 py-0.5 rounded-md transition-all cursor-pointer"
                >
                  Activate Profile
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Substitute values in your requests with <code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-mono font-bold">{"{{variable_key}}"}</code>
            </p>
          </div>
          <span className="text-xs text-zinc-450 font-semibold bg-zinc-50 border border-zinc-150 px-2.5 py-1 rounded-xl">
            {currentEnv.environment_variables?.length || 0} variables
          </span>
        </div>

        {/* Add variable form */}
        <form onSubmit={handleAddVariable} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-zinc-50/50 border border-zinc-200 rounded-2xl p-4">
          <div className="md:col-span-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Key</label>
            <input
              type="text"
              placeholder="e.g. base_url"
              value={varKey}
              onChange={e => setVarKey(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-mono font-semibold transition-all"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Value</label>
            <input
              type="text"
              placeholder="e.g. https://api.example.com"
              value={varVal}
              onChange={e => setVarVal(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-mono font-semibold transition-all"
            />
          </div>
          <div className="md:col-span-1 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none py-2">
              <input
                type="checkbox"
                checked={varSecret}
                onChange={e => setVarSecret(e.target.checked)}
                className="rounded border-zinc-300 accent-emerald-500 text-emerald-500 h-4 w-4"
              />
              <span className="text-xs text-zinc-500 font-semibold">Secret</span>
            </label>

            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs shadow-emerald-500/10 transition-all shrink-0"
            >
              Add Variable
            </button>
          </div>
        </form>

        {/* Variables Table */}
        <div className="overflow-x-auto border border-zinc-200/60 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] uppercase text-zinc-500 font-extrabold">
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEnv.environment_variables?.map(v => {
                const isSecret = v.secret
                const isRevealed = !!showSecrets[v.id]

                return (
                  <tr key={v.id} className="border-b border-zinc-100 hover:bg-zinc-50/30 transition-all">
                    <td className="px-4 py-3 text-xs text-zinc-800 font-bold font-mono">{v.key}</td>
                    <td className="px-4 py-3 text-xs text-zinc-650 font-mono">
                      {isSecret && !isRevealed ? (
                        <span className="text-amber-700/80 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 text-[10px] font-semibold">
                          <Shield className="h-3 w-3" /> Encrypted Secret
                        </span>
                      ) : (
                        <span>{v.value}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isSecret && (
                          <button
                            onClick={() => toggleShowSecret(v.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
                            title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                          >
                            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => deleteVariable(currentEnv.id, v.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Variable"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {(!currentEnv.environment_variables || currentEnv.environment_variables.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-zinc-400 italic text-xs">
                    No variables defined in this profile. Add one using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
