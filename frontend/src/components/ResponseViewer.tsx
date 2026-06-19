import { useState } from 'react'
import { Check, Copy, HelpCircle } from 'lucide-react'

interface ResponseViewerProps {
  response: {
    status: number
    body: string
    headers: Record<string, string>
    size_bytes: number
    time_ms: number
    resolved_url?: string
  } | null
  isLoading: boolean
}

export default function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[350px] shadow-sm shadow-zinc-500/5 h-full">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <span className="text-sm font-semibold text-zinc-800">Executing request on proxy...</span>
        <span className="text-xs text-zinc-400 mt-1">Calling external API through proxy executor</span>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 text-center min-h-[350px] flex flex-col items-center justify-center shadow-sm shadow-zinc-500/5 h-full">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-4 shadow-sm shadow-emerald-500/5">
          <HelpCircle className="h-6 w-6 text-emerald-600" />
        </div>
        <span className="text-sm font-bold text-zinc-900">No response to display</span>
        <span className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Select or build a request and press "Send Request" to view latency metrics, headers, and payload contents.
        </span>
      </div>
    )
  }

  // Determine status color
  let statusColor = 'text-zinc-700 bg-zinc-50 border-zinc-200'
  if (response.status >= 200 && response.status < 300) {
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100'
  } else if (response.status >= 300 && response.status < 400) {
    statusColor = 'text-sky-700 bg-sky-50 border-sky-100'
  } else if (response.status >= 400) {
    statusColor = 'text-rose-700 bg-rose-50 border-rose-100'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format Pretty Body
  const getPrettyBody = () => {
    if (!response.body) return ''
    try {
      // Check if it's JSON
      const parsed = JSON.parse(response.body)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return response.body
    }
  }

  const prettyBody = getPrettyBody()

  return (
    <div className="bg-white border border-zinc-200/60 rounded-3xl p-5 space-y-4 shadow-sm shadow-zinc-500/5 h-full flex flex-col">
      
      {/* Response Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Response:</span>
          
          <div className={`text-[11px] font-extrabold border rounded-xl px-2.5 py-1 flex items-center gap-1.5 ${statusColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span>{response.status || 'ERROR'}</span>
          </div>
          
          <div className="text-[11px] font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
            <span>Time: </span>
            <span className="text-zinc-900">{response.time_ms} ms</span>
          </div>
          
          <div className="text-[11px] font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
            <span>Size: </span>
            <span className="text-zinc-900">{formatSize(response.size_bytes)}</span>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-zinc-100 pb-2">
        <button 
          onClick={() => setActiveTab('body')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'body' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          Response Body
        </button>
        <button 
          onClick={() => setActiveTab('headers')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'headers' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          Headers ({Object.keys(response.headers || {}).length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-[220px] max-h-[500px] overflow-y-auto rounded-2xl border border-zinc-250 bg-zinc-950 p-4">
        {activeTab === 'body' && (
          <pre className="text-zinc-200 whitespace-pre-wrap break-all leading-relaxed tab-size-2 select-text font-mono text-[11px]">
            {prettyBody || <span className="text-zinc-500 italic">Empty response body</span>}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500 font-extrabold tracking-wider">
                  <th className="py-2">Header Key</th>
                  <th className="py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers || {}).map(([key, value]) => (
                  <tr key={key} className="border-b border-zinc-900/50 hover:bg-zinc-900/20">
                    <td className="py-2 text-zinc-400 pr-4 font-bold select-all">{key}</td>
                    <td className="py-2 text-zinc-300 select-all break-all">{value}</td>
                  </tr>
                ))}
                {Object.keys(response.headers || {}).length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-zinc-600 italic">No headers present</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
