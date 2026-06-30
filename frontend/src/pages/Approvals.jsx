import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Approvals() {
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingCampaigns();
  }, []);

  const fetchPendingCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/history');
      // Filter for campaigns that need approval
      const pending = res.data.filter(c => c.approval_status === 'PENDING_APPROVAL' && c.status === 'SUCCESS');
      setPendingCampaigns(pending);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setVariants([]);
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:8000/api/variants/${campaign.id}`);
      setVariants(res.data);
    } catch (err) {
      setError('Failed fetching campaign A/B variants.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (variantId) => {
    try {
      await axios.post(`http://localhost:8000/api/variants/approve/${variantId}`);
      setSelectedCampaign(null);
      setVariants([]);
      fetchPendingCampaigns();
    } catch (err) {
      setError('Failed to approve variant.');
    }
  };

  const getCTRColorClass = (ctr) => {
    if (ctr >= 2.5) return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
    if (ctr >= 2.0) return 'text-blue-400 bg-blue-950/20 border-blue-900/30';
    return 'text-slate-400 bg-slate-900/40 border-slate-800';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Approvals Manager</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review and approve generated A/B variants, analyze estimated performance metrics, and publish to social channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List of Pending Campaigns */}
        <div className="lg:col-span-1 p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-white">Pending Approval ({pendingCampaigns.length})</h2>
          
          {pendingCampaigns.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No campaigns awaiting approval.</p>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {pendingCampaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectCampaign(c)}
                  className={`p-4 border rounded-xl transition cursor-pointer text-left ${
                    selectedCampaign?.id === c.id
                      ? 'bg-violet-950/20 border-violet-500/40'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase font-semibold">
                      {c.platform}
                    </span>
                    <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{c.brief}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">"{c.text_copy}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Variant Inspect Panel */}
        <div className="lg:col-span-2 p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl">
          {selectedCampaign ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">
                    A/B VARIANT GENERATOR
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedCampaign.brief}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear Selection ✖
                </button>
              </div>

              {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

              {loading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading variant variations...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((v) => (
                    <div 
                      key={v.id} 
                      className={`p-5 border rounded-xl bg-slate-950/50 flex flex-col justify-between space-y-4 transition ${
                        v.is_primary ? 'border-violet-500/30 shadow-violet-950/10' : 'border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCTRColorClass(v.predicted_ctr)}`}>
                            Est. CTR: {v.predicted_ctr}%
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                            Readability: {v.readability_score}FRE
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{v.text_copy}"
                        </p>

                        {v.image_url && (
                          <div className="relative group overflow-hidden rounded-lg border border-slate-800">
                            <img 
                              src={`http://localhost:8000${v.image_url}`} 
                              alt="variant mock" 
                              className="w-full h-32 object-cover transition duration-300 group-hover:scale-105"
                            />
                            {/* Motion GIF Play icon indicator */}
                            <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center pointer-events-none">
                              <span className="text-2xl drop-shadow">🎬</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleApprove(v.id)}
                        className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition ${
                          v.is_primary 
                            ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {v.is_primary ? 'Approved (Primary)' : 'Approve & Publish'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-32 text-center text-slate-500 space-y-2">
              <span className="text-3xl block">👁‍🗨</span>
              <p className="text-sm font-medium">Select a campaign from the left sidebar to review variations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
