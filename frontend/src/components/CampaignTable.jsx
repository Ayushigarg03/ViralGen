import React, { useState } from 'react'
import { Eye, Copy, Check, FileDown, ExternalLink } from 'lucide-react'

export default function CampaignTable({ campaigns, isLoading }) {
  const [copiedId, setCopiedId] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [versions, setVersions] = useState([])
  const [rollbackLoading, setRollbackLoading] = useState(false)

  React.useEffect(() => {
    if (selectedCampaign) {
      axios.get(`http://localhost:8000/api/variants/history/${selectedCampaign.id}`)
        .then(res => setVersions(res.data))
        .catch(err => console.error(err))
    } else {
      setVersions([])
    }
  }, [selectedCampaign])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRollback = async (versionId) => {
    setRollbackLoading(true)
    try {
      const res = await axios.post(`http://localhost:8000/api/variants/rollback/${versionId}`)
      setSelectedCampaign(res.data)
      // Refresh versions
      const vRes = await axios.get(`http://localhost:8000/api/variants/history/${res.data.id}`)
      setVersions(vRes.data)
      alert("Campaign successfully rolled back to selected checkpoint version!")
    } catch (err) {
      console.error(err)
      alert("Failed to rollback campaign version.")
    } finally {
      setRollbackLoading(false)
    }
  }

  const getPlatformBadge = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">Instagram</span>
      case 'linkedin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">LinkedIn</span>
      case 'twitter':
      case 'x':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">Twitter/X</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-dark-800 text-slate-300">{platform}</span>
    }
  }

  const getPersonaBadge = (persona) => {
    switch (persona.toLowerCase()) {
      case 'professional':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Professional</span>
      case 'witty':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Witty</span>
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Urgent</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/10 text-slate-400">{persona}</span>
    }
  }

  const getStatusBadge = (status) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Success</span>
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />Failed</span>
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />Processing</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading campaigns history...</p>
      </div>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-dark-800 rounded-2xl bg-dark-900/20">
        <p className="text-slate-400">No campaigns generated yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dark-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <th className="py-4 px-4 text-center">Visual</th>
            <th className="py-4 px-4">Platform / Persona</th>
            <th className="py-4 px-4">Brief</th>
            <th className="py-4 px-4">Generated Copy</th>
            <th className="py-4 px-4 text-center">Status</th>
            <th className="py-4 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-900">
          {campaigns.map((c) => (
            <tr key={c.id} className="hover:bg-dark-900/40 transition-colors group">
              <td className="py-4 px-4 text-center align-middle">
                {c.image_url ? (
                  <div 
                    onClick={() => setSelectedCampaign(c)}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-dark-800 hover:border-brand-500/50 cursor-pointer transition-all duration-200 inline-block relative group"
                  >
                    <img 
                      src={c.image_url.startsWith('/') ? `http://localhost:8000${c.image_url}` : c.image_url} 
                      alt={c.brief} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-dark-900 border border-dark-800 flex items-center justify-center text-slate-600 font-semibold text-xs inline-block">
                    None
                  </div>
                )}
              </td>
              <td className="py-4 px-4 space-y-1.5 align-middle">
                <div>{getPlatformBadge(c.platform)}</div>
                <div>{getPersonaBadge(c.persona)}</div>
              </td>
              <td className="py-4 px-4 text-sm font-medium text-slate-200 max-w-xs align-middle">
                <p className="line-clamp-2">{c.brief}</p>
              </td>
              <td className="py-4 px-4 text-sm text-slate-400 max-w-md align-middle">
                {c.text_copy ? (
                  <div className="relative group/copy">
                    <p className="line-clamp-2 pr-8">{c.text_copy}</p>
                    <button
                      onClick={() => copyToClipboard(c.text_copy, c.id)}
                      className="absolute right-0 top-0 opacity-0 group-hover/copy:opacity-100 p-1 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded transition-opacity"
                      title="Copy text"
                    >
                      {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-600 italic">No copy generated</span>
                )}
              </td>
              <td className="py-4 px-4 text-center align-middle">
                {getStatusBadge(c.status)}
              </td>
              <td className="py-4 px-4 text-right align-middle">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedCampaign(c)}
                    className="p-2 text-slate-400 hover:text-white bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {c.image_url && (
                    <a
                      href={c.image_url.startsWith('/') ? `http://localhost:8000${c.image_url}` : c.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-lg transition-colors"
                      title="Open full image"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail Preview Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-4xl w-full rounded-2xl overflow-hidden border border-dark-800 flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Visual asset display */}
            <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[450px]">
              {selectedCampaign.image_url ? (
                <img 
                  src={selectedCampaign.image_url.startsWith('/') ? `http://localhost:8000${selectedCampaign.image_url}` : selectedCampaign.image_url} 
                  alt={selectedCampaign.brief} 
                  className="w-full h-full object-contain max-h-[500px]" 
                />
              ) : (
                <p className="text-slate-500 text-sm">No image available</p>
              )}
            </div>

            {/* Content Details display */}
            <div className="md:w-1/2 p-8 flex flex-col justify-between bg-dark-950">
              <div className="space-y-6">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block">Campaign ID #{selectedCampaign.id}</span>
                    <div className="flex gap-2 items-center">
                      {getPlatformBadge(selectedCampaign.platform)}
                      {getPersonaBadge(selectedCampaign.persona)}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCampaign(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg bg-dark-900 border border-dark-800 hover:bg-dark-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Brand Brief:</span>
                  <div className="p-3 bg-dark-900/60 border border-dark-900 rounded-xl text-slate-200 text-sm font-medium">
                    {selectedCampaign.brief}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Copy:</span>
                    {selectedCampaign.text_copy && (
                      <button
                        onClick={() => copyToClipboard(selectedCampaign.text_copy, 'modal')}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                      >
                        {copiedId === 'modal' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Text
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-4 bg-dark-900 border border-dark-850 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                    {selectedCampaign.text_copy || <span className="italic text-slate-500">Copy generation failed or is pending.</span>}
                  </div>
                </div>

                {versions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rollback Checkpoints ({versions.length}):</span>
                    <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
                      {versions.map((v) => (
                        <div key={v.id} className="p-2 border border-slate-800 rounded bg-slate-900/60 flex justify-between items-center text-xs">
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="text-[10px] text-slate-500 block">{new Date(v.created_at).toLocaleString()}</span>
                            <p className="text-slate-300 truncate italic">"{v.text_copy}"</p>
                          </div>
                          <button
                            onClick={() => handleRollback(v.id)}
                            disabled={rollbackLoading}
                            className="bg-violet-600 hover:bg-violet-750 disabled:opacity-50 text-white font-semibold px-2.5 py-1 rounded text-[10px] transition shrink-0"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-dark-900 flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="px-5 py-2.5 text-slate-300 hover:text-white border border-dark-800 hover:bg-dark-900 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
                {selectedCampaign.image_url && (
                  <a
                    href={selectedCampaign.image_url.startsWith('/') ? `http://localhost:8000${selectedCampaign.image_url}` : selectedCampaign.image_url}
                    download={`viralgen_campaign_${selectedCampaign.id}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" /> Download Ad
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
