import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, Play, Activity, Clock, ToggleLeft, ToggleRight, Check, AlertTriangle } from 'lucide-react'
import { useMonitorStore } from '../store/monitorStore'
import type { ApiMonitor } from '../store/monitorStore'
import CustomSelect from './CustomSelect'

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' }
]

const intervalOptions = [
  { value: 5, label: 'Every 5 Minutes' },
  { value: 10, label: 'Every 10 Minutes' },
  { value: 30, label: 'Every 30 Minutes' },
  { value: 60, label: 'Every Hour' }
]

interface MonitorPanelProps {
  workspaceId: string
}

export default function MonitorPanel({ workspaceId }: MonitorPanelProps) {
  const { 
    monitors, fetchMonitors, activeMonitor, fetchMonitorDetails, 
    createMonitor, deleteMonitor, toggleMonitor, isLoading 
  } = useMonitorStore()

  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [interval, setIntervalVal] = useState(10)

  useEffect(() => {
    fetchMonitors(workspaceId)
  }, [workspaceId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    const created = await createMonitor(workspaceId, {
      name,
      url,
      method,
      interval_minutes: interval,
      is_active: true
    })
    if (created) {
      setName('')
      setUrl('')
      setMethod('GET')
      setIntervalVal(10)
      setShowAdd(false)
    }
  }

  const handleSelectMonitor = (id: string) => {
    fetchMonitorDetails(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">API Health Monitoring</h2>
          <p className="text-xs text-zinc-500 mt-1">Configure background health checks to monitor your microservices and notify on downtime.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs text-white bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Monitor</span>
        </button>
      </div>

      {/* Add Monitor Form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200/80 rounded-2xl p-5 max-w-xl space-y-4 shadow-md shadow-zinc-500/5">
          <h3 className="text-sm font-semibold text-zinc-900">Create Uptime Check Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Friendly Name</label>
              <input 
                type="text"
                placeholder="e.g. Authentication Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-lg px-2.5 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Method</label>
              <CustomSelect
                value={method}
                onChange={setMethod}
                options={methodOptions}
                className="w-full"
                buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-lg px-2.5 py-2 text-zinc-800 focus:border-primary cursor-pointer"
                optionsClassName="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Endpoint URL</label>
            <input 
              type="text"
              placeholder="https://auth.myapi.com/healthz"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-lg px-2.5 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary focus:bg-white transition-all font-mono"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Check Interval (Minutes)</label>
            <CustomSelect
              value={interval}
              onChange={(val) => setIntervalVal(parseInt(val))}
              options={intervalOptions}
              className="w-full"
              buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-lg px-2.5 py-2 text-zinc-800 focus:border-primary cursor-pointer"
              optionsClassName="w-full"
            />
          </div>

          <div className="flex justify-end gap-1.5 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-zinc-500 hover:text-zinc-800 px-2.5 py-1">Cancel</button>
            <button type="submit" className="text-xs bg-primary text-white font-medium rounded-lg px-3.5 py-1.5 hover:bg-primary/95">Create & Start</button>
          </div>
        </form>
      )}

      {/* Split grid for monitors list and check logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: list of monitors */}
        <div className="space-y-3 lg:col-span-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block px-1">Active Monitors</span>
          
          <div className="space-y-3">
            {monitors.map(m => {
              const isActive = m.is_active
              const isSelected = activeMonitor?.id === m.id

              return (
                <div 
                  key={m.id}
                  onClick={() => handleSelectMonitor(m.id)}
                  className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all hover:bg-zinc-50/20 ${isSelected ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-zinc-200'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-150 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950">{m.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.method} {m.url}</p>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => toggleMonitor(m.id)}
                        className="text-zinc-400 hover:text-zinc-800 transition-colors"
                      >
                        {isActive ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      
                      <button 
                        onClick={() => deleteMonitor(m.id)}
                        className="p-1.5 text-zinc-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Monitor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Monitor metrics row */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5">
                    <div className="text-center bg-zinc-50 border border-zinc-150 rounded-xl p-1.5">
                      <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Uptime</span>
                      <span className="text-xs font-bold text-emerald-700">{m.uptime_percentage ?? 100}%</span>
                    </div>
                    <div className="text-center bg-zinc-50 border border-zinc-150 rounded-xl p-1.5">
                      <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Avg Response</span>
                      <span className="text-xs font-bold text-zinc-900">{m.avg_latency_ms ?? 0} ms</span>
                    </div>
                    <div className="text-center bg-zinc-50 border border-zinc-150 rounded-xl p-1.5">
                      <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Checks Run</span>
                      <span className="text-xs font-bold text-zinc-700">{m.total_checks ?? 0} runs</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {monitors.length === 0 && (
              <div className="text-center py-12 text-xs text-zinc-500 bg-white border border-dashed border-zinc-200 rounded-2xl shadow-sm shadow-zinc-500/5">
                No health check monitors set up. Setup a monitor above.
              </div>
            )}
          </div>
        </div>

        {/* Right column: check execution history logs */}
        <div className="lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block px-1 mb-3">Check logs</span>
          
          {activeMonitor ? (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 space-y-4 shadow-sm shadow-zinc-500/5">
              <div className="border-b border-zinc-150 pb-2">
                <h4 className="text-xs font-bold text-zinc-950 truncate">{activeMonitor.name} Logs</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">Showing last 20 health check events</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeMonitor.recent_logs?.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-zinc-50/50 rounded-xl border border-zinc-150">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-700">{log.response_time_ms} ms</span>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 border rounded-lg flex items-center gap-1 ${log.success ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                      {log.success ? <Check className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                      {log.response_status}
                    </span>
                  </div>
                ))}

                {(!activeMonitor.recent_logs || activeMonitor.recent_logs.length === 0) && (
                  <div className="text-center py-6 text-[10px] text-zinc-500 italic">No health check runs logged yet</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 text-center text-zinc-500 italic text-xs min-h-[150px] flex items-center justify-center shadow-sm shadow-zinc-500/5">
              Select a monitor to view its log history
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
