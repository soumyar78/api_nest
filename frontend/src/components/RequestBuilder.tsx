import React, { useState, useEffect } from 'react'
import { Save, Send, Plus, Trash2, Code, Copy, Check, CheckCircle, Sparkles } from 'lucide-react'
import { useCollectionStore } from '../store/collectionStore'
import { useAuthStore } from '../store/authStore'
import type { ApiRequest } from '../store/collectionStore'
import { api } from '../lib/api'
import { AnimatePresence, motion } from 'framer-motion'
import CustomSelect from './CustomSelect'

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' }
]

const authTypeOptions = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' }
]

const apiKeyInOptions = [
  { value: 'header', label: 'Header' },
  { value: 'query', label: 'Query Params' }
]

const bodyTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'xml', label: 'XML' },
  { value: 'raw', label: 'Raw' }
]

const codeLangOptions = [
  { value: 'curl', label: 'cURL' },
  { value: 'js', label: 'JavaScript Fetch' },
  { value: 'python', label: 'Python Requests' }
]


interface RequestBuilderProps {
  workspaceId: string
  onSendComplete: (response: any) => void
}

export default function RequestBuilder({ workspaceId, onSendComplete }: RequestBuilderProps) {
  const { collections, activeRequest, updateRequest, setActiveRequest } = useCollectionStore()
  const { isGuest } = useAuthStore()
  
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'code'>('params')

  // Grids
  const [params, setParams] = useState<{ key: string; value: string; enabled: boolean }[]>([])
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([])

  // Auth
  const [authType, setAuthType] = useState('none')
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({})

  // Body
  const [bodyType, setBodyType] = useState('none')
  const [bodyContent, setBodyContent] = useState('')

  // Code Generator Lang
  const [codeLang, setCodeLang] = useState('curl')
  const [copiedCode, setCopiedCode] = useState(false)

  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Sync state with active request
  useEffect(() => {
    if (activeRequest) {
      setName(activeRequest.name)
      setMethod(activeRequest.method)
      setUrl(activeRequest.url)
      setParams(activeRequest.params || [])
      setHeaders(activeRequest.headers || [])
      setAuthType(activeRequest.auth_type || 'none')
      setAuthConfig(activeRequest.auth_config || {})
      setBodyType(activeRequest.body_type || 'none')
      setBodyContent(activeRequest.body_content || '')
    } else {
      setName('')
      setMethod('GET')
      setUrl('')
      setParams([])
      setHeaders([])
      setAuthType('none')
      setAuthConfig({})
      setBodyType('none')
      setBodyContent('')
    }
  }, [activeRequest])

  if (!activeRequest) {
    return null
  }

  // Handle saving configurations
  const handleSave = async () => {
    if (!name.trim()) {
      triggerToast('Request name cannot be empty', 'error')
      return
    }

    const currentCollection = collections.find(c => c.id === activeRequest.collection_id)
    if (currentCollection) {
      const hasDuplicate = currentCollection.requests?.some(
        r => r.id !== activeRequest.id && r.name.toLowerCase() === name.trim().toLowerCase()
      )
      if (hasDuplicate) {
        triggerToast('A request with this name already exists in this collection', 'error')
        return
      }
    }

    setIsSaving(true)
    const updates = {
      name,
      method,
      url,
      params,
      headers,
      auth_type: authType,
      auth_config: authConfig,
      body_type: bodyType,
      body_content: bodyContent
    }

    if (isGuest) {
      // In Guest mode, update in-memory request state
      setActiveRequest({
        ...activeRequest,
        ...updates
      })
      triggerToast('Request saved locally (In-Memory)')
    } else {
      const success = await updateRequest(activeRequest.id, updates)
      if (success) {
        triggerToast('Request synced with database')
      } else {
        triggerToast('Failed to sync request', 'error')
      }
    }
    setIsSaving(false)
  }

  // Silent auto-save when triggering a send
  const autoSave = async () => {
    const updates = {
      name,
      method,
      url,
      params,
      headers,
      auth_type: authType,
      auth_config: authConfig,
      body_type: bodyType,
      body_content: bodyContent
    }

    if (isGuest) {
      setActiveRequest({
        ...activeRequest,
        ...updates
      })
    } else {
      await updateRequest(activeRequest.id, updates)
    }
  }

  // Handle triggering request proxy execution
  const handleSend = async () => {
    if (!name.trim()) {
      triggerToast('Request name cannot be empty', 'error')
      return
    }

    const currentCollection = collections.find(c => c.id === activeRequest.collection_id)
    if (currentCollection) {
      const hasDuplicate = currentCollection.requests?.some(
        r => r.id !== activeRequest.id && r.name.toLowerCase() === name.trim().toLowerCase()
      )
      if (hasDuplicate) {
        triggerToast('A request with this name already exists in this collection', 'error')
        return
      }
    }

    setIsSending(true)
    await autoSave()
    try {
      const res = await api.post(`/api/v1/requests/send_request`, {
        workspace_id: isGuest ? 'guest' : workspaceId,
        request_id: isGuest ? null : activeRequest.id,
        name,
        method,
        url,
        params,
        headers,
        auth_type: authType,
        auth_config: authConfig,
        body_type: bodyType,
        body_content: bodyContent
      })
      if (res.ok) {
        const data = await res.json()
        onSendComplete(data.response)
        triggerToast('Request execution finished!')
      } else {
        const errData = await res.json()
        onSendComplete({
          status: 0,
          body: errData.error || 'Server error proxying request',
          headers: {},
          size_bytes: 0,
          time_ms: 0
        })
        triggerToast('Execution failed', 'error')
      }
    } catch (err) {
      onSendComplete({
        status: 0,
        body: 'Network error executing request',
        headers: {},
        size_bytes: 0,
        time_ms: 0
      })
      triggerToast('Network error occurred', 'error')
    } finally {
      setIsSending(false)
    }
  }

  // Params utilities
  const handleAddParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }
  const handleUpdateParam = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const next = [...params]
    next[index] = { ...next[index], [field]: val }
    setParams(next)
  }
  const handleDeleteParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  // Headers utilities
  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }
  const handleUpdateHeader = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const next = [...headers]
    next[index] = { ...next[index], [field]: val }
    setHeaders(next)
  }
  const handleDeleteHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  // Generate Snippets
  const getCodeSnippet = () => {
    const resolvedUrl = url || 'https://api.example.com'
    const headersStr = headers
      .filter(h => h.enabled && h.key)
      .map(h => `  "${h.key}": "${h.value}"`)
      .join(',\n')

    switch (codeLang) {
      case 'curl': {
        let cmd = `curl -X ${method} "${resolvedUrl}"`
        headers.filter(h => h.enabled && h.key).forEach(h => {
          cmd += ` \\\n  -H "${h.key}: ${h.value}"`
        })
        if (bodyType !== 'none' && bodyContent) {
          cmd += ` \\\n  -d '${bodyContent.replace(/'/g, "'\\''")}'`
        }
        return cmd
      }
      case 'js': {
        const fetchHeaders = headers.filter(h => h.enabled && h.key).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as any)
        if (bodyType !== 'none' && bodyContent) {
          fetchHeaders['Content-Type'] = bodyType === 'json' ? 'application/json' : 'text/plain'
        }
        return `fetch("${resolvedUrl}", {
  method: "${method}",
  headers: ${JSON.stringify(fetchHeaders, null, 2)},
  ${bodyType !== 'none' && bodyContent ? `body: JSON.stringify(${bodyContent})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`
      }
      case 'python': {
        return `import requests

url = "${resolvedUrl}"
headers = {
${headers.filter(h => h.enabled && h.key).map(h => `    "${h.key}": "${h.value}"`).join(',\n')}
}
${bodyType !== 'none' && bodyContent ? `payload = ${bodyContent}\nresponse = requests.request("${method}", url, headers=headers, json=payload)` : `response = requests.request("${method}", url, headers=headers)`}

print(response.text)`
      }
      default:
        return ''
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet())
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    triggerToast('Snippet copied to clipboard')
  }

  return (
    <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 space-y-5 shadow-sm shadow-zinc-500/5 relative h-full flex flex-col">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-zinc-950 text-white text-[11px] font-bold px-4 py-3 rounded-2xl shadow-xl shadow-zinc-950/20 border border-zinc-800"
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

      {/* Name and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-base font-bold text-zinc-900 focus:outline-none border-b border-transparent hover:border-zinc-200 focus:border-emerald-500 px-1 pb-0.5 w-full transition-all"
          />
          {isGuest && (
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded px-1.5 py-0.5 font-bold shrink-0 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" /> Local
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 font-bold"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-1.5 text-xs bg-primary text-white font-extrabold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSending ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>
      </div>

      {/* HTTP Input Bar */}
      <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl focus-within:border-emerald-500/50 focus-within:bg-white transition-all relative">
        <CustomSelect
          value={method}
          onChange={setMethod}
          options={methodOptions}
          buttonClassName="bg-zinc-100/80 hover:bg-zinc-150 text-xs font-black text-emerald-700 border-r border-zinc-200 px-4.5 py-3 rounded-l-2xl rounded-r-none border-y-0 border-l-0 flex items-center justify-between gap-2 min-w-[105px] h-full"
          optionsClassName="w-[120px]"
        />
        
        <input 
          type="text"
          placeholder="https://api.example.com/v1/resource"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-transparent text-xs text-zinc-800 px-4 py-3 placeholder-zinc-400 focus:outline-none font-mono rounded-r-2xl"
        />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 border-b border-zinc-100 pb-2">
        {(['params', 'headers', 'auth', 'body', 'code'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer capitalize ${
              activeSubTab === tab 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[180px] flex-1">
        {/* Params Tab */}
        {activeSubTab === 'params' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">Query Parameters</span>
              <button onClick={handleAddParam} className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Parameter
              </button>
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {params.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="checkbox" 
                    checked={p.enabled}
                    onChange={(e) => handleUpdateParam(idx, 'enabled', e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <input 
                    type="text" 
                    placeholder="Key" 
                    value={p.key}
                    onChange={(e) => handleUpdateParam(idx, 'key', e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                  <input 
                    type="text" 
                    placeholder="Value" 
                    value={p.value}
                    onChange={(e) => handleUpdateParam(idx, 'value', e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                  <button onClick={() => handleDeleteParam(idx)} className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-zinc-50 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {params.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-400 italic bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200/60">
                  No query parameters. Add one above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Headers Tab */}
        {activeSubTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">HTTP Headers</span>
              <button onClick={handleAddHeader} className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Header
              </button>
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {headers.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="checkbox" 
                    checked={h.enabled}
                    onChange={(e) => handleUpdateHeader(idx, 'enabled', e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <input 
                    type="text" 
                    placeholder="Header Key" 
                    value={h.key}
                    onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                  <input 
                    type="text" 
                    placeholder="Value" 
                    value={h.value}
                    onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                  <button onClick={() => handleDeleteHeader(idx)} className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-zinc-50 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {headers.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-400 italic bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200/60">
                  No headers configured. Add one above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Authorization Tab */}
        {activeSubTab === 'auth' && (
          <div className="space-y-4 max-w-md">
            <div>
              <CustomSelect
                value={authType}
                onChange={setAuthType}
                options={authTypeOptions}
                className="w-full"
                buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-700 focus:border-emerald-500 cursor-pointer"
                optionsClassName="w-full"
              />
            </div>

            {authType === 'bearer' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Token</label>
                <input 
                  type="text" 
                  placeholder="Bearer Token or {{token}}"
                  value={authConfig.token || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}

            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Username</label>
                  <input 
                    type="text" 
                    placeholder="Username"
                    value={authConfig.username || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={authConfig.password || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}

            {authType === 'apiKey' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Key</label>
                    <input 
                      type="text" 
                      placeholder="X-API-Key"
                      value={authConfig.key || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, key: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Value</label>
                    <input 
                      type="text" 
                      placeholder="Key value or {{api_key}}"
                      value={authConfig.value || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, value: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Add to</label>
                  <CustomSelect
                    value={authConfig.in || 'header'}
                    onChange={(val) => setAuthConfig({ ...authConfig, in: val })}
                    options={apiKeyInOptions}
                    className="w-full"
                    buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-700 cursor-pointer"
                    optionsClassName="w-full"
                  />
                </div>
              </div>
            )}

            {authType === 'oauth2' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 px-1">Access Token</label>
                <input 
                  type="text" 
                  placeholder="Access Token"
                  value={authConfig.accessToken || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, accessToken: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Body Tab */}
        {activeSubTab === 'body' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <CustomSelect
                value={bodyType}
                onChange={setBodyType}
                options={bodyTypeOptions}
                buttonClassName="bg-zinc-50 border border-zinc-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg px-2.5 py-1 text-zinc-500 cursor-pointer"
                optionsClassName="w-[180px]"
              />
            </div>

            {bodyType !== 'none' ? (
              <textarea 
                placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter raw body text...'}
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                className="w-full h-36 bg-zinc-50 border border-zinc-200 text-xs rounded-2xl p-3.5 text-zinc-800 placeholder-zinc-450 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-y"
              />
            ) : (
              <div className="text-center py-12 text-xs text-zinc-400 italic bg-zinc-50/50 border border-dashed border-zinc-200/60 rounded-2xl">
                This request does not have a body payload. Select JSON or Raw above.
              </div>
            )}
          </div>
        )}

        {/* Code Generator Tab */}
        {activeSubTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <CustomSelect
                value={codeLang}
                onChange={setCodeLang}
                options={codeLangOptions}
                buttonClassName="bg-zinc-50 border border-zinc-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg px-2.5 py-1 text-zinc-500 cursor-pointer"
                optionsClassName="w-[180px]"
              />

              <button 
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-900 px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg"
              >
                {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>Copy Code</span>
              </button>
            </div>

            <pre className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 text-[11px] text-zinc-200 font-mono overflow-x-auto max-h-[180px] leading-relaxed shadow-inner">
              {getCodeSnippet()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
