import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Brain, Shield, Zap, Database, ChevronRight, AlertCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Database className="w-6 h-6 text-crimson-500" />,
      title: 'Clinical Dataset',
      desc: '1,000 synthetic patient records with 17 clinical and epidemiological features — built on real rabies exposure protocols.',
    },
    {
      icon: <Brain className="w-6 h-6 text-crimson-500" />,
      title: 'XGBoost Classifier',
      desc: 'Gradient boosted ensemble trained with RobustScaler preprocessing, hitting ≥93% accuracy and ≥0.95 AUROC.',
    },
    {
      icon: <Zap className="w-6 h-6 text-crimson-500" />,
      title: 'Instant Report',
      desc: 'Sub-second inference delivers risk level, probability score, top causal features, and prioritised clinical actions.',
    },
  ];

  const stats = [
    { value: '93%+', label: 'Model Accuracy' },
    { value: '1,000', label: 'Training Records' },
    { value: '17', label: 'Clinical Features' },
    { value: '<1s', label: 'Inference Time' },
  ];

  return (
    <div className="gradient-bg min-h-screen font-inter text-white">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">RabiesAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white transition-colors"
            >Dashboard</button>
          </div>
          <button
            id="nav-assess-btn"
            onClick={() => navigate('/assessment')}
            className="btn-danger text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Start Assessment
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-48 pb-28 px-6">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-crimson-500/30 text-crimson-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by XGBoost ML · Research Grade
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tighter mb-6"
          >
            Rabies Risk{' '}
            <span className="bg-gradient-to-r from-crimson-400 to-red-300 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed mb-12"
          >
            A clinical decision-support system that evaluates patient exposure history,
            symptom profile, and epidemiological risk factors to deliver a precise rabies
            risk probability in under one second.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              id="hero-assess-btn"
              onClick={() => navigate('/assessment')}
              className="btn-danger text-white font-bold px-10 py-4 rounded-2xl text-lg flex items-center gap-2 justify-center"
            >
              Begin Clinical Assessment
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              id="hero-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="glass-card border border-white/10 text-white font-semibold px-10 py-4 rounded-2xl text-lg hover:border-white/25 transition-all"
            >
              View Dashboard
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <motion.section
        className="py-16 px-6 border-y border-white/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-crimson-400 mb-2">{s.value}</div>
              <div className="text-sm text-white/40 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Clinical-Grade Intelligence</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Every component is designed for accuracy, speed, and clinical relevance.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card rounded-2xl p-8 hover:border-crimson-500/20 transition-all duration-300 hover:-translate-y-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-crimson-500/10 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-white/45 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <section id="about" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              Research Validated
            </div>
            <h2 className="text-4xl font-bold mb-6">About This System</h2>
            <p className="text-white/45 leading-relaxed mb-4">
              This tool uses a supervised machine learning pipeline trained on a carefully constructed
              synthetic clinical dataset that mirrors real-world rabies exposure scenarios — including
              animal type, bite severity, wound location, PEP status, and neurological symptom profiles.
            </p>
            <p className="text-white/45 leading-relaxed mb-4">
              The XGBoost classifier achieves ≥93% accuracy and ≥0.95 AUROC through gradient-boosted
              decision trees with robust column preprocessing. Feature importances are extracted directly
              from the model and displayed on every risk report.
            </p>
            <p className="text-white/45 leading-relaxed">
              Clinical recommendations are dynamically generated based on risk tier and individual
              symptom flags, following WHO/CDC post-exposure prophylaxis guidelines.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {[
              { icon: '🦠', label: 'Exposure Analysis', desc: 'Animal type, bite severity, wound site' },
              { icon: '🧠', label: 'Symptom Profiling', desc: 'Hydrophobia, tingling, confusion, paralysis' },
              { icon: '💉', label: 'PEP Assessment', desc: 'Vaccination & prophylaxis status' },
              { icon: '📊', label: 'Risk Quantification', desc: 'Probability score + top causal features' },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-2xl p-6">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="font-semibold text-sm mb-1">{item.label}</div>
                <div className="text-white/35 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto glass-card rounded-3xl p-12 text-center border border-crimson-500/15"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <AlertCircle className="w-12 h-12 text-crimson-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-white/40 mb-8 text-lg">
            Complete a 3-step clinical assessment and receive an instant, research-backed risk report.
          </p>
          <button
            id="cta-assess-btn"
            onClick={() => navigate('/assessment')}
            className="btn-danger text-white font-bold px-12 py-4 rounded-2xl text-lg inline-flex items-center gap-2"
          >
            Start Assessment <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-white/25 text-sm">
        <p>RabiesAI · Research-Grade Clinical Decision Support · XGBoost ML Pipeline</p>
        <p className="mt-1 text-xs">For clinical reference only. Not a substitute for professional medical judgment.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
