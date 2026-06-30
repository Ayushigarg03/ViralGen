import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/generate/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('http://localhost:8000/api/generate/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`Successfully queued bulk job #${res.data.batch_id} with ${res.data.campaign_count} campaigns!`);
      setFile(null);
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed uploading bulk CSV.');
    } finally {
      setLoading(false);
    }
  };

  const viewBatchDetail = async (batchId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/generate/batch/${batchId}`);
      setSelectedBatch(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'FAILED': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'PARTIAL': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Bulk Generator</h1>
        <p className="mt-2 text-sm text-slate-400">
          Upload a product CSV to trigger mass ad variant generations via Celery workers in the background.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Upload Form Card */}
        <div className="p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Upload CSV Template</h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl border-slate-700 hover:border-violet-500/50 transition bg-slate-950/40 cursor-pointer relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-2xl mb-2">📁</span>
              <span className="text-sm font-medium text-slate-300">
                {file ? file.name : 'Select or drop CSV here'}
              </span>
              <span className="text-xs text-slate-500 mt-1">Accepts CSV up to 100 rows</span>
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Processing Upload...' : 'Launch Bulk Batch'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sample CSV Columns</h3>
            <div className="bg-slate-950/60 p-3 rounded-lg text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
              brief,platform,persona,theme,template,scarcity_fomo,ugc_style<br />
              Organic Soap,Instagram,Witty,forest,square,true,true<br />
              Modern running shoes,Twitter,Urgent,sunset,story,false,false
            </div>
          </div>
        </div>

        {/* Batches Monitoring list */}
        <div className="p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Active Bulk Batches</h2>
            <button 
              onClick={fetchBatches}
              className="p-1.5 text-xs text-slate-400 hover:text-white border border-slate-800 rounded-lg bg-slate-950/50 hover:bg-slate-950 transition"
            >
              🔄 Refresh Status
            </button>
          </div>

          {batches.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No bulk batches launched yet.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
              {batches.map((b) => (
                <div 
                  key={b.id}
                  onClick={() => viewBatchDetail(b.id)}
                  className={`p-4 border rounded-xl transition cursor-pointer ${
                    selectedBatch?.batch_id === b.id 
                      ? 'bg-violet-950/20 border-violet-500/40' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">BATCH #{b.id}</span>
                      <p className="text-xs text-slate-500 mt-0.5">Launched {new Date(b.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadgeClass(b.status)}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="block font-bold text-white text-sm">{b.total}</span>
                      <span className="text-[10px] text-slate-400">Total</span>
                    </div>
                    <div className="bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30">
                      <span className="block font-bold text-emerald-400 text-sm">{b.success}</span>
                      <span className="text-[10px] text-emerald-400">Success</span>
                    </div>
                    <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                      <span className="block font-bold text-rose-400 text-sm">{b.failed}</span>
                      <span className="text-[10px] text-rose-400">Failed</span>
                    </div>
                    <div className="bg-blue-950/20 p-2 rounded-lg border border-blue-900/30">
                      <span className="block font-bold text-blue-400 text-sm">{b.processing}</span>
                      <span className="text-[10px] text-blue-400">Active</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="block font-bold text-slate-400 text-sm">{b.pending}</span>
                      <span className="text-[10px] text-slate-500">Queued</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch detail inspect section */}
      {selectedBatch && (
        <div className="p-6 border rounded-2xl bg-slate-900/60 border-slate-800/80 backdrop-blur-xl animate-slide-up space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-md font-semibold text-white">Inspect Batch #{selectedBatch.batch_id}</h3>
              <p className="text-xs text-slate-400">Total {selectedBatch.campaigns.length} campaigns</p>
            </div>
            <button 
              onClick={() => setSelectedBatch(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Details ✖
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBatch.campaigns.map((c) => (
              <div key={c.id} className="p-4 border border-slate-800 rounded-xl bg-slate-950/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase font-semibold">
                    {c.platform}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${c.status === 'SUCCESS' ? 'text-emerald-400' : c.status === 'FAILED' ? 'text-rose-400' : 'text-blue-400'}`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{c.brief}</h4>
                
                {c.status === 'SUCCESS' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 line-clamp-2 italic">"{c.text_copy}"</p>
                    {c.image_url && (
                      <img 
                        src={`http://localhost:8000${c.image_url}`} 
                        alt="generated ad" 
                        className="w-full h-24 object-cover rounded-lg border border-slate-800"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
