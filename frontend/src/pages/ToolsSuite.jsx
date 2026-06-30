import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ToolsSuite() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('competitor');
  
  // Competitor URL state
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [urlResult, setUrlResult] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);

  // Reverse brief image state
  const [imageFile, setImageFile] = useState(null);
  const [briefResult, setBriefResult] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Contextual scheduler state
  const [weatherSchedule, setWeatherSchedule] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'scheduler') {
      fetchWeatherSchedule();
    }
  }, [activeTab]);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!competitorUrl) return;
    setUrlLoading(true);
    setUrlResult(null);
    try {
      const res = await axios.post('http://localhost:8000/api/tools/competitor-analyze', {
        url: competitorUrl
      });
      setUrlResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    setBriefLoading(true);
    setBriefResult(null);
    const formData = new FormData();
    formData.append('file', imageFile);
    try {
      const res = await axios.post('http://localhost:8000/api/tools/reverse-brief', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBriefResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBriefLoading(false);
    }
  };

  const fetchWeatherSchedule = async () => {
    setWeatherLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/tools/contextual-schedule');
      setWeatherSchedule(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const importToGenerator = (suggestedBrief, suggestedPlatform, suggestedPersona, suggestedTheme) => {
    // Navigate to generator page and pass parameters via state
    navigate('/generator', {
      state: {
        brief: suggestedBrief,
        platform: suggestedPlatform,
        persona: suggestedPersona,
        theme: suggestedTheme,
        competitorUrl: competitorUrl
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">AI Tools Suite</h1>
        <p className="mt-2 text-sm text-slate-400">
          Reverse-engineer competitor styles, extract ad briefs from images, and optimize campaign schedules using weather context rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('competitor')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'competitor' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Competitor URL Analyzer
        </button>
        <button
          onClick={() => setActiveTab('reverse')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'reverse' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Reverse Brief Generator
        </button>
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'scheduler' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Contextual Ad Scheduler
        </button>
      </div>

      {/* Content wrapper */}
      <div className="p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl min-h-[300px]">
        {activeTab === 'competitor' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Competitor URL Analyzer</h2>
            <form onSubmit={handleUrlSubmit} className="flex gap-4 max-w-xl">
              <input
                type="url"
                required
                placeholder="https://competitor.com/landing-page"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 text-sm rounded-xl text-white focus:outline-none focus:border-violet-500/50"
              />
              <button
                type="submit"
                disabled={urlLoading}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition duration-150 disabled:opacity-50"
              >
                {urlLoading ? 'Scraping...' : 'Scrape & Analyze'}
              </button>
            </form>

            {urlResult && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-4 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Suggested Platform</span>
                    <span className="text-sm font-bold text-white mt-1 block">{urlResult.suggested_platform}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Brand Persona</span>
                    <span className="text-sm font-bold text-white mt-1 block">{urlResult.suggested_persona}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Visual Palette</span>
                    <span className="text-sm font-bold text-white mt-1 block capitalize">{urlResult.suggested_theme}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Copy Quality</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">Highly Viral</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Style & Font Analysis</h3>
                  <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-lg leading-relaxed border border-slate-800/40">
                    {urlResult.ad_style_analysis}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Extracted Brief</h3>
                  <div className="p-3 bg-slate-900/40 rounded-lg flex justify-between items-center border border-slate-800/40">
                    <span className="text-xs text-white italic">"{urlResult.brief}"</span>
                    <button
                      onClick={() => importToGenerator(
                        urlResult.brief, 
                        urlResult.suggested_platform, 
                        urlResult.suggested_persona, 
                        urlResult.suggested_theme
                      )}
                      className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-[11px] font-bold text-white rounded transition"
                    >
                      Use as My Brief
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reverse' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Reverse Brief Generator</h2>
            <p className="text-xs text-slate-400">
              Upload a competitor's ad creative. The AI will reverse engineer the target audience, brand copy style, and produce an optimized matching brief structure.
            </p>
            <form onSubmit={handleImageSubmit} className="flex flex-col gap-4 max-w-md">
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-xs rounded-xl text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={briefLoading}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition duration-150 disabled:opacity-50"
              >
                {briefLoading ? 'Analyzing Image...' : 'Reverse Engineer brief'}
              </button>
            </form>

            {briefResult && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image Metadata Analysis</h3>
                  <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-lg leading-relaxed border border-slate-800/40">
                    {briefResult.ad_style_analysis}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Brief Structure</h3>
                  <div className="p-3 bg-slate-900/40 rounded-lg flex justify-between items-center border border-slate-800/40">
                    <span className="text-xs text-white italic">"{briefResult.brief}"</span>
                    <button
                      onClick={() => importToGenerator(
                        briefResult.brief, 
                        briefResult.suggested_platform, 
                        briefResult.suggested_persona, 
                        briefResult.suggested_theme
                      )}
                      className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-[11px] font-bold text-white rounded transition"
                    >
                      Import to Generator
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Contextual Ad Scheduler</h2>
            <p className="text-xs text-slate-400">
              Integrates real-time weather and event API triggers to automatically schedules ad creatives.
            </p>

            {weatherLoading ? (
              <p className="text-xs text-slate-400">Fetching scheduler configurations...</p>
            ) : weatherSchedule ? (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4 max-w-xl animate-slide-up">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">API Weather State</span>
                    <h3 className="text-md font-bold text-white mt-0.5">{weatherSchedule.current_weather}</h3>
                  </div>
                  <span className="text-2xl">{weatherSchedule.current_weather === 'Sunny' ? '☀️' : weatherSchedule.current_weather === 'Rainy' ? '🌧️' : '☁️'}</span>
                </div>

                <div className="bg-violet-950/20 border border-violet-900/40 p-4 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Automated Scheduling Rule</span>
                  <p className="text-xs text-violet-300 leading-relaxed">
                    {weatherSchedule.scheduling_rule}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Visual Theme Target: <strong className="text-white capitalize">{weatherSchedule.suggested_visual_theme}</strong></span>
                  <button 
                    onClick={fetchWeatherSchedule}
                    className="text-violet-400 font-semibold hover:underline"
                  >
                    Re-simulate weather state
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
