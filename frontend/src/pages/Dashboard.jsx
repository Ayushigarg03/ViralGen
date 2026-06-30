import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Sparkles, Files, Calendar, CheckCircle2, Clock } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import CampaignTable from '../components/CampaignTable'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_campaigns: 0,
    today_count: 0,
    success_rate: 0,
    avg_gen_time_seconds: 0
  })
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        // Fetch analytics summary & top campaigns in parallel
        const [summaryRes, topRes] = await Promise.all([
          axios.get('/api/analytics/summary'),
          axios.get('/api/analytics/top-campaigns?limit=5')
        ])
        
        setStats(summaryRes.data)
        setRecentCampaigns(topRes.data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time performance analytics of your generative campaigns.</p>
        </div>
        <Link 
          to="/generate" 
          className="gradient-btn px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Generate New Campaign
        </Link>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Campaigns"
          value={stats.total_campaigns}
          icon={Files}
          description="Total generated social copies"
          trendType="brand"
        />
        <StatsCard 
          title="Today's Campaigns"
          value={stats.today_count}
          icon={Calendar}
          description="Campaigns processed today"
          trendType="info"
        />
        <StatsCard 
          title="Success Rate"
          value={`${stats.success_rate}%`}
          icon={CheckCircle2}
          description="Successful generation ratio"
          trendType="success"
        />
        <StatsCard 
          title="Avg Gen Time"
          value={`${stats.avg_gen_time_seconds}s`}
          icon={Clock}
          description="Average response speed"
          trendType="warning"
        />
      </div>

      {/* Recent Campaign Log list */}
      <div className="glass-panel p-6 rounded-2xl border border-dark-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Generations</h3>
            <p className="text-slate-400 text-xs mt-0.5">Your latest 5 multi-modal assets.</p>
          </div>
          <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300 font-bold tracking-wide uppercase">
            View All Logs &rarr;
          </Link>
        </div>
        
        <CampaignTable campaigns={recentCampaigns} isLoading={isLoading} />
      </div>
    </div>
  )
}
