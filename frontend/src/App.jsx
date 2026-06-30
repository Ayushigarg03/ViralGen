import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, Sparkles, History, BarChart3, Zap, UploadCloud, CheckSquare, Wrench } from 'lucide-react'
import axios from 'axios'

// Import pages
import Dashboard from './pages/Dashboard'
import Generator from './pages/Generator'
import HistoryPage from './pages/History'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BulkUpload from './pages/BulkUpload'
import Approvals from './pages/Approvals'
import ToolsSuite from './pages/ToolsSuite'

// Initialize Axios headers from localStorage if token exists
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add a response interceptor to handle 401 Unauthorized globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // If we are not already on the login or signup page, redirect to login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

function Sidebar({ user, onLogout }) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/generate', label: 'Campaign Gen', icon: Sparkles },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: UploadCloud },
    { path: '/approvals', label: 'Approvals', icon: CheckSquare },
    { path: '/tools-suite', label: 'AI Tools Suite', icon: Wrench },
    { path: '/history', label: 'History & Logs', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 }
  ]

  return (
    <aside className="w-64 glass-panel border-r border-dark-800 flex flex-col h-full z-10 shrink-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-dark-800/60 flex items-center gap-3">
        <div className="p-2 bg-brand-600/20 text-brand-400 rounded-lg border border-brand-500/20 glow-pulse">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-300">
            ViralGen AI
          </h1>
          <span className="text-[10px] text-brand-400 uppercase tracking-widest font-semibold">Ad Suite 3.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group font-medium ${
                isActive
                  ? 'bg-brand-600/90 text-white shadow-md shadow-brand-900/10'
                  : 'text-slate-400 hover:bg-dark-900 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Card & Logout */}
      {user && (
        <div className="p-4 border-t border-dark-800/60 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-sm uppercase shrink-0">
              {user.name ? user.name[0] : user.email[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name || 'Ad Manager'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-dark-900 border border-dark-800 rounded-xl hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-400 text-slate-400 text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 text-center text-[10px] text-slate-600 border-t border-dark-900">
        &copy; 2026 ViralGen AI.
      </div>
    </aside>
  )
}

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const setAuth = (token, user) => {
    setAuthToken(token)
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setAuthToken(null)
    setCurrentUser(null)
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route 
          path="/login" 
          element={
            authToken ? <Navigate to="/" replace /> : <Login setAuth={setAuth} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            authToken ? <Navigate to="/" replace /> : <Signup setAuth={setAuth} />
          } 
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            authToken ? (
              <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden font-sans">
                <Sidebar user={currentUser} onLogout={handleLogout} />
                
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-dark-950/40 relative">
                  {/* Subtle glowing backgrounds */}
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                  
                  <div className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col relative z-0">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/generate" element={<Generator />} />
                      <Route path="/bulk-upload" element={<BulkUpload />} />
                      <Route path="/approvals" element={<Approvals />} />
                      <Route path="/tools-suite" element={<ToolsSuite />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/analytics" element={<Analytics />} />
                      {/* Redirect unknown routes to Dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
