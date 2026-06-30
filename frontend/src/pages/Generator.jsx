import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { Sparkles, Copy, Check, FileDown, CheckCircle, RefreshCw, AlertCircle, Mic } from 'lucide-react'

export default function Generator() {
  const location = useLocation()
  
  const [brief, setBrief] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [persona, setPersona] = useState('Professional')
  const [theme, setTheme] = useState('indigo')
  
  // Advanced features states
  const [template, setTemplate] = useState('square')  // square, story, banner
  const [scarcityFomo, setScarcityFomo] = useState(false)
  const [ugcStyle, setUgcStyle] = useState(false)
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [originalCampaignId, setOriginalCampaignId] = useState(null)
  
  // Voice note state
  const [voiceLoading, setVoiceLoading] = useState(false)
  
  // Status states: 'idle', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'
  const [status, setStatus] = useState('idle')
  const [jobId, setJobId] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Motion GIF view toggle
  const [viewMotion, setViewMotion] = useState(false)
  
  // Custom edit states
  const [editedCopy, setEditedCopy] = useState('')
  const [isRecompositing, setIsRecompositing] = useState(false)
  
  const pollingRef = useRef(null)

  // Handle location state import from tools dashboard
  useEffect(() => {
    if (location.state) {
      if (location.state.brief) setBrief(location.state.brief)
      if (location.state.platform) setPlatform(location.state.platform)
      if (location.state.persona) setPersona(location.state.persona)
      if (location.state.theme) setTheme(location.state.theme)
      if (location.state.competitorUrl) setCompetitorUrl(location.state.competitorUrl)
    }
  }, [location])

  const handleCopy = () => {
    const textToCopy = editedCopy || (result ? result.text_copy : '')
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleVoiceUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setVoiceLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await axios.post('http://localhost:8000/api/tools/voice-to-ad', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setBrief(res.data.extracted_brief)
      setPlatform(res.data.suggested_platform)
      setPersona(res.data.suggested_persona)
      alert("🎙️ Voice note transcribed successfully!\nText: " + res.data.transcription)
    } catch (err) {
      console.error(err)
      alert("Failed transcribing voice note.")
    } finally {
      setVoiceLoading(false)
    }
  }

  const startGeneration = async (e) => {
    e.preventDefault()
    if (!brief.trim()) return

    setStatus('PENDING')
    setResult(null)
    setEditedCopy('')
    setErrorMsg('')
    setJobId(null)
    setViewMotion(false)

    try {
      const response = await axios.post('/api/generate-content', {
        brief,
        platform,
        persona,
        theme,
        template,
        scarcity_fomo: scarcityFomo,
        ugc_style: ugcStyle,
        competitor_url: competitorUrl || null,
        original_campaign_id: originalCampaignId
      })
      
      const { job_id } = response.data
      setJobId(job_id)
      
      // Start polling
      pollJobStatus(job_id)
    } catch (err) {
      console.error(err)
      setStatus('FAILED')
      setErrorMsg(err.response?.data?.detail || 'Failed to connect to the backend generation service.')
    }
  }

  const pollJobStatus = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/job-status/${id}`)
        const { status: jobStatus, campaign } = response.data
        
        setStatus(jobStatus)
        
        if (jobStatus === 'SUCCESS') {
          setResult(campaign)
          setEditedCopy(campaign.text_copy)
          clearInterval(pollingRef.current)
        } else if (jobStatus === 'FAILED') {
          setErrorMsg('AI Engine failed to generate media. Please check API configurations.')
          clearInterval(pollingRef.current)
        }
      } catch (err) {
        console.error('Error polling status:', err)
        setStatus('FAILED')
        setErrorMsg('Network error encountered while checking task status.')
        clearInterval(pollingRef.current)
      }
    }, 2000)
  }

  const handleRecomposite = async () => {
    if (!result || !editedCopy.trim()) return
    setIsRecompositing(true)
    try {
      const response = await axios.post(`/api/recomposite/${result.id}`, {
        text_copy: editedCopy
      })
      setResult(response.data)
      setEditedCopy(response.data.text_copy)
    } catch (err) {
      console.error("Recomposite error:", err)
      alert("Failed to re-composite visual: " + (err.response?.data?.detail || "Network error occurred."))
    } finally {
      setIsRecompositing(false)
    }
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Campaign Creator</h2>
        <p className="text-slate-400 text-sm mt-1">Refine your brand copy and generate custom visuals using multi-modal AI agents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
        {/* Left Form / Progress Pane */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <form onSubmit={startGeneration} className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white">Campaign Settings</h3>
              {/* Simulated Voice note upload */}
              <label className="flex items-center gap-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs px-2.5 py-1.5 rounded-lg border border-violet-500/20 cursor-pointer transition">
                <Mic className="w-3.5 h-3.5" />
                <span>{voiceLoading ? 'Transcribing...' : '🎙️ Voice brief'}</span>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleVoiceUpload} 
                  disabled={voiceLoading}
                  className="hidden" 
                />
              </label>
            </div>
            
            {/* Brief Text Area */}
            <div className="space-y-2">
              <label htmlFor="brief" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Brand Brief</label>
              <textarea
                id="brief"
                rows={4}
                required
                disabled={status === 'PENDING' || status === 'PROCESSING'}
                placeholder="Example: lavender organic soap bar. Highlight relaxing essential oils."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all resize-none"
              />
            </div>

            {/* Platform Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Target Platform</label>
              <div className="grid grid-cols-3 gap-3">
                {['Instagram', 'LinkedIn', 'Twitter'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={status === 'PENDING' || status === 'PROCESSING'}
                    onClick={() => setPlatform(p)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      platform === p 
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300' 
                        : 'bg-dark-900/60 border-dark-800 text-slate-400 hover:border-dark-700 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Brand Persona</label>
              <div className="grid grid-cols-3 gap-3">
                {['Professional', 'Witty', 'Urgent'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={status === 'PENDING' || status === 'PROCESSING'}
                    onClick={() => setPersona(v)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      persona === v 
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300' 
                        : 'bg-dark-900/60 border-dark-800 text-slate-400 hover:border-dark-700 hover:text-slate-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Visual Style Theme</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'indigo', name: 'Indigo Glow', color: 'bg-indigo-500' },
                  { id: 'sunset', name: 'Sunset Warmth', color: 'bg-amber-500' },
                  { id: 'forest', name: 'Forest Mint', color: 'bg-teal-500' },
                  { id: 'cyberpunk', name: 'Cyberpunk Neon', color: 'bg-pink-500' },
                  { id: 'auto', name: '🧠 Auto (Palette)', color: 'bg-violet-600' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={status === 'PENDING' || status === 'PROCESSING'}
                    onClick={() => setTheme(t.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-150 ${
                      theme === t.id 
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300' 
                        : 'bg-dark-900/60 border-dark-800 text-slate-400 hover:border-dark-700 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${t.color}`} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced & Layout Options */}
            <div className="border-t border-dark-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Advanced Options</h4>
              
              {/* Layout templates Auto-resizer */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Aspect Layout</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'square', label: 'Square (1:1)' },
                    { id: 'story', label: 'Story (9:16)' },
                    { id: 'banner', label: 'Banner (16:9)' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setTemplate(sz.id)}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                        template === sz.id 
                          ? 'bg-violet-500/10 border-violet-500 text-violet-300'
                          : 'bg-dark-900 border-dark-850 text-slate-400 hover:border-dark-700'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox triggers */}
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={scarcityFomo} 
                    onChange={(e) => setScarcityFomo(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-0" 
                  />
                  <span>FOMO Scarcity Injector</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={ugcStyle} 
                    onChange={(e) => setUgcStyle(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-0" 
                  />
                  <span>UGC Style Mimic</span>
                </label>
              </div>

              {/* Competitor analysis tracker */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Competitor Reference (Optional)</span>
                <input
                  type="url"
                  placeholder="https://competitor.com/ad-landing"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={!brief.trim() || status === 'PENDING' || status === 'PROCESSING'}
              className="w-full gradient-btn py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles className="w-4.5 h-4.5" /> Generate Campaign
            </button>
          </form>

          {/* Process flow monitor */}
          {status !== 'idle' && (
            <div className="glass-panel p-6 rounded-2xl border border-dark-800 space-y-4">
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">Pipeline Monitor</h4>
              
              <div className="space-y-3.5">
                {/* 1. Job Submitted */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Campaign Job Initiated</span>
                </div>

                {/* 2. Copy/Refinement */}
                <div className="flex items-center gap-3">
                  {status === 'PENDING' ? (
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : status === 'PROCESSING' || status === 'SUCCESS' ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : status === 'FAILED' ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-dark-800 bg-dark-900" />
                  )}
                  <span className={`text-sm font-medium ${status === 'PENDING' ? 'text-brand-300' : 'text-slate-400'}`}>
                    Refining Prompt & GPT-4 Copywrite
                  </span>
                </div>

                {/* 3. Render */}
                <div className="flex items-center gap-3">
                  {status === 'PROCESSING' ? (
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : status === 'SUCCESS' ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : status === 'FAILED' ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-dark-800 bg-dark-900" />
                  )}
                  <span className={`text-sm font-medium ${status === 'PROCESSING' ? 'text-brand-300' : 'text-slate-400'}`}>
                    DALL-E Rendering & Pillow Compositing
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Output Pane */}
        <div className="lg:col-span-7 flex flex-col items-stretch">
          <div className="glass-panel rounded-2xl border border-dark-800 overflow-hidden flex flex-col flex-1 min-h-[400px] relative">
            {isRecompositing && (
              <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-200">Re-compositing visual asset...</p>
              </div>
            )}
            
            {status === 'idle' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="p-4 bg-dark-900/60 rounded-2xl border border-dark-800 text-slate-500">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Preview Panel</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-xs">Your generated text copy and customized visual asset will display here.</p>
                </div>
              </div>
            ) : status === 'PENDING' || status === 'PROCESSING' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
                <div>
                  <h4 className="font-bold text-white">Generating Campaign Asset</h4>
                  <p className="text-slate-400 text-xs mt-1">This takes about 5 to 10 seconds. We are polishing the visuals...</p>
                </div>
              </div>
            ) : status === 'FAILED' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <div>
                  <h4 className="font-bold text-white">Campaign Generation Failed</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm">{errorMsg}</p>
                </div>
              </div>
            ) : (
              // SUCCESS
              <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-dark-900 items-stretch h-full">
                {/* Visual Asset side */}
                <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[300px]">
                  {result && result.image_url ? (
                    <>
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setViewMotion(false)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            !viewMotion 
                              ? 'bg-violet-600 text-white shadow shadow-violet-500/20' 
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          Static JPG
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMotion(true)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            viewMotion 
                              ? 'bg-violet-600 text-white shadow shadow-violet-500/20' 
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          🎬 Motion GIF
                        </button>
                      </div>
                      
                      {viewMotion ? (
                        <img 
                          src={`http://localhost:8000/static/generated/${jobId}_motion.gif`} 
                          alt="motion ad" 
                          className="w-full h-full object-contain max-h-[500px]" 
                        />
                      ) : (
                        <img 
                          src={result.image_url.startsWith('/') ? `http://localhost:8000${result.image_url}` : result.image_url} 
                          alt={result.brief} 
                          className="w-full h-full object-contain max-h-[500px]" 
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs">Image loading...</span>
                  )}
                </div>
                
                {/* Styled Text side */}
                <div className="md:w-1/2 p-6 flex flex-col justify-between bg-dark-950/60">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Ad Copy Editor</span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={editedCopy}
                        disabled={isRecompositing}
                        onChange={(e) => setEditedCopy(e.target.value)}
                        rows={6}
                        className="w-full bg-dark-900 border border-dark-850 focus:border-brand-500/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all font-sans leading-relaxed resize-none"
                        placeholder="Edit ad copy here..."
                      />
                      
                      <button
                        type="button"
                        disabled={isRecompositing || !editedCopy.trim() || editedCopy === result?.text_copy}
                        onClick={handleRecomposite}
                        className="w-full py-2.5 px-3 border border-brand-500/20 hover:border-brand-500/50 bg-brand-500/5 hover:bg-brand-500/10 text-brand-400 hover:text-brand-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRecompositing ? 'animate-spin' : ''}`} />
                        Re-composite Visual
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dark-900 flex justify-end gap-3 mt-6">
                    {result && result.image_url && (
                      <a
                        href={viewMotion ? `http://localhost:8000/static/generated/${jobId}_motion.gif` : (result.image_url.startsWith('/') ? `http://localhost:8000${result.image_url}` : result.image_url)}
                        download={viewMotion ? `viralgen_motion_${result.id}.gif` : `viralgen_campaign_${result.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gradient-btn px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 w-full justify-center"
                      >
                        <FileDown className="w-4 h-4" /> Download {viewMotion ? 'Motion GIF' : 'Final JPG'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
