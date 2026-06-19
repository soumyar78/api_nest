import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { 
  Terminal, Shield, Cpu, FolderTree, Database, Play, Sparkles, 
  ArrowRight, CheckCircle2, ChevronRight, Zap, RefreshCw, Eye
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loginAsGuest } = useAuthStore()

  const handleStartTesting = () => {
    loginAsGuest()
    navigate('/dashboard')
  }

  // FAQ collapse state
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "What is Guest User Mode?",
      a: "Guest User Mode lets you test APIs instantly without creating an account. Your request state, headers, and params exist only in your browser's memory and are cleared on refresh, ensuring absolute privacy."
    },
    {
      q: "How does the API Request Proxy work?",
      a: "To prevent CORS blocks from standard browser sandboxing, ApiNest routes requests through a secure proxy executor built on Rails 8, ensuring headers, cookies, and tokens are safely dispatched and returned."
    },
    {
      q: "Can I sync data across multiple devices?",
      a: "Yes! By upgrading to a free authenticated account, your collections, environments, and request histories are automatically saved and synced to our secure database."
    },
    {
      q: "Does it support Environment Variables?",
      a: "Absolutely. You can define global or environment-specific profiles (Dev, Staging, Prod) and inject variables dynamically using the double curly brace syntax like {{base_url}}."
    }
  ]

  return (
    <div className="min-h-screen premium-bg-texture text-zinc-800 relative overflow-x-hidden font-sans">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[700px] h-[700px] bg-emerald-50/50 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Premium floating geometric shapes */}
      <div className="absolute top-24 left-12 w-20 h-20 opacity-40 animate-float-slow pointer-events-none hidden md:block">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15L85 75H15L50 15Z" fill="url(#tri-g)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5"/>
          <defs>
            <linearGradient id="tri-g" x1="50" y1="15" x2="50" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.12)"/>
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.02)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-1/3 right-16 w-24 h-24 opacity-30 animate-float-slower pointer-events-none hidden md:block">
        <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="16" fill="url(#rect-g)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" transform="rotate(15 50 50)"/>
          <defs>
            <linearGradient id="rect-g" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.12)"/>
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.02)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-1/4 left-20 w-16 h-16 opacity-35 animate-float-slow pointer-events-none hidden md:block">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="35" fill="url(#circle-g)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5"/>
          <defs>
            <linearGradient id="circle-g" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)"/>
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.02)"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" className="h-9 w-9 shadow-sm shadow-emerald-500/10 rounded-xl" alt="ApiNest Logo" />
          <span className="font-extrabold text-lg text-zinc-950 tracking-tight">ApiNest</span>
        </div>
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <Link to="/dashboard" className="text-xs font-bold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-500/10">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-all">
                Sign In
              </Link>
              <button 
                onClick={handleStartTesting}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                Start Testing Free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/80 text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider mb-6"
        >
          <Sparkles className="h-3 w-3 text-emerald-600" /> 
          <span>Instant Guest Mode Active</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-950 mb-6 max-w-4xl leading-[1.08]"
        >
          API Testing <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">Made Simple</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-zinc-500 max-w-2xl mb-10 leading-relaxed font-medium"
        >
          Test, Debug, and Explore APIs in Seconds. No Installation Required. Access our seamless guest dashboard instantly, or create a free account to save collections.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-24"
        >
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleStartTesting}
                className="px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span>Start Testing Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/signup"
                className="px-7 py-3.5 bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center justify-center text-xs"
              >
                Create Free Account
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Interactive App Preview Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="bg-white border border-zinc-200 shadow-2xl rounded-3xl overflow-hidden p-3 sm:p-5"
        >
          <div className="bg-[#F8FAF8] rounded-2xl border border-zinc-200/60 overflow-hidden flex flex-col h-[400px]">
            {/* Mock Top bar */}
            <div className="h-10 border-b border-zinc-200 bg-white px-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">https://api.apinest.com/v1/preview</span>
              <div className="w-8"></div>
            </div>
            
            {/* Mock Dashboard Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-40 border-r border-zinc-200 bg-white p-3 space-y-3 hidden sm:block">
                <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-2 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider">Guest Session</span>
                  <span className="text-[7px] text-zinc-400 leading-normal">In-Memory Mode</span>
                </div>
                <div className="space-y-1">
                  <div className="h-5 bg-emerald-50 border border-emerald-100 rounded-lg w-full"></div>
                  <div className="h-5 bg-zinc-50 rounded-lg w-4/5"></div>
                  <div className="h-5 bg-zinc-50 rounded-lg w-3/4"></div>
                </div>
              </div>
              
              {/* Request Builder & Response */}
              <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Builder Panel */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-extrabold text-zinc-950">New GET Request</span>
                      <span className="text-[7px] text-zinc-400 font-mono">Unsaved</span>
                    </div>
                    <div className="flex border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
                      <span className="bg-zinc-150 text-[9px] font-black text-emerald-700 border-r border-zinc-200 px-2 py-1.5">GET</span>
                      <span className="text-[8px] text-zinc-600 px-2 py-1.5 font-mono truncate">https://api.github.com/users/octocat</span>
                    </div>
                    <div className="h-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl flex items-center justify-center">
                      <span className="text-[9px] text-zinc-450 italic">No query params configured</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleStartTesting}
                    className="w-full py-2 bg-primary text-white text-[9px] font-bold rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Click to Open Live Tester</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Response Panel */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between hidden md:flex">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                      <span className="text-[9px] font-extrabold text-zinc-450">Response:</span>
                      <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5">200 OK</span>
                      <span className="text-[8px] text-zinc-400">124 ms</span>
                    </div>
                    <pre className="bg-zinc-950 text-emerald-400 text-[8px] p-3 rounded-xl font-mono overflow-hidden h-24 select-none leading-relaxed">
                      {`{\n  "login": "octocat",\n  "id": 5832347,\n  "type": "User",\n  "site_admin": false\n}`}
                    </pre>
                  </div>
                  <div className="text-[8px] text-zinc-400 text-center font-medium">
                    Proxied through secure Rails 8 executor core
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Guest Mode Showcase Feature Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-32">
        <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="h-10 w-10 bg-emerald-100 border border-emerald-200/30 rounded-2xl flex items-center justify-center text-emerald-700">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 leading-tight">
              Test APIs Instantly. <br />
              No Sync. No Signup.
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              We believe getting started with API exploration shouldn't require logging in. Guest Mode lets you fire requests through our proxy instantly.
            </p>
            <ul className="space-y-2.5">
              {[
                "Data stored only in local client state",
                "Proxied calls bypass credentials checks",
                "Full layout access: params, headers, and code generation",
                "Convert guest session to account in one-click"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={handleStartTesting}
              className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <span>Launch Guest Session</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
              <div className="text-primary font-black text-lg mb-2">0s</div>
              <div className="text-xs font-bold text-zinc-800 mb-1">Zero Wait Time</div>
              <div className="text-[10px] text-zinc-400 leading-relaxed font-medium">Click CTA, immediately open builder. No verification mail.</div>
            </div>
            <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
              <div className="text-primary font-black text-lg mb-2">CORS</div>
              <div className="text-xs font-bold text-zinc-800 mb-1">CORS Bypassed</div>
              <div className="text-[10px] text-zinc-400 leading-relaxed font-medium">All guest API calls are proxied to avoid browser sandboxing blocks.</div>
            </div>
            <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
              <div className="text-primary font-black text-lg mb-2">100%</div>
              <div className="text-xs font-bold text-zinc-800 mb-1">Local Storage</div>
              <div className="text-[10px] text-zinc-400 leading-relaxed font-medium">Everything stays in your tab's memory. No tracking cookies.</div>
            </div>
            <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
              <div className="text-primary font-black text-lg mb-2">1-Click</div>
              <div className="text-xs font-bold text-zinc-800 mb-1">Upgrade Path</div>
              <div className="text-[10px] text-zinc-400 leading-relaxed font-medium">Sign up whenever you're ready to sync workspaces.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">Features Designed for Speed</h2>
          <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto">ApiNest provides simple, developer-friendly workflows without administrative bloat.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200/60 p-8 rounded-3xl shadow-sm">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-5 shadow-sm shadow-emerald-500/5">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-2">OAuth2 & Bearer Auth</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              Configure OAuth2 token exchanges, bearer headers, basic tokens, and custom query keys to match any public or private API schema.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/60 p-8 rounded-3xl shadow-sm">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-5 shadow-sm shadow-emerald-500/5">
              <FolderTree className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-2">Hierarchical Collections</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              Structure API requests into logical collection trees and folders. Re-order and clean up configurations to organize workflows.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/60 p-8 rounded-3xl shadow-sm">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary mb-5 shadow-sm shadow-emerald-500/5">
              <Database className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-2">Environments Variable Resolver</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              Configure env profiles (Dev/Prod) and reference them dynamically inside header keys, bodies, and paths using curly braces.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">Loved by Developers</h2>
          <p className="text-zinc-500 text-sm font-medium">Here is what early adopters are saying about our premium experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm relative">
            <p className="text-zinc-600 text-xs leading-relaxed italic mb-4 font-medium">
              "ApiNest is ridiculously fast. The Guest User Mode is a game-changer when I just want to run a quick query without signing up for yet another developer account."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">A</div>
              <div>
                <div className="text-xs font-bold text-zinc-800">Alex Rivera</div>
                <div className="text-[10px] text-zinc-400">Senior Backend Engineer, Vercel</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm relative">
            <p className="text-zinc-600 text-xs leading-relaxed italic mb-4 font-medium">
              "The design is gorgeous. It feels extremely premium and lightweight, reminding me of Notion and Linear. It has completely replaced other bloated clients for me."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">S</div>
              <div>
                <div className="text-xs font-bold text-zinc-800">Sarah Chen</div>
                <div className="text-[10px] text-zinc-400">Lead Full-Stack Developer, Stripe</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 mb-32">
        <h2 className="text-2xl font-extrabold text-center text-zinc-950 mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left p-4.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-zinc-400 text-base font-medium">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-4.5 pb-4.5 text-xs text-zinc-550 leading-relaxed font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-zinc-150 text-center space-y-2">
        <p className="text-zinc-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} ApiNest SaaS Platform. All rights reserved.
        </p>
        <p className="text-zinc-550 text-[11px] font-semibold">
          Developed and managed by{' '}
          <a 
            href="https://codewithsoumya.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:text-emerald-700 underline underline-offset-4 decoration-primary/30 hover:decoration-emerald-700/60 transition-all font-bold"
          >
            codewithsoumya.com
          </a>
        </p>
      </footer>
    </div>
  )
}
