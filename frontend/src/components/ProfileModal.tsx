import React, { useState } from 'react'
import { X, User, Mail, Shield, Save, Check } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

interface ProfileModalProps {
  onClose: () => void
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
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
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || data.errors?.[0] || 'Failed to update profile.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-zinc-200/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 transition-all scale-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/10">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Profile Settings</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Update your account settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-150 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-fadeIn">
              <Check className="h-4.5 w-4.5" /> Profile settings updated successfully.
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs font-bold text-rose-700 animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block px-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-500 max-w-[280px]">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] leading-relaxed font-medium">
                  Workspace Owner role assigned.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
