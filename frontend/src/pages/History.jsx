import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FileSpreadsheet, Search, ChevronLeft, ChevronRight, X, Cloud } from 'lucide-react'
import CampaignTable from '../components/CampaignTable'

export default function History() {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters state
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('All')
  const [persona, setPersona] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Google Sheets Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const syncGoogleSheets = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    try {
      const response = await axios.post('/api/sync-google-sheets')
      setSyncStatus({ type: 'success', text: response.data.message })
      setTimeout(() => setSyncStatus(null), 5000)
    } catch (err) {
      console.error(err)
      setSyncStatus({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to sync to Google Sheets. Verify Webhook configuration.' 
      })
      setTimeout(() => setSyncStatus(null), 7000)
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const params = {
        page,
        limit: 10
      }
      
      if (search.trim()) params.search = search
      if (platform !== 'All') params.platform = platform
      if (persona !== 'All') params.persona = persona
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await axios.get('/api/history', { params })
      const { campaigns: list, total, pages } = response.data
      
      setCampaigns(list)
      setTotalItems(total)
      setTotalPages(pages)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger fetch when filters or page changes
  useEffect(() => {
    fetchHistory()
  }, [page, platform, persona, startDate, endDate])

  // Debounced search or explicit trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHistory()
  }

  const resetFilters = () => {
    setSearch('')
    setPlatform('All')
    setPersona('All')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const exportExcel = async () => {
    try {
      const response = await axios.get('/api/export-excel', {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate clean filename matching backend timestamp format
      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '')
      link.setAttribute('download', `viralgen_campaigns_${timestamp}.xlsx`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export Excel report:', err)
      alert('Failed to generate and download Excel report. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Campaign Logs</h2>
          <p className="text-slate-400 text-sm mt-1">Review, filter, and export the complete history of generated ad content.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={syncGoogleSheets}
            disabled={isSyncing}
            className="px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold border border-dark-700 bg-dark-900 hover:bg-dark-850 text-slate-200 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Cloud className={`w-4.5 h-4.5 ${isSyncing ? 'animate-pulse text-brand-400' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Google Sheets'}
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="gradient-btn px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className={`p-4 rounded-xl border text-sm font-semibold ${
          syncStatus.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        } animate-in fade-in slide-in-from-top-4 duration-200`}>
          {syncStatus.text}
        </div>
      )}

      {/* Filter Row Form */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Keyword Search */}
          <div className="space-y-1.5 col-span-1 lg:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by brief keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Platform Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Platform</label>
            <select
              value={platform}
              onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
              className="w-full bg-dark-900 border border-dark-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 cursor-pointer"
            >
              <option value="All">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter/X</option>
            </select>
          </div>

          {/* Persona Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Brand Persona</label>
            <select
              value={persona}
              onChange={(e) => { setPersona(e.target.value); setPage(1); }}
              className="w-full bg-dark-900 border border-dark-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 cursor-pointer"
            >
              <option value="All">All Personas</option>
              <option value="Professional">Professional</option>
              <option value="Witty">Witty</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Submit Search Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" /> Filter Logs
            </button>
          </div>
        </div>

        {/* Date Filter Row + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-dark-900/60">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-dark-900 border border-dark-800 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-brand-500/50 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-dark-900 border border-dark-800 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-brand-500/50 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        </div>
      </form>

      {/* Main Campaign table container */}
      <div className="glass-panel p-6 rounded-2xl border border-dark-800">
        <CampaignTable campaigns={campaigns} isLoading={isLoading} />
        
        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-dark-900">
            <span className="text-xs text-slate-400">
              Showing page <b>{page}</b> of <b>{totalPages}</b> ({totalItems} total campaigns)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-2 bg-dark-900 hover:bg-dark-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-dark-800 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 bg-dark-900 hover:bg-dark-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-dark-800 text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
