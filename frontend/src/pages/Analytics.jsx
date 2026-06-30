import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, CheckCircle2, Clock, Tags } from 'lucide-react'
import { PlatformChart, PersonaChart, TrendChart, KeywordChart } from '../components/Charts'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [topCampaigns, setTopCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const [summaryRes, topRes] = await Promise.all([
          axios.get('/api/analytics/summary'),
          axios.get('/api/analytics/top-campaigns?limit=10')
        ])
        setData(summaryRes.data)
        setTopCampaigns(topRes.data)
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Analyzing campaign database...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Campaign Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Deep-dive insights and performance charts derived from generated campaigns.</p>
      </div>

      {/* Grid of Platform & Persona Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform bar chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Campaigns per Platform</h3>
              <p className="text-slate-500 text-xs mt-0.5">Top performing social media spaces.</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <PlatformChart data={data?.platform_performance || []} />
          </div>
        </div>

        {/* Persona distribution pie chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Brand Persona Distribution</h3>
              <p className="text-slate-500 text-xs mt-0.5">Tone of voice alignment split.</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <PersonaChart data={data?.persona_distribution || []} />
          </div>
        </div>
      </div>

      {/* Row 2: Keyword Frequency & Daily Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Keyword frequency chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Top Brief Keywords</h3>
              <p className="text-slate-500 text-xs mt-0.5">Most common descriptive words in briefs.</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <KeywordChart data={data?.top_keywords || []} />
          </div>
        </div>

        {/* Daily Trends line chart */}
        <div className="glass-panel p-6 rounded-2xl border border-dark-800 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <LineIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Campaign Generation Trend</h3>
              <p className="text-slate-500 text-xs mt-0.5">Total processed count vs success rate over the last 30 days.</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <TrendChart data={data?.daily_trends || []} />
          </div>
        </div>
      </div>

      {/* Performance List table */}
      <div className="glass-panel p-6 rounded-2xl border border-dark-800">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Top Performance Metadata</h3>
          <p className="text-slate-500 text-xs mt-0.5">Timing analysis for your latest 10 generations.</p>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Campaign ID</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Persona</th>
                <th className="py-3 px-4">Brief Keyword</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Generation Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-900">
              {topCampaigns.map((c) => (
                <tr key={c.id} className="hover:bg-dark-900/40 transition-colors text-sm text-slate-300">
                  <td className="py-3.5 px-4 font-semibold text-slate-400">#{c.id}</td>
                  <td className="py-3.5 px-4 font-medium">{c.platform}</td>
                  <td className="py-3.5 px-4">{c.persona}</td>
                  <td className="py-3.5 px-4 truncate max-w-[200px]">{c.brief}</td>
                  <td className="py-3.5 px-4 text-center">
                    {c.status === 'SUCCESS' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Success</span>
                    ) : c.status === 'FAILED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Failed</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Running</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-100 flex items-center justify-end gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {c.generation_time_sec}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
