import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft, ChevronRight } from 'lucide-react';
import { getHistory } from '../api/client';
import type { PredictionHistoryItem } from '../types';

const riskBadge = (level: string) => {
  if (level === 'High')   return 'badge-high';
  if (level === 'Medium') return 'badge-medium';
  return 'badge-low';
};

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gradient-bg min-h-screen font-inter text-white">
      {/* Header */}
      <div className="glass-card border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </button>
          <span className="font-bold text-lg">Prediction History</span>
          <button onClick={() => navigate(-1)} className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-white/30 text-sm">No predictions yet.</p>
              <button
                onClick={() => navigate('/assessment')}
                className="mt-6 btn-danger text-white text-sm font-bold px-6 py-2.5 rounded-xl"
              >
                Start First Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/2 text-white/30 text-left">
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Patient Name</th>
                    <th className="px-6 py-4 font-medium">Risk Level</th>
                    <th className="px-6 py-4 font-medium">Probability</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((h, i) => (
                    <motion.tr
                      key={h.id}
                      className="hover:bg-white/3 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/result/${h.id}`)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td className="px-6 py-4 text-white/35">#{h.id}</td>
                      <td className="px-6 py-4 font-semibold">{h.patient_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskBadge(h.risk_level)}`}>
                          {h.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${h.probability * 100}%`,
                                background: h.risk_level === 'High' ? '#EF4444' : h.risk_level === 'Medium' ? '#FB923C' : '#4ADE80'
                              }}
                            />
                          </div>
                          <span className="text-white/60">{(h.probability * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/35">
                        {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-crimson-400 transition-colors" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HistoryPage;
