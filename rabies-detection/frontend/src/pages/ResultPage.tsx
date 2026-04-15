import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { Activity, ArrowLeft, Share2, Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getPrediction } from '../api/client';
import type { PredictResponse } from '../types';

const riskColor = (level: string) => {
  if (level === 'High')   return { text: 'text-red-400',    fill: '#EF4444', badge: 'badge-high' };
  if (level === 'Medium') return { text: 'text-orange-400', fill: '#FB923C', badge: 'badge-medium' };
  return                         { text: 'text-green-400',  fill: '#4ADE80', badge: 'badge-low' };
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [result, setResult] = useState<PredictResponse | null>(
    (location.state as PredictResponse) || null
  );
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result && id) {
      getPrediction(parseInt(id))
        .then(setResult)
        .catch(() => navigate('/'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center font-inter">
        <div className="w-10 h-10 border-2 border-crimson-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const pct  = Math.round(result.final_probability * 100);
  const rc   = riskColor(result.risk_level);
  const chartData = [{ name: 'risk', value: pct, fill: rc.fill }];
  const maxFeatWeight = Math.max(...result.top_features.map(f => f.weight), 0.01);

  return (
    <div className="gradient-bg min-h-screen font-inter text-white">
      {/* Header */}
      <div className="glass-card border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </button>
          <span className="font-bold">Risk Report</span>
          <button onClick={() => navigate(-1)} className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">

        {/* ── Hero Card: Gauge + Risk ──────────────────────────────────────── */}
        <motion.div
          className="glass-card rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Radial gauge */}
            <div className="relative flex-shrink-0">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={chartData}
                    startAngle={220}
                    endAngle={-40}
                    barSize={18}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      background={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${rc.text}`}>{pct}%</span>
                  <span className="text-white/40 text-sm mt-1">probability</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-white/40 text-sm mb-2">Patient</p>
              <h1 className="text-3xl font-bold mb-4">{result.patient_name}</h1>
              <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${rc.badge} mb-6`}>
                {result.risk_level === 'High'   && <AlertTriangle className="w-4 h-4" />}
                {result.risk_level === 'Medium' && <Info className="w-4 h-4" />}
                {result.risk_level === 'Low'    && <CheckCircle className="w-4 h-4" />}
                {result.risk_level} Risk
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="text-xs text-white/35 mb-1">Symptom Boost</div>
                  <div className="text-2xl font-bold text-orange-400">
                    +{Math.round(result.symptom_boost * 100)}%
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="text-xs text-white/35 mb-1">Record ID</div>
                  <div className="text-2xl font-bold text-white/60">#{result.id}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Top Features ────────────────────────────────────────────────── */}
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-bold text-lg mb-6">Top Contributing Features</h2>
          <div className="space-y-4">
            {result.top_features.map((f, i) => (
              <div key={f.feature}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70 font-medium">{f.feature.replace(/_/g, ' ')}</span>
                  <span className={`font-bold ${rc.text}`}>{(f.weight * 100).toFixed(1)}%</span>
                </div>
                <motion.div
                  className="h-2 rounded-full bg-white/5 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${rc.fill}80, ${rc.fill})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.weight / maxFeatWeight) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Recommendations ──────────────────────────────────────────────── */}
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-bold text-lg mb-6">Clinical Recommendations</h2>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                className={`flex items-start gap-4 p-4 rounded-xl border-l-4 bg-white/2 ${
                  result.risk_level === 'High'   ? 'border-red-500' :
                  result.risk_level === 'Medium' ? 'border-orange-400' : 'border-green-500'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
              >
                <p className="text-white/80 text-sm leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Model Info Strip ─────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { label: 'ML Model', value: 'XGBoost' },
            { label: 'Accuracy', value: '93%+' },
            { label: 'AUROC',    value: '≥ 0.95' },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-xl p-4 text-center">
              <div className="text-xs text-white/35 mb-1">{item.label}</div>
              <div className="font-bold text-crimson-400">{item.value}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            id="new-assessment-btn"
            onClick={() => navigate('/assessment')}
            className="flex-1 btn-danger text-white font-bold py-3 rounded-xl text-sm"
          >
            New Assessment
          </button>
          <button
            id="view-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="glass-card border border-white/10 px-6 py-3 rounded-xl text-sm font-medium hover:border-white/20 transition-all"
          >
            Dashboard
          </button>
          <button
            id="share-btn"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="glass-card border border-white/10 px-4 py-3 rounded-xl text-sm hover:border-white/20 transition-all"
            title="Copy link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            id="export-btn"
            onClick={() => window.print()}
            className="glass-card border border-white/10 px-4 py-3 rounded-xl text-sm hover:border-white/20 transition-all"
            title="Print / Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultPage;
