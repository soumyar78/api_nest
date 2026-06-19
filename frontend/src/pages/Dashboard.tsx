import { useNavigate } from 'react-router'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useCollectionStore } from '../store/collectionStore'
import { useEnvironmentStore } from '../store/environmentStore'
import { useNotificationStore } from '../store/notificationStore'
import { useHistoryStore, type RequestHistoryItem } from '../store/historyStore'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import WorkspaceSwitcher from '../components/WorkspaceSwitcher'
import CollectionTree from '../components/CollectionTree'
import RequestBuilder from '../components/RequestBuilder'
import ResponseViewer from '../components/ResponseViewer'
import { EnvironmentSidebar, EnvironmentVariablesPanel } from '../components/EnvironmentManager'
import HistoryPanel from '../components/HistoryPanel'
import MonitorPanel from '../components/MonitorPanel'
import DocsPanel from '../components/DocsPanel'
import GlobalSearch from '../components/GlobalSearch'
import ProfileModal from '../components/ProfileModal'
import { 
  Terminal, History, Settings, LogOut, Layers, 
  Database, Play, Send, Plus, User, Activity, CheckCircle, 
  BookOpen, Bell, Search, Menu, Lock, Sparkles, HelpCircle,
  PanelLeftClose, PanelLeft
} from 'lucide-react'

type TabType = 'client' | 'env' | 'history' | 'monitor' | 'docs'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, isGuest } = useAuthStore()
  const { workspaces, fetchWorkspaces, stats, fetchStats, activeWorkspace: originalActiveWorkspace } = useWorkspaceStore()
  const { fetchCollections, activeRequest, setActiveRequest } = useCollectionStore()
  const { fetchEnvironments } = useEnvironmentStore()
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore()
  const { historyItems, fetchHistory } = useHistoryStore()

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('client')
  
  // Last request response
  const [lastResponse, setLastResponse] = useState<any>(null)
  const [isResponseLoading, setIsResponseLoading] = useState(false)

  // Reset last response when switching requests
  useEffect(() => {
    setLastResponse(null)
  }, [activeRequest?.id])

  // Notification panel open
  const [showNotifications, setShowNotifications] = useState(false)

  // Profile modal open
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Sidebar expand/collapse and responsive mobile state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Guest Mode Workspace Mock
  const guestWorkspace = { id: 'guest', name: 'Guest Session', user_id: 'guest', created_at: '', updated_at: '' }
  const activeWorkspace = isGuest ? guestWorkspace : originalActiveWorkspace

  useEffect(() => {
    if (!isGuest) {
      fetchWorkspaces()
      fetchNotifications()
    }
  }, [isGuest])

  // Refetch workspace-specific data when active workspace changes
  // Also clear the active request & response so stale requests from the
  // previous workspace don't bleed into the new one's environment context
  useEffect(() => {
    if (!isGuest && activeWorkspace) {
      setActiveRequest(null)
      setLastResponse(null)
      fetchCollections(activeWorkspace.id)
      fetchEnvironments(activeWorkspace.id)
      fetchStats(activeWorkspace.id)
      fetchHistory(activeWorkspace.id)
    }
  }, [activeWorkspace, isGuest])

  // Initialize guest request on load
  useEffect(() => {
    if (isGuest && !activeRequest) {
      setActiveRequest({
        id: 'guest-request',
        name: 'Guest Request',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
        params: [],
        body_type: 'none',
        body_content: '',
        auth_type: 'none',
        auth_config: {},
        collection_id: 'guest',
        folder_id: null,
        workspace_id: 'guest',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }, [isGuest, activeRequest, setActiveRequest])

  const handleLogout = async () => {
    try {
      if (!isGuest) {
        await api.post('/api/v1/auth/logout')
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      logout()
      navigate('/')
    }
  }

  const handleSendComplete = (response: any) => {
    setLastResponse(response)
    if (!isGuest && activeWorkspace) {
      fetchStats(activeWorkspace.id)
      fetchHistory(activeWorkspace.id)
    }
  }

  const handleNotificationRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleSelectHistoryItem = (item: RequestHistoryItem) => {
    setActiveRequest({
      id: item.request_id || `history-${item.id}`,
      name: item.name || item.url,
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

  const unreadCount = isGuest ? 0 : notifications.filter(n => !n.read).length

  // Lock feature rendering for Guest Mode
  const renderLockedFeature = (title: string, description: string, icon: any) => {
    const Icon = icon
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200/60 rounded-3xl shadow-sm max-w-xl mx-auto my-16 animate-pulse-green">
        <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-6 shadow-sm shadow-emerald-500/5">
          <Icon className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
          <h3 className="text-xl font-bold text-zinc-950">{title}</h3>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-md">{description}</p>
        <button 
          onClick={() => navigate('/signup')}
          className="px-6 py-3 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Create Free Account to Unlock</span>
        </button>
      </div>
    )
  }

  // Premium feature holding layout
  const renderPremiumFeature = (title: string, description: string, icon: any) => {
    const Icon = icon
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200/60 rounded-3xl shadow-sm max-w-xl mx-auto my-16 animate-pulse-green">
        <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-6 shadow-sm shadow-emerald-500/5">
          <Icon className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
          <h3 className="text-xl font-bold text-zinc-950">{title}</h3>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-md">{description}</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-150 uppercase tracking-wider">
          Premium Plan Coming Soon
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen premium-bg-texture text-zinc-900 overflow-hidden font-sans">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-30 md:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 md:z-10
        w-72 border-r border-zinc-200 bg-white flex flex-col overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isSidebarCollapsed ? 'md:w-0 md:-translate-x-full md:border-r-0' : 'md:w-72 md:translate-x-0'}
      `}>
        <div className="w-72 h-full flex flex-col flex-shrink-0 overflow-hidden">

          {/* ── Logo Header ─────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" className="h-8 w-8 rounded-xl shadow-sm shadow-emerald-500/10" alt="ApiNest Logo" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-sm text-zinc-950 tracking-tight">ApiNest</span>
                <span className="text-[9px] text-zinc-400 font-medium">{isGuest ? 'Guest Mode' : 'Pro'}</span>
              </div>
            </div>
            <button
              onClick={() => { setIsSidebarCollapsed(true); setIsMobileOpen(false) }}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* ── Workspace ───────────────────────────────────────── */}
          <div className="px-3 py-2.5 border-b border-zinc-100 shrink-0">
            {isGuest ? (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Guest Session</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-relaxed">
                  <button onClick={() => navigate('/signup')} className="text-emerald-600 font-bold hover:underline cursor-pointer">Create account</button> to save & sync.
                </span>
              </div>
            ) : (
              <WorkspaceSwitcher />
            )}
          </div>

          {/* ── Nav Tab Strip ───────────────────────────────────── */}
          <div className="px-3 py-2 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-50 rounded-xl p-1">
              {([
                { tab: 'client',  icon: Layers,   label: 'Client'    },
                { tab: 'env',     icon: Database,  label: 'Envs'      },
                { tab: 'history', icon: History,   label: 'History'   },
                { tab: 'monitor', icon: Activity,  label: 'Monitors'  },
                { tab: 'docs',    icon: BookOpen,  label: 'Docs'      },
              ] as const).map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  title={label}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer relative ${
                    activeTab === tab
                      ? 'bg-white text-emerald-600 shadow-sm shadow-zinc-200'
                      : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate leading-none">{label}</span>
                  {isGuest && tab !== 'client' && (
                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Scrollable Area ────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">

            {/* API Client → Collections */}
            {activeTab === 'client' && (
              <div className="flex flex-col h-full">
                {isGuest ? (
                  <div className="p-4 flex flex-col gap-3">
                    {/* Guest locked state */}
                    <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-5 text-center">
                      <Lock className="h-6 w-6 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-600 mb-0.5">Collections Locked</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                        Sign up to save requests, create collections, and sync across devices.
                      </p>
                      <button
                        onClick={() => navigate('/signup')}
                        className="text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm shadow-emerald-500/20"
                      >
                        Create Free Account
                      </button>
                    </div>
                  </div>
                ) : activeWorkspace ? (
                  <div className="p-3">
                    <CollectionTree workspaceId={activeWorkspace.id} />
                  </div>
                ) : (
                  <div className="p-4 text-xs text-zinc-400 italic text-center">No active workspace</div>
                )}
              </div>
            )}

            {/* Envs tab */}
            {activeTab === 'env' && (
              <div className="flex flex-col h-full">
                {isGuest ? (
                  <div className="p-4 flex flex-col gap-3 animate-in fade-in duration-300">
                    <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-5 text-center">
                      <Lock className="h-6 w-6 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-650 mb-0.5">Environments Locked</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                        Sign up to configure variable scopes like Dev, Staging, and Production.
                      </p>
                      <button
                        onClick={() => navigate('/signup')}
                        className="text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm shadow-emerald-500/20"
                      >
                        Create Free Account
                      </button>
                    </div>
                  </div>
                ) : activeWorkspace ? (
                  <div className="p-3">
                    <EnvironmentSidebar workspaceId={activeWorkspace.id} />
                  </div>
                ) : (
                  <div className="p-4 text-xs text-zinc-400 italic text-center">No active workspace</div>
                )}
              </div>
            )}

            {/* Other tabs — placeholder message (main panel handles content) */}
            {activeTab !== 'client' && activeTab !== 'env' && (
              <div className="p-4 flex flex-col items-center justify-center text-center gap-2 pt-10 animate-in fade-in duration-300">
                {activeTab === 'history' && <History   className="h-8 w-8 text-zinc-200" />}
                {activeTab === 'monitor' && <Activity  className="h-8 w-8 text-zinc-200" />}
                {activeTab === 'docs'    && <BookOpen  className="h-8 w-8 text-zinc-200" />}
                <p className="text-xs text-zinc-450 font-medium">
                  Content shown in<br />the main panel →
                </p>
              </div>
            )}
          </div>

          {/* ── Compact Stats Strip ─────────────────────────────── */}
          {!isGuest && (
            <div className="px-3 py-1.5 border-t border-zinc-100 flex items-center justify-between gap-1 shrink-0">
              <div className="flex items-center gap-1 min-w-0">
                <Layers className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="text-[9px] text-zinc-400 font-medium truncate">{stats?.total_collections || 0} col</span>
              </div>
              <div className="h-3 w-px bg-zinc-200 shrink-0" />
              <div className="flex items-center gap-1 min-w-0">
                <Activity className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="text-[9px] text-zinc-400 font-medium">{stats?.average_latency_ms || 0}ms</span>
              </div>
              <div className="h-3 w-px bg-zinc-200 shrink-0" />
              <div className="flex items-center gap-1 min-w-0">
                <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="text-[9px] text-emerald-600 font-bold">{stats?.success_rate_percentage || 100}%</span>
              </div>
            </div>
          )}

          {/* ── User Bar ────────────────────────────────────────── */}
          <div className="px-3 py-2.5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 group"
              onClick={() => !isGuest && setShowProfileModal(true)}
            >
              <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-[11px] text-white shadow-sm shrink-0">
                {isGuest ? 'G' : user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-zinc-800 truncate group-hover:text-zinc-950 transition-colors">
                  {isGuest ? 'Guest Session' : user?.name || 'Developer'}
                </span>
                <span className="text-[9px] text-zinc-400 truncate">
                  {isGuest ? 'In-Memory Testing' : user?.email || ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!isGuest && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  title="Profile Settings"
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleLogout}
                title={isGuest ? 'Exit Session' : 'Sign Out'}
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>


      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Premium floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 opacity-[0.03] animate-float-slow pointer-events-none hidden xl:block">
          <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15L85 75H15L50 15Z" fill="url(#dash-tri)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5"/>
            <defs>
              <linearGradient id="dash-tri" x1="50" y1="15" x2="50" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#34D399"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 opacity-[0.035] animate-float-slower pointer-events-none hidden xl:block">
          <svg width="112" height="112" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#dash-rect)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" transform="rotate(25 50 50)"/>
            <defs>
              <linearGradient id="dash-rect" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#34D399"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Header toolbar */}
        <header className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 bg-white z-10">
          <div className="flex items-center gap-3">
            {/* Desktop Toggle Button: visible only when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all hidden md:flex items-center justify-center"
                title="Expand Sidebar"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
            )}

            {/* Mobile Hamburger Toggle Button: visible on mobile and tablet */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg cursor-pointer transition-all flex md:hidden items-center justify-center"
              title="Open Sidebar"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <span className="text-sm font-bold text-zinc-950 ml-1">{activeWorkspace?.name || 'Workspace'}</span>
            
            {/* Global Search Tip */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-xl">
              <Search className="h-3 w-3 text-zinc-400" />
              <span>Press <kbd className="text-zinc-600 font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">Ctrl+K</kbd> to search everything</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Alert Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>

              {/* Notification dropdown modal list */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-20 p-4 text-center shadow-lg">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary mx-auto mb-2.5">
                    <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 mb-1">Alert Notifications</h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
                    Get real-time alerts on API downtime, performance degradation, and team activity logs.
                  </p>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-extrabold rounded-full border border-emerald-100 uppercase tracking-wider">
                    Premium Feature
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span>Status: Connected</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* 1. API Client View */}
          {activeTab === 'client' && (
            <div className="space-y-6">


              {/* 3-Column Layout: Center (RequestBuilder) & Right (ResponseViewer) */}
              {activeRequest ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                  <RequestBuilder 
                    workspaceId={activeWorkspace?.id || ''} 
                    onSendComplete={handleSendComplete} 
                  />
                  <ResponseViewer 
                    response={lastResponse} 
                    isLoading={isResponseLoading} 
                  />
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-zinc-200/60 text-center flex flex-col items-center justify-center min-h-[350px] shadow-sm shadow-zinc-500/5">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 mb-5">
                    <Play className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-1.5">Select or Create a Request</h3>
                  <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-6">
                    Choose a request from the sidebar collections tree or run a custom endpoint immediately in the request builder.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Environment Variables View */}
          {activeTab === 'env' && (
            isGuest 
              ? renderLockedFeature(
                  "Environment Profiles", 
                  "Configure variable scopes like Dev, Staging, and Production. In-line variable resolvers automatically compile URL pathways, query parameters, header contents, and request payloads.", 
                  Database
                )
              : activeWorkspace && <EnvironmentVariablesPanel workspaceId={activeWorkspace.id} />
          )}

          {/* 3. Execution History View */}
          {activeTab === 'history' && (
            isGuest 
              ? renderLockedFeature(
                  "Request History", 
                  "Save a history of sent requests, filter requests by HTTP method or response status, and review previous responses instantly.", 
                  History
                )
              : activeWorkspace && <HistoryPanel workspaceId={activeWorkspace.id} />
          )}

          {/* 4. API Monitors View */}
          {activeTab === 'monitor' && (
            renderPremiumFeature(
              "Uptime Monitors", 
              "Run recurring endpoint health checks and alert rules. Monitor API uptime percentages and latency performance in real time.", 
              Activity
            )
          )}

          {/* 5. API Documentation View */}
          {activeTab === 'docs' && (
            isGuest 
              ? renderLockedFeature(
                  "API Documentation", 
                  "Generate professional request/response references automatically from collection tree structures, complete with markdown and code snippets.", 
                  BookOpen
                )
              : activeWorkspace && <DocsPanel workspaceId={activeWorkspace.id} />
          )}


        </div>
      </main>

      {/* Global Command Center Search Overlay */}
      <GlobalSearch 
        onSelectRequest={(req) => setActiveRequest(req)} 
        onSelectTab={(tab) => setActiveTab(tab)} 
      />

      {/* Profile Modal Overlay */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

    </div>
  )
}
