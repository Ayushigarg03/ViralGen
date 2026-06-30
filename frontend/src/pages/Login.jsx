import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login({ setAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      // 1. Authenticate and get token
      const res = await axios.post('/api/auth/login', { email, password })
      const token = res.data.access_token
      localStorage.setItem('token', token)
      
      // Configure temporary axios header for the next request
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // 2. Fetch user profile
      const userRes = await axios.get('/api/auth/me')
      const user = userRes.data
      localStorage.setItem('user', JSON.stringify(user))

      // 3. Trigger state update
      setAuth(token, user)
      
      // 4. Redirect to dashboard
      navigate('/')
    } catch (err) {
      console.error(err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else if (err.request) {
        setError('Cannot connect to the server. Please make sure the backend server is running.')
      } else {
        setError('Login failed. Connection error or server issue. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4 relative overflow-hidden">
      {/* Dynamic Glowing background elements */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-brand-600/20 text-brand-400 rounded-2xl border border-brand-500/20 glow-pulse mb-4">
            <Zap className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to <span className="gradient-text">ViralGen AI</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">Log in to manage and build viral ad campaigns</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-dark-800 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-dark-900/60 border border-dark-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-dark-900/60 border border-dark-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all gradient-btn flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loggin in...
                </>
              ) : (
                'Sign In to Account'
              )}
            </button>
          </form>

          {/* Seperator */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-800/80"></div>
            </div>
            <span className="relative px-3 bg-dark-900 text-xs text-slate-500 uppercase tracking-widest font-semibold z-10">
              New User?
            </span>
          </div>

          {/* Navigate to Signup */}
          <div className="text-center">
            <Link
              to="/signup"
              className="text-xs text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider"
            >
              Create dynamic agent account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
