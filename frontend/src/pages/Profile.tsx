import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { User, Mail, Shield, ArrowLeft, Save, Check } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await api.patch('/api/v1/auth/profile', { name, email })
      const data = await res.json()

      if (res.ok) {
        if (user) setUser({ ...user, ...data.user })
        setSuccess(true)
      } else {
        // Show the specific error (e.g. email already taken) or first validation message
        setError(data.error || data.errors?.[0] || 'Failed to update profile.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen premium-bg-texture text-zinc-800 relative overflow-hidden font-sans p-6">
      

      {/* Premium floating geometric shapes */}
      <div className="absolute top-24 left-12 w-20 h-20 opacity-40 animate-float-slow pointer-events-none hidden md:block">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15L85 75H15L50 15Z" fill="url(#prof-tri)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5"/>
          <defs>
            <linearGradient id="prof-tri" x1="50" y1="15" x2="50" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.12)"/>
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.02)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-24 right-16 w-24 h-24 opacity-30 animate-float-slower pointer-events-none hidden md:block">
        <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#prof-rect)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" transform="rotate(15 50 50)"/>
          <defs>
            <linearGradient id="prof-rect" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.12)"/>
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.02)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-6">
        {/* Back button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-all text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xl shadow-zinc-500/5 space-y-6"
        >
          <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-xl text-white shadow-md shadow-emerald-500/10">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-950">{user?.name || 'Developer'}</h2>
              <p className="text-xs text-zinc-400 font-medium">ApiNest Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</p>
            </div>
          </div>

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <Check className="h-4.5 w-4.5" /> Profile settings updated successfully.
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block px-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
              >
                <Save className="h-4.5 w-4.5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Security / Subscription stub */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-md shadow-zinc-500/5 space-y-4"
        >
          <div className="flex items-center gap-2 text-zinc-950">
            <Shield className="h-5 w-5 text-secondary" />
            <h3 className="text-base font-bold">Workspace Role & Security</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            You are currently accessing ApiNest as the <span className="text-primary font-bold">Workspace Owner</span>. Two-factor authentication and role assignments can be configured in a subsequent phase.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
