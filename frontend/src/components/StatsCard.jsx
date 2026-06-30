import React from 'react'

export default function StatsCard({ title, value, icon: Icon, description, trend, trendType }) {
  // Determine highlight colors based on trend type
  const getColors = () => {
    switch (trendType) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          text: 'text-emerald-400',
          glow: 'shadow-emerald-500/5'
        }
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          text: 'text-amber-400',
          glow: 'shadow-amber-500/5'
        }
      case 'info':
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/5'
        }
      default:
        return {
          bg: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
          text: 'text-brand-400',
          glow: 'shadow-brand-500/5'
        }
    }
  }

  const colors = getColors()

  return (
    <div className={`glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between shadow-md ${colors.glow}`}>
      <div className="space-y-2">
        <span className="text-sm font-semibold text-slate-400 block tracking-wider uppercase">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold ${colors.text}`}>
              {trend}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-400/80">{description}</p>}
      </div>
      <div className={`p-4 rounded-xl border ${colors.bg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}
