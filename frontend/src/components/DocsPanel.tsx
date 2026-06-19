import { useState, useEffect } from 'react'
import { FileText, Copy, Check, Download } from 'lucide-react'
import { api } from '../lib/api'
import { useCollectionStore } from '../store/collectionStore'
import CustomSelect from './CustomSelect'

interface DocsPanelProps {
  workspaceId: string
}

interface DocData {
  collection_name: string
  description: string | null
  endpoints: Array<{
    name: string
    method: string
    url: string
    headers: Array<{ key: string; value: string; enabled: boolean }>
    params: Array<{ key: string; value: string; enabled: boolean }>
    body_type: string
    body_content: string | null
    auth_type: string
  }>
}

export default function DocsPanel({ workspaceId }: DocsPanelProps) {
  const { collections } = useCollectionStore()
  const [selectedColId, setSelectedColId] = useState<string>('')
  const [docData, setDocData] = useState<DocData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (collections.length > 0 && !selectedColId) {
      setSelectedColId(collections[0].id)
    }
  }, [collections])

  useEffect(() => {
    if (selectedColId) {
      fetchDocs(selectedColId)
    }
  }, [selectedColId])

  const fetchDocs = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await api.get(`/api/v1/collections/${id}/docs`)
      if (res.ok) {
        const data = await res.json()
        setDocData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Generates Markdown string
  const generateMarkdown = () => {
    if (!docData) return ''
    let md = `# ${docData.collection_name}\n\n`
    if (docData.description) md += `${docData.description}\n\n`
    md += `## Endpoints\n\n`

    docData.endpoints.forEach(ep => {
      md += `### ${ep.name}\n\n`
      md += `**Method:** \`${ep.method}\`  \n`
      md += `**URL:** \`${ep.url}\`  \n`
      md += `**Auth Type:** \`${ep.auth_type}\`  \n\n`

      // Headers
      const activeHeaders = ep.headers?.filter(h => h.enabled && h.key) || []
      if (activeHeaders.length > 0) {
        md += `#### Headers\n\n`
        md += `| Key | Value |\n`
        md += `| --- | --- |\n`
        activeHeaders.forEach(h => {
          md += `| \`${h.key}\` | \`${h.value}\` |\n`
        })
        md += `\n`
      }

      // Body
      if (ep.body_type !== 'none' && ep.body_content) {
        md += `#### Request Body (\`${ep.body_type}\`)\n\n`
        md += `\`\`\`json\n${ep.body_content}\n\`\`\`\n\n`
      }

      md += `***\n\n`
    })

    return md
  }

  const handleCopyMarkdown = () => {
    const md = generateMarkdown()
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const methodColors: Record<string, string> = {
    GET: 'text-emerald-750 bg-emerald-50 border-emerald-100',
    POST: 'text-blue-750 bg-blue-50 border-blue-100',
    PUT: 'text-amber-750 bg-amber-50 border-amber-100',
    DELETE: 'text-rose-750 bg-rose-50 border-rose-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">API Documentation</h2>
          <p className="text-xs text-zinc-500 mt-1">Generate comprehensive API reference specifications for your collections.</p>
        </div>

        {/* Collection Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-semibold">Select Collection:</span>
          <CustomSelect
            value={selectedColId}
            onChange={setSelectedColId}
            options={collections.map(c => ({ value: c.id, label: c.name }))}
            buttonClassName="bg-zinc-50 border border-zinc-200 text-xs rounded-xl px-3 py-2 text-zinc-800 cursor-pointer font-medium"
            optionsClassName="w-[200px] right-0 left-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-2"></div>
          <span className="text-xs text-zinc-500">Generating documentation...</span>
        </div>
      ) : docData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documentation Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 shadow-md shadow-zinc-500/5">
              <h3 className="text-lg font-bold text-zinc-950">{docData.collection_name}</h3>
              <p className="text-xs text-zinc-650 leading-relaxed font-medium">{docData.description || 'No description provided.'}</p>
            </div>

            {/* List endpoints details */}
            <div className="space-y-4">
              {docData.endpoints.map((ep, idx) => {
                const activeHeaders = ep.headers?.filter(h => h.enabled && h.key) || []

                return (
                  <div key={idx} className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4 shadow-sm shadow-zinc-500/5">
                    <div className="flex items-center gap-3 border-b border-zinc-150 pb-2.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 border rounded-lg ${methodColors[ep.method] || 'text-zinc-500 border-zinc-200'}`}>
                        {ep.method}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900">{ep.name}</h4>
                    </div>

                    <div className="space-y-2 font-mono text-[11px] text-zinc-600">
                      <div>
                        <span className="text-zinc-400 font-bold">URL:</span> <span className="text-zinc-900 select-all font-semibold">{ep.url}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-bold">Authorization:</span> <span className="text-zinc-800 capitalize font-semibold">{ep.auth_type}</span>
                      </div>
                    </div>

                    {/* Headers */}
                    {activeHeaders.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Headers</span>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 text-zinc-500 font-bold">
                              <th className="py-1 pb-2">Header</th>
                              <th className="py-1 pb-2">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeHeaders.map((h, i) => (
                              <tr key={i} className="border-b border-zinc-100">
                                <td className="py-1.5 font-bold text-zinc-700 font-mono">{h.key}</td>
                                <td className="py-1.5 text-zinc-600 font-mono">{h.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Body */}
                    {ep.body_type !== 'none' && ep.body_content && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Request Body ({ep.body_type})</span>
                        <pre className="bg-white text-zinc-800 border border-zinc-100 rounded-xl p-3 text-[10.5px] font-mono overflow-x-auto max-h-[150px] shadow-inner">
                          {ep.body_content}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}

              {docData.endpoints.length === 0 && (
                <div className="text-center py-12 text-xs text-zinc-500 bg-white border border-dashed border-zinc-200 rounded-2xl shadow-sm shadow-zinc-500/5">
                  No requests created in this collection yet.
                </div>
              )}
            </div>
          </div>

          {/* Export Sidebar Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4 sticky top-6 shadow-md shadow-zinc-500/5">
              <h4 className="text-xs font-bold text-zinc-950">Export Documentation</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">Copy the full documentation format in Github Flavored Markdown to export to your README or developers portal.</p>

              <button
                onClick={handleCopyMarkdown}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-primary hover:bg-primary/95 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 text-center text-zinc-500 italic text-xs min-h-[150px] flex items-center justify-center shadow-sm shadow-zinc-500/5">
          No collections available to document
        </div>
      )}
    </div>
  )
}
