import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Database, Cpu, History } from 'lucide-react';
import { getModelInfo, getHistory } from '../api/client';
import type { ModelInfo, PredictionHistoryItem } from '../types';

const riskBadge = (level: string) => {
  if (level === 'High')   return 'badge-high';
  if (level === 'Medium') return 'badge-medium';
  return 'badge-low';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [info, setInfo]       = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getModelInfo(), getHistory()])
      .then(([m, h]) => { setInfo(m); setHistory(h); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topFeatures = info?.feature_importances?.slice(0, 8) ?? [];
  const maxWeight   = Math.max(...topFeatures.map(f => f.weight), 0.01);

  const highCount  = history.filter(h => h.risk_level === 'High').length;
  const totalCount = history.length;

  const cm = info?.confusion_matrix ?? [[0,0],[0,0]];
  const tn = cm[0]?.[0] ?? 0;
  const fp = cm[0]?.[1] ?? 0;
  const fn = cm[1]?.[0] ?? 0;
  const tp = cm[1]?.[1] ?? 0;

  return (
    <div className="gradient-bg min-h-screen font-inter text-white">
      {/* Header */}
      <div className="glass-card border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </button>
          <span className="font-bold text-lg">Dashboard</span>
          <button
            id="new-assessment-dash-btn"
            onClick={() => navigate('/assessment')}
            className="ml-auto btn-danger text-white text-sm font-semibold px-5 py-2 rounded-xl"
          >
            New Assessment
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Model Card ──────────────────────────────────────────────────── */}
        <motion.div
          className="glass-card rounded-2xl p-8 border border-crimson-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-crimson-500/15 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-crimson-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">XGBoost Rabies Classifier</h2>
                  <p className="text-white/35 text-xs">sklearn Pipeline · RobustScaler + OneHotEncoder</p>
                </div>
              </div>
              <p className="text-white/45 text-sm max-w-lg leading-relaxed">
                Gradient-boosted ensemble trained on 1,000 synthetic clinical records with 17 features.
                Uses ColumnTransformer preprocessing with stratified 80/20 train-test split.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Accuracy', value: info ? `${(info.accuracy * 100).toFixed(1)}%` : '—', color: 'text-green-400' },
                { label: 'AUROC',    value: info ? info.auroc.toFixed(3) : '—',                    color: 'text-blue-400' },
              ].map(item => (
                <div key={item.label} className="glass-card rounded-xl px-6 py-4 text-center min-w-[100px]">
                  <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                  <div className="text-white/30 text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Database className="w-5 h-5 text-crimson-400" />, label: 'Training Records', value: '1,000' },
            { icon: <TrendingUp className="w-5 h-5 text-blue-400" />,   label: 'Total Predictions', value: totalCount.toString() },
            { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, label: 'High Risk Cases',  value: highCount.toString() },
            { icon: <Cpu className="w-5 h-5 text-green-400" />,         label: 'Features Used',    value: '17' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="glass-card rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="mb-3">{s.icon}</div>
              <div className="text-2xl font-black mb-1">{s.value}</div>
              <div className="text-white/35 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Feature Importance Chart ──────────────────────────────────── */}
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-bold mb-6">Feature Importance (Top 8)</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={topFeatures.map(f => ({ name: f.feature.replace(/_/g, ' ').replace('num ', ''), value: +(f.weight * 100).toFixed(2) }))}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(239,68,68,0.05)' }}
                    contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, 'Importance']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {topFeatures.map((f, idx) => (
                      <Cell key={f.feature} fill={`rgba(239,68,68,${0.4 + (1 - idx / topFeatures.length) * 0.6})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* ── Confusion Matrix ─────────────────────────────────────────── */}
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="font-bold mb-6">Confusion Matrix (Test Set)</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'True Negative', val: tn, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
                { label: 'False Positive', val: fp, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                { label: 'False Negative', val: fn, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                { label: 'True Positive',  val: tp, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
              ].map(c => (
                <div key={c.label} className={`rounded-xl p-5 text-center border ${c.bg} ${c.border}`}>
                  <div className={`text-3xl font-black ${c.color}`}>{c.val}</div>
                  <div className="text-white/40 text-xs mt-1.5">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Precision', val: tp + fp > 0 ? (tp / (tp + fp) * 100).toFixed(1) + '%' : '—' },
                { label: 'Recall',    val: tp + fn > 0 ? (tp / (tp + fn) * 100).toFixed(1) + '%' : '—' },
                { label: 'F1 Score',  val: (tp + fp > 0 && tp + fn > 0) ? (2 * tp / (2 * tp + fp + fn) * 100).toFixed(1) + '%' : '—' },
              ].map(m => (
                <div key={m.label} className="flex justify-between text-white/50 border-b border-white/5 pb-1.5">
                  <span>{m.label}</span>
                  <span className="text-white font-semibold">{m.val}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Recent Predictions ──────────────────────────────────────────── */}
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Recent Predictions</h3>
            <button
              id="view-history-btn"
              onClick={() => navigate('/history')}
              className="text-crimson-400 text-sm hover:text-crimson-300 flex items-center gap-1.5 transition-colors"
            >
              <History className="w-4 h-4" /> View All
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No predictions yet. Run an assessment first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-left">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Risk</th>
                    <th className="pb-3 font-medium">Probability</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.slice(0, 5).map(h => (
                    <tr
                      key={h.id}
                      className="hover:bg-white/2 cursor-pointer transition-colors"
                      onClick={() => navigate(`/result/${h.id}`)}
                    >
                      <td className="py-3 text-white/40">#{h.id}</td>
                      <td className="py-3 font-medium">{h.patient_name}</td>
                      <td className="py-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${riskBadge(h.risk_level)}`}>{h.risk_level}</span></td>
                      <td className="py-3 text-white/60">{(h.probability * 100).toFixed(1)}%</td>
                      <td className="py-3 text-white/35">{new Date(h.created_at).toLocaleDateString()}</td>
                    </tr>
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

export default Dashboard;
