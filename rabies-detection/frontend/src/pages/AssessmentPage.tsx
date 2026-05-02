import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  User, 
  ShieldAlert, 
  Stethoscope,
  Info 
} from 'lucide-react';
import { predictRisk } from '../api/client';
import type { PredictRequest } from '../types';

const INIT: PredictRequest = {
  patient_name: '',
  age: 30,
  gender: 'male',
  animal_bite: 0,
  animal_type: 'none',
  bite_severity: 'None',
  wound_location: 'None',
  days_since_bite: 0,
  vaccination_status: 0,
  wound_washed: 0,
  pep_started: 0,
  fever: 0,
  tingling_at_wound: 0,
  hydrophobia: 0,
  confusion: 0,
  muscle_spasms: 0,
  paralysis: 0,
};

const ANIMALS = [
  { value: 'dog',        label: '🐕 Dog' },
  { value: 'cat',        label: '🐈 Cat' },
  { value: 'monkey',     label: '🐒 Monkey' },
  { value: 'bat',        label: '🦇 Bat' },
  { value: 'wild_animal',label: '🐺 Wild Animal' },
];

const SEVERITIES = ['Mild', 'Moderate', 'Severe'];
const LOCATIONS  = ['Limb', 'Trunk', 'Head/Neck'];

const Toggle: React.FC<{
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
  highRisk?: boolean;
}> = ({ id, checked, onChange, label, sublabel, highRisk }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className={`p-5 rounded-2xl glass transition-all duration-300 border flex items-center justify-between cursor-pointer ${
      checked
        ? highRisk
          ? 'border-crimson-500/50 bg-crimson-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          : 'border-white/20 bg-white/5'
        : 'border-white/5 hover:border-white/10'
    }`}
    onClick={() => onChange(!checked)}
  >
    <div className="flex-1">
      <div className={`font-semibold text-sm ${checked ? 'text-white' : 'text-slate-300'}`}>{label}</div>
      {sublabel && <div className="text-xs text-slate-500 mt-1 font-light tracking-wide">{sublabel}</div>}
    </div>
    <div className="relative inline-flex items-center cursor-pointer ml-4">
      <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-crimson-500' : 'bg-slate-800'}`}>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  </motion.div>
);

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PredictRequest>(INIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof PredictRequest, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setToggle = (key: keyof PredictRequest) => (v: boolean) =>
    setForm((prev) => ({ ...prev, [key]: v ? 1 : 0 }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await predictRisk(form);
      navigate(`/result/${res.id}`, { state: res });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError('Failed to process diagnostic assessment. ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { name: 'Patient', icon: User },
    { name: 'Exposure', icon: ShieldAlert },
    { name: 'Symptoms', icon: Stethoscope }
  ];
  const progressPct = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen mesh-gradient text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-xl accent-gradient hover:shadow-glow transition-all"
            >
              <Activity className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold outfit tracking-tight">Clinical Assessment</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Diagnostic Module v2.4</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400">
              <Info className="w-3 h-3" />
              Progress: {Math.round(progressPct + 33.33)}%
            </div>
            <div className="text-crimson-500 font-bold outfit">0{step} <span className="text-slate-600">/ 03</span></div>
          </div>
        </div>
        <div className="h-[2px] bg-white/5">
          <motion.div
            className="h-full accent-gradient"
            animate={{ width: `${progressPct + 33.33}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </header>

      <main className="pt-32 px-4 max-w-3xl mx-auto">
        {/* Step Progress Visual */}
        <div className="flex items-center justify-between mb-12 px-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.name}>
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                  i + 1 === step 
                    ? 'accent-gradient shadow-glow border-transparent' 
                    : i + 1 < step 
                      ? 'bg-slate-800 border-white/10 text-slate-400' 
                      : 'bg-white/5 border-white/5 text-slate-600'
                }`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${
                  i + 1 === step ? 'text-white' : 'text-slate-600'
                }`}>{s.name}</span>
              </div>
              {i < 2 && (
                <div className="flex-1 h-[1px] bg-white/5 mx-4 mt-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: i + 1 < step ? '100%' : '0%' }}
                    className="h-full bg-crimson-500/30"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Patient Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-[32px] p-8 md:p-12"
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold outfit mb-2">Patient Metaphorics</h2>
                <p className="text-slate-400 font-light">Identify basic demographics to initialize evaluation.</p>
              </div>

              <div className="space-y-10">
                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 group-focus-within:text-crimson-400 transition-colors">Legal Full Name</label>
                  <input
                    type="text"
                    value={form.patient_name}
                    onChange={(e) => set('patient_name', e.target.value)}
                    placeholder="Enter full name..."
                    className="form-input-premium w-full px-6 py-4 rounded-2xl text-lg font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Biological Age</label>
                    <span className="text-2xl font-bold text-crimson-500 outfit">{form.age} <span className="text-sm text-slate-600">YR</span></span>
                  </div>
                  <input
                    type="range"
                    min={1} max={100}
                    value={form.age}
                    onChange={(e) => set('age', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-crimson-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Biological Gender</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        onClick={() => set('gender', g)}
                        className={`py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 border transition-all ${
                          form.gender === g
                            ? 'accent-gradient border-transparent shadow-lg text-white'
                            : 'glass border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        {g === 'male' ? 'Male Identification' : 'Female Identification'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Exposure Analysis */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-card rounded-[32px] p-8 md:p-12 space-y-10"
            >
              <div>
                <h2 className="text-3xl font-bold outfit mb-2">Exposure Vectors</h2>
                <p className="text-slate-400 font-light">Trace the incident parameters and initial interventions.</p>
              </div>

              <Toggle
                id="bite-occured"
                checked={form.animal_bite === 1}
                onChange={(v) => {
                  setToggle('animal_bite')(v);
                  if (!v) {
                    set('animal_type', 'none');
                    set('bite_severity', 'None');
                    set('wound_location', 'None');
                    set('days_since_bite', 0);
                    set('wound_washed', 0);
                    set('pep_started', 0);
                  }
                }}
                label="Animal Bite Encounter"
                sublabel="Presence of direct dermal/mucosal contact with animal saliva"
              />

              {form.animal_bite === 1 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="space-y-10 pt-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Animal Classification</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ANIMALS.map((a) => (
                        <button
                          key={a.value}
                          onClick={() => set('animal_type', a.value)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                            form.animal_type === a.value
                              ? 'bg-crimson-500/20 border-crimson-500/50 text-white'
                              : 'glass border-white/5 text-slate-500 hover:border-white/10'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Severity Tier</label>
                      <div className="flex flex-col gap-2">
                        {SEVERITIES.map((s) => (
                          <button
                            key={s}
                            onClick={() => set('bite_severity', s)}
                            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center ${
                              form.bite_severity === s
                                ? 'bg-crimson-500/20 border-crimson-500/50 text-white'
                                : 'glass border-white/5 text-slate-500 hover:border-white/10'
                            }`}
                          >
                            {s}
                            {form.bite_severity === s && <div className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Wound Mapping</label>
                      <div className="flex flex-col gap-2">
                        {LOCATIONS.map((l) => (
                          <button
                            key={l}
                            onClick={() => set('wound_location', l)}
                            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center ${
                              form.wound_location === l
                                ? 'bg-crimson-500/20 border-crimson-500/50 text-white'
                                : 'glass border-white/5 text-slate-500 hover:border-white/10'
                            }`}
                          >
                            {l}
                            {form.wound_location === l && <div className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Temporal latency</label>
                      <span className="text-xl font-bold text-crimson-500 outfit">{form.days_since_bite} <span className="text-xs text-slate-600 font-bold">DAYS AGO</span></span>
                    </div>
                    <input
                      type="range" min={0} max={30}
                      value={form.days_since_bite}
                      onChange={(e) => set('days_since_bite', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-crimson-500"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Toggle id="wash" checked={form.wound_washed === 1} onChange={setToggle('wound_washed')} label="Dermal Irrigation" sublabel="Patient performed wound washing" />
                    <Toggle id="pep" checked={form.pep_started === 1} onChange={setToggle('pep_started')} label="Prior PEP" sublabel="Prophylaxis already initiated" />
                  </div>
                </motion.div>
              )}

              <Toggle id="vax" checked={form.vaccination_status === 1} onChange={setToggle('vaccination_status')} label="Pre-exposure Immunity" sublabel="Patient has prior history of rabies vaccination" />
            </motion.div>
          )}

          {/* Step 3: Clinical Symptoms */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-[32px] p-8 md:p-12 mb-8"
            >
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold outfit mb-2">Neurological Profile</h2>
                <p className="text-slate-400 font-light">Audit for clinical signs indicating disease progression.</p>
              </div>

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Toggle highRisk id="hydro" checked={form.hydrophobia === 1} onChange={setToggle('hydrophobia')} label="Hydrophobia" sublabel="Observable fear of water" />
                  <Toggle highRisk id="confusion" checked={form.confusion === 1} onChange={setToggle('confusion')} label="Acute Confusion" sublabel="Altered neurological status" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Toggle highRisk id="spasms" checked={form.muscle_spasms === 1} onChange={setToggle('muscle_spasms')} label="Muscle Spasms" sublabel="Involuntary contractions" />
                  <Toggle highRisk id="paralysis" checked={form.paralysis === 1} onChange={setToggle('paralysis')} label="Dumb Paralysis" sublabel="Indicative of paralytic rabies" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Toggle id="fever" checked={form.fever === 1} onChange={setToggle('fever')} label="High Fever" sublabel="Elevated core temperature" />
                  <Toggle id="tingle" checked={form.tingling_at_wound === 1} onChange={setToggle('tingling_at_wound')} label="Paraesthesia" sublabel="Tingling at exposure site" />
                </div>
              </div>

              {error && (
                <div className="mt-8 p-5 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm flex items-start gap-4 animate-shake">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-8 py-4 rounded-2xl glass border border-white/5 text-slate-300 font-bold text-sm flex items-center gap-2 hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Previous Step
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
            disabled={loading || (step === 1 && !form.patient_name.trim())}
            className={`flex-1 btn-premium px-8 py-4 rounded-22xl accent-gradient text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg disabled:opacity-30 rounded-2xl ${
              loading ? 'cursor-wait' : ''
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> RUNNING CLASSIFIER...</>
            ) : step < 3 ? (
              <>CONTINUE TO NEXT PHASE <ChevronRight className="w-5 h-5" /></>
            ) : (
              <>GENERATE DIAGNOSTIC REPORT <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AssessmentPage;
