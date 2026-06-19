import { useState, useEffect } from 'react'
import { Search, FileText, Activity, Layers, Folder, Shield, CornerDownLeft } from 'lucide-react'
import { useCollectionStore } from '../store/collectionStore'
import { useMonitorStore } from '../store/monitorStore'
import { useEnvironmentStore } from '../store/environmentStore'

interface GlobalSearchProps {
  onSelectRequest: (req: any) => void
  onSelectTab: (tab: 'client' | 'env' | 'history' | 'monitor' | 'docs') => void
}

export default function GlobalSearch({ onSelectRequest, onSelectTab }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { collections } = useCollectionStore()
  const { monitors } = useMonitorStore()
  const { environments } = useEnvironmentStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  // Flatten and filter items
  const results: Array<{
    id: string
    type: 'request' | 'collection' | 'monitor' | 'environment'
    title: string
    subtitle?: string
    action: () => void
  }> = []

  // 1. Collections
  collections.forEach(col => {
    if (col.name.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: col.id,
        type: 'collection',
        title: col.name,
        subtitle: 'Collection',
        action: () => {
          onSelectTab('client')
          setIsOpen(false)
        }
      })
    }

    // 2. Folders and Requests inside
    col.requests.forEach(req => {
      if (req.name.toLowerCase().includes(query.toLowerCase()) || req.url.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: req.id,
          type: 'request',
          title: req.name,
          subtitle: `${req.method} • ${req.url}`,
          action: () => {
            onSelectRequest(req)
            onSelectTab('client')
            setIsOpen(false)
          }
        })
      }
    })
  })

  // 3. Monitors
  monitors.forEach(m => {
    if (m.name.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: m.id,
        type: 'monitor',
        title: m.name,
        subtitle: `Uptime check • ${m.interval_minutes}m`,
        action: () => {
          onSelectTab('monitor')
          setIsOpen(false)
        }
      })
    }
  })

  // 4. Environments
  environments.forEach(e => {
    if (e.name.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: e.id,
        type: 'environment',
        title: e.name,
        subtitle: 'Environment Profile',
        action: () => {
          onSelectTab('env')
          setIsOpen(false)
        }
      })
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-900 bg-zinc-900/20">
          <Search className="h-5 w-5 text-zinc-500 mr-3" />
          <input 
            type="text"
            placeholder="Search request endpoints, collections, environments... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {results.map((r, idx) => (
            <div 
              key={`${r.type}-${r.id}-${idx}`}
              onClick={r.action}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900 cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-zinc-900 border border-zinc-850 text-zinc-400 group-hover:text-white rounded-lg">
                  {r.type === 'request' && <FileText className="h-4 w-4" />}
                  {r.type === 'collection' && <Layers className="h-4 w-4" />}
                  {r.type === 'monitor' && <Activity className="h-4 w-4" />}
                  {r.type === 'environment' && <Shield className="h-4 w-4" />}
                </div>

                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{r.title}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{r.subtitle}</div>
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-zinc-400">
                <span>Jump</span>
                <CornerDownLeft className="h-3 w-3" />
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-600 italic">
              {query ? 'No matching resources found' : 'Type a query to search'}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-900 text-[9px] text-zinc-500 bg-zinc-950">
          <span>Search shortcut: <kbd className="bg-zinc-900 px-1 py-0.5 rounded text-white font-mono">Ctrl+K</kbd></span>
          <span>Close: <kbd className="bg-zinc-900 px-1 py-0.5 rounded text-white font-mono">Esc</kbd></span>
        </div>

      </div>
    </div>
  )
}
