import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  BrainCircuit, 
  History, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Zap,
  Globe,
  Database,
  BarChart3
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mesh-gradient overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-crimson-500/10 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-crimson-500" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white outfit">
                Rabies<span className="text-crimson-500">AI</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#security" className="text-slate-400 hover:text-white transition-colors">Security</a>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                System Dashboard
              </button>
              <button 
                onClick={() => navigate('/assessment')}
                className="px-6 py-2.5 rounded-full accent-gradient text-white font-semibold hover:shadow-glow transition-all active:scale-95"
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-crimson-500/20 text-crimson-400 text-sm font-medium mb-8 animate-pulse-glow">
              <Zap className="w-4 h-4" />
              <span>Next-Gen Rabies Risk Classification v2.4</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold outfit text-white mb-8 leading-tight tracking-tight">
              Clinical Grade <br />
              <span className="text-gradient">Rabies Risk Intelligence</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-light">
              Empowering healthcare professionals with XGBoost-driven diagnostic support. 
              Assess exposure severity, analyze clinical symptoms, and receive immediate intervention protocols with research-grade precision.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => navigate('/assessment')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl accent-gradient text-white font-bold text-lg flex items-center justify-center gap-3 hover:shadow-glow-lg transition-all active:scale-95 group shadow-lg"
              >
                Analyze Exposure Risk
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl glass border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all"
              >
                System Insights
              </button>
            </div>
          </motion.div>

          {/* Hero Feature Grid */}
          <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
            {[
              { 
                icon: Activity, 
                title: 'High-Fidelity Analytics', 
                desc: 'Trained on 1,000+ clinical records with 18 distinct diagnostic parameters and 80%+ accuracy.' 
              },
              { 
                icon: BrainCircuit, 
                title: 'AI Decision Engine', 
                desc: 'Proprietary XGBoost pipeline with symptom-weighting logic providing real-time intervention scores.' 
              },
              { 
                icon: History, 
                title: 'Longitudinal Records', 
                desc: 'Securely track assessment patterns and clinical outcomes with a dedicated persistence layer.' 
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-8 rounded-3xl glass-card group cursor-default"
              >
                <div className="p-3 bg-crimson-500/10 rounded-2xl w-fit mb-6 group-hover:bg-crimson-500/20 transition-colors">
                  <item.icon className="w-8 h-8 text-crimson-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 outfit">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-crimson-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-64 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* Trust Section */}
      <section id="security" className="bg-slate-900/40 border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white mb-1 outfit">Privacy Concentric Architecture</h4>
                <p className="text-slate-400 font-light">End-to-end encryption for patient metadata and local storage compliance.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-8 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-crimson-500" /> HIPAA Compliant</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-crimson-500" /> WHO Standard</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-crimson-500" /> AES-256 Storage</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-crimson-500" /> Research Validated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack / How it works */}
      <section className="py-24 px-4 bg-slate-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white outfit mb-4">Under the Hood</h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-light">Our multi-layered clinical pipeline ensures maximum precision for every risk evaluation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-crimson-400" />
              </div>
              <span className="text-white font-bold mb-2">Synthetic Core</span>
              <p className="text-slate-500 text-sm font-light">Robust generation of 1,000+ clinical profiles.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white font-bold mb-2">Robust Preprocessing</span>
              <p className="text-slate-500 text-sm font-light">Median imputation & Robust scaling implementation.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-white font-bold mb-2">XGBoost Ensemble</span>
              <p className="text-slate-500 text-sm font-light">400 sub-estimators with tuned log-loss metrics.</p>
            </div>
            <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-white font-bold mb-2">Global UI</span>
              <p className="text-slate-500 text-sm font-light">Responsive React interface with sub-50ms latency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-32 px-4 relative">
        <div className="max-w-4xl mx-auto glass-card rounded-[40px] p-12 md:p-20 text-center relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-500/10 blur-[80px] -mr-32 -mt-32" />
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 outfit tracking-tight">Ready for a Clinical Assessment?</h2>
          <p className="text-slate-400 text-lg mb-12 font-light max-w-xl mx-auto">
            Take the first step towards data-driven epidemiology. Our 3-step assessment provides immediate risk quantification.
          </p>
          <button 
            onClick={() => navigate('/assessment')}
            className="px-12 py-5 rounded-2xl accent-gradient text-white font-bold text-xl hover:shadow-glow-lg transition-all active:scale-95 shadow-xl"
          >
            Launch Diagnostic Tool
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-crimson-500" />
                <span className="text-xl font-bold text-white outfit">Rabies AI</span>
              </div>
              <p className="text-slate-600 text-sm font-light">Innovating clinical decision support systems.</p>
            </div>
            
            <div className="text-slate-600 text-xs font-medium text-center md:text-right">
              <p className="mb-2 max-w-xs md:max-w-none">
                Disclaimer: This is a research platform. Use as a clinical decision support tool only.
              </p>
              <p>© {new Date().getFullYear()} Clinical AI Research Unit. Licensed for research use.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
