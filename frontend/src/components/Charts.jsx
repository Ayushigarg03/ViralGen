import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, ComposedChart
} from 'recharts'

// Custom sleek Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-dark-700/60 shadow-xl text-xs space-y-1">
        {label && <p className="font-bold text-slate-200 uppercase tracking-wider">{label}</p>}
        {payload.map((item, idx) => (
          <p key={idx} className="flex gap-4 justify-between items-center">
            <span className="text-slate-400 capitalize">{item.name}:</span>
            <span className="font-semibold" style={{ color: item.color || item.fill }}>{item.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// 1. BAR CHART: Campaigns per Platform
export function PlatformChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm py-10 text-center">No platform data available</div>
  }

  // Format data keys for Recharts
  const chartData = data.map(item => ({
    name: item.platform.toUpperCase(),
    Campaigns: item.total_campaigns,
    'Success Rate (%)': item.success_rate
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="platformBarGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222736" vertical={false} />
        <XAxis dataKey="name" stroke="#6c7993" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#6c7993" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Campaigns" fill="url(#platformBarGlow)" radius={[8, 8, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 2. PIE CHART: Persona Distribution
export function PersonaChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm py-10 text-center">No persona data available</div>
  }

  const chartData = data.map(item => ({
    name: item.persona.charAt(0).toUpperCase() + item.persona.slice(1),
    value: item.count
  }))

  // Indigo, Gold, Rose
  const COLORS = ['#8b5cf6', '#eab308', '#f43f5e']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(15,17,26,0.8)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#8c98ad' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// 3. LINE CHART: Daily Generation Trend
export function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm py-10 text-center">No trend data available</div>
  }

  const chartData = data.map(item => ({
    name: item.date,
    Total: item.total_generated,
    Success: item.successful,
    Failed: item.failed
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendAreaGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222736" vertical={false} />
        <XAxis dataKey="name" stroke="#6c7993" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#6c7993" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#8c98ad', paddingTop: '15px' }} />
        
        {/* Shaded Area for Total */}
        <Area type="monotone" dataKey="Total" fill="url(#trendAreaGlow)" stroke="none" />
        
        {/* Trend Lines */}
        <Line type="monotone" dataKey="Total" name="Total Generates" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="Success" name="Successful" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Failed" name="Failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// 4. BAR CHART: Keyword Frequency in Briefs (Horizontal Layout)
export function KeywordChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm py-10 text-center">No brief keyword data analyzed yet</div>
  }

  const chartData = data.map(item => ({
    name: item.keyword.toUpperCase(),
    Count: item.count
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="keywordBarGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222736" horizontal={false} />
        <XAxis type="number" stroke="#6c7993" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" stroke="#8c98ad" fontSize={10} tickLine={false} axisLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Count" fill="url(#keywordBarGlow)" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
