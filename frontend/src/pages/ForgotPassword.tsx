import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { Mail, Terminal, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await api.post('/api/v1/auth/forgot-password', { email })
      if (res.ok) {
        setSuccess('If the email is registered, a password reset link has been logged/sent.')
        setEmail('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit password reset request.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center premium-bg-texture px-4 text-zinc-800">
      

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-zinc-200/80 w-full max-w-md rounded-3xl p-8 shadow-xl shadow-zinc-500/5 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" className="h-12 w-12 shadow-sm shadow-emerald-500/5 rounded-2xl mb-4" alt="ApiNest Logo" />
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">Reset Password</h2>
          <p className="text-sm text-zinc-400 mt-1 font-medium text-center leading-relaxed">
            Enter your email address and we'll send you a link to reset your account credentials.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block px-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="flex items-center text-xs font-bold text-zinc-450 hover:text-zinc-700 transition-all gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
