import { useState, useEffect } from 'react'
import { Trash2, Search, Trash, Clock, Check, AlertTriangle } from 'lucide-react'
import { useHistoryStore } from '../store/historyStore'
import type { RequestHistoryItem } from '../store/historyStore'
import { useCollectionStore } from '../store/collectionStore'
import CustomSelect from './CustomSelect'

const methodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' }
]

interface HistoryPanelProps {
  workspaceId: string
}

export default function HistoryPanel({ workspaceId }: HistoryPanelProps) {
  const { historyItems, fetchHistory, deleteHistoryItem, clearHistory, isLoading } = useHistoryStore()
  const { setActiveRequest } = useCollectionStore()

  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('')

  useEffect(() => {
    fetchHistory(workspaceId, search, method)
  }, [workspaceId, search, method])

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all request history in this workspace?')) {
      await clearHistory(workspaceId)
    }
  }

  const handleRestore = (item: RequestHistoryItem) => {
    // Construct a mock ApiRequest payload to restore in client
    setActiveRequest({
      id: item.request_id || 'history-restored',
      name: item.name,
      method: item.method,
      url: item.url,
      headers: item.headers || [],
      params: [],
      body_type: item.body_content ? 'raw' : 'none',
      body_content: item.body_content || '',
      auth_type: 'none',
      auth_config: {},
      collection_id: '',
      folder_id: null,
      workspace_id: item.workspace_id,
      created_at: item.created_at,
      updated_at: item.created_at
    })
  }

  // Method style color
  const methodColors: Record<string, string> = {
    GET: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    POST: 'text-blue-700 bg-blue-50 border-blue-100',
    PUT: 'text-amber-700 bg-amber-50 border-amber-100',
    DELETE: 'text-rose-700 bg-rose-50 border-rose-100',
    PATCH: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Execution History</h2>
          <p className="text-xs text-zinc-500 mt-1">Audit logs of all client proxy executions triggered in this workspace.</p>
        </div>

        {historyItems.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-750 bg-rose-50 border border-rose-100 hover:bg-rose-100/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-semibold"
          >
            <Trash className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-primary/50 focus-within:bg-white transition-all">
          <Search className="h-4 w-4 text-zinc-450 mr-2" />
          <input 
            type="text"
            placeholder="Search by request URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-800 placeholder-zinc-450 focus:outline-none font-medium"
          />
        </div>

        <CustomSelect
          value={method}
          onChange={setMethod}
          options={methodOptions}
          buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-700 focus:border-primary/50 cursor-pointer font-medium"
          optionsClassName="w-full"
        />
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {historyItems.map(item => {
          const status = item.response_status
          const isSuccess = status >= 100 && status < 400
          
          return (
            <div 
              key={item.id}
              onClick={() => handleRestore(item)}
              className="flex items-center justify-between p-3 bg-white border border-zinc-200/80 rounded-2xl hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-500/5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 truncate flex-1 pr-4">
                <span className={`text-[10px] font-extrabold px-2 py-1 border rounded-lg ${methodColors[item.method] || 'text-zinc-500 border-zinc-200'}`}>
                  {item.method}
                </span>

                <div className="truncate space-y-0.5">
                  <div className="text-xs font-bold text-zinc-800 truncate font-mono">{item.url}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>Latency: {item.response_time_ms} ms</span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <span className={`text-xs font-bold px-2 py-0.5 border rounded-lg flex items-center gap-1 ${isSuccess ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                  {isSuccess ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {status}
                </span>

                <button 
                  onClick={() => deleteHistoryItem(item.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete log entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}

        {historyItems.length === 0 && !isLoading && (
          <div className="text-center py-12 text-xs text-zinc-500 bg-white border border-dashed border-zinc-200 rounded-2xl shadow-sm shadow-zinc-500/5">
            No request history matches the filter
          </div>
        )}
      </div>
    </div>
  )
}
