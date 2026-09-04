'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../utils/api';
import { Activity, Clock, Users, ArrowLeft, RefreshCw, Radio } from 'lucide-react';

export default function LiveQueuePage() {
  const params = useParams();
  const centreId = params.centreId;

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await apiRequest(`/api/queue/${centreId}/live`);
      if (res.data) {
        setQueueData(res.data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch live queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Live polling interval every 4 seconds
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, [centreId]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <Link
        href="/centres"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Centres</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Real-time Live Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mandi Queue Board</h1>
          <p className="text-xs text-slate-400 mt-1">Live updates synchronised across all scales and gates</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastRefreshed && (
            <span className="text-xs text-slate-400">Updated: {lastRefreshed}</span>
          )}
          <button
            onClick={fetchQueue}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Connecting to live queue...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Serving Screen */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Currently Serving
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
                Active Desk
              </span>
            </div>

            {queueData?.currentlyServing ? (
              <div className="text-center py-6">
                <span className="text-xs text-slate-400 uppercase tracking-widest block mb-2 font-medium">
                  Token Number
                </span>
                <span className="text-4xl sm:text-6xl font-mono font-black text-emerald-400 tracking-wider block mb-4">
                  {queueData.currentlyServing.tokenNumber}
                </span>

                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                    #{queueData.currentlyServing.queuePosition}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white block">
                      {queueData.currentlyServing.farmerName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Village: {queueData.currentlyServing.village || 'Registered Mandi Area'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Scale Desk Idle</h3>
                <p className="text-xs text-slate-400">
                  No farmer is currently at the scale. Next checked-in farmer will be called shortly.
                </p>
              </div>
            )}
          </div>

          {/* Queue Waiting List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Waiting in Queue</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                {queueData?.totalWaiting || 0} waiting
              </span>
            </div>

            {queueData?.waitingList && queueData.waitingList.length > 0 ? (
              <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {queueData.waitingList.map((item) => (
                  <div
                    key={item.bookingId}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                        #{item.queuePosition}
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">
                          {item.tokenNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.farmerName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Waiting
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No farmers waiting in line.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
