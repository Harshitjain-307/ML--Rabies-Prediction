import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { predictRisk } from '../api/client';
import type { PredictRequest } from '../types';

// ── Initial form state ─────────────────────────────────────────────────────
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

// ── Animal options with emoji ──────────────────────────────────────────────
const ANIMALS = [
  { value: 'dog',        label: '🐕 Dog' },
  { value: 'cat',        label: '🐈 Cat' },
  { value: 'monkey',     label: '🐒 Monkey' },
  { value: 'bat',        label: '🦇 Bat' },
  { value: 'wild_animal',label: '🐺 Wild Animal' },
  { value: 'none',       label: '❌ None' },
];

const SEVERITIES = ['None', 'Mild', 'Moderate', 'Severe'];
const LOCATIONS  = ['None', 'Limb', 'Trunk', 'Head/Neck'];

// ── Toggle component ─────────────────────────────────────────────────────
const Toggle: React.FC<{
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
  highRisk?: boolean;
}> = ({ id, checked, onChange, label, sublabel, highRisk }) => (
  <div
    className={`glass-card rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${
      checked
        ? highRisk
          ? 'border-crimson-500/50 bg-crimson-500/10'
          : 'border-white/20 bg-white/5'
        : 'border-white/5'
    }`}
    onClick={() => onChange(!checked)}
  >
    <div className="flex-1">
      <div className="font-medium text-sm">{label}</div>
      {sublabel && <div className="text-xs text-white/40 mt-0.5">{sublabel}</div>}
    </div>
    <label className="toggle-switch ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  </div>
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
      setError('Failed to get prediction. Is the backend running? ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Patient Info', 'Exposure Details', 'Symptoms'];
  const progressPct = ((step - 1) / 2) * 100;

  return (
    <div className="gradient-bg min-h-screen font-inter text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson-500 to-crimson-700 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </button>
          <span className="font-bold">Clinical Assessment</span>
          <span className="ml-auto text-white/40 text-sm">Step {step} of 3</span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-crimson-600 to-crimson-400"
            animate={{ width: `${progressPct + 33.33}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step labels */}
      <div className="pt-28 pb-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 justify-center mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  i + 1 === step ? 'text-crimson-400' : i + 1 < step ? 'text-white/60' : 'text-white/20'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    i + 1 === step ? 'border-crimson-500 bg-crimson-500/20 text-crimson-400' :
                    i + 1 < step  ? 'border-white/40 bg-white/10 text-white/60' :
                                    'border-white/10 text-white/20'
                  }`}>{i + 1}</div>
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-white/20' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ──── Step 1 — Patient Info ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-2">Patient Information</h2>
                  <p className="text-white/40 text-sm mb-8">Basic demographic details for the patient record.</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Patient Name</label>
                      <input
                        id="patient-name"
                        type="text"
                        placeholder="Enter patient name…"
                        value={form.patient_name}
                        onChange={(e) => set('patient_name', e.target.value)}
                        className="form-input w-full px-4 py-3 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Age</label>
                      <div className="flex items-center gap-4">
                        <input
                          id="patient-age"
                          type="range"
                          min={1} max={100}
                          value={form.age}
                          onChange={(e) => set('age', parseInt(e.target.value))}
                          className="flex-1 accent-crimson-500"
                        />
                        <span className="w-16 text-center glass-card rounded-lg py-2 text-sm font-bold text-crimson-400">
                          {form.age} yr
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-3">Gender</label>
                      <div className="flex gap-3">
                        {['male', 'female'].map((g) => (
                          <button
                            key={g}
                            id={`gender-${g}`}
                            onClick={() => set('gender', g)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                              form.gender === g
                                ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400'
                                : 'glass-card border-white/10 text-white/50 hover:border-white/20'
                            }`}
                          >
                            {g === 'male' ? '♂ Male' : '♀ Female'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── Step 2 — Exposure Details ──────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <div className="glass-card rounded-2xl p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Exposure Details</h2>
                    <p className="text-white/40 text-sm">Epidemiological exposure and wound information.</p>
                  </div>

                  {/* Animal bite toggle */}
                  <Toggle
                    id="animal-bite-toggle"
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
                    label="Animal Bite Occurred"
                    sublabel="Patient was bitten by an animal"
                  />

                  {form.animal_bite === 1 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
                      {/* Animal type */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">Animal Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {ANIMALS.filter(a => a.value !== 'none').map((a) => (
                            <button
                              key={a.value}
                              id={`animal-${a.value}`}
                              onClick={() => set('animal_type', a.value)}
                              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                                form.animal_type === a.value
                                  ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400'
                                  : 'glass-card border-white/10 text-white/50 hover:border-white/20'
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bite severity */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">Bite Severity</label>
                        <div className="grid grid-cols-4 gap-2">
                          {SEVERITIES.filter(s => s !== 'None').map((s) => (
                            <button
                              key={s}
                              id={`severity-${s.toLowerCase()}`}
                              onClick={() => set('bite_severity', s)}
                              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                form.bite_severity === s
                                  ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400'
                                  : 'glass-card border-white/10 text-white/50 hover:border-white/20'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wound location */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-3">Wound Location</label>
                        <div className="grid grid-cols-3 gap-2">
                          {LOCATIONS.filter(l => l !== 'None').map((l) => (
                            <button
                              key={l}
                              id={`location-${l.toLowerCase().replace('/', '-')}`}
                              onClick={() => set('wound_location', l)}
                              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                form.wound_location === l
                                  ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400'
                                  : 'glass-card border-white/10 text-white/50 hover:border-white/20'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Days since bite */}
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Days Since Bite</label>
                        <div className="flex items-center gap-4">
                          <input
                            id="days-since-bite"
                            type="range" min={0} max={30}
                            value={form.days_since_bite}
                            onChange={(e) => set('days_since_bite', parseInt(e.target.value))}
                            className="flex-1 accent-crimson-500"
                          />
                          <span className="w-20 text-center glass-card rounded-lg py-2 text-sm font-bold text-crimson-400">
                            {form.days_since_bite}d
                          </span>
                        </div>
                      </div>

                      {/* Binary toggles */}
                      <div className="space-y-3">
                        <Toggle id="wound-washed" checked={form.wound_washed === 1} onChange={setToggle('wound_washed')} label="Wound Was Washed" sublabel="Wound irrigated with soap/water after bite" />
                        <Toggle id="pep-started" checked={form.pep_started === 1} onChange={setToggle('pep_started')} label="PEP Already Started" sublabel="Post-exposure prophylaxis initiated" />
                      </div>
                    </motion.div>
                  )}

                  <Toggle id="vaccination-status" checked={form.vaccination_status === 1} onChange={setToggle('vaccination_status')} label="Previously Vaccinated" sublabel="Prior rabies vaccination history" />
                </div>
              </motion.div>
            )}

            {/* ──── Step 3 — Symptoms ──────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-2">Clinical Symptoms</h2>
                  <p className="text-white/40 text-sm mb-8">Toggle all symptoms currently observed in the patient.</p>

                  <div className="space-y-3">
                    <Toggle id="symptom-hydrophobia"     checked={form.hydrophobia === 1}      onChange={setToggle('hydrophobia')}      label="💧 Hydrophobia"                sublabel="Fear of water — HIGH RISK indicator" highRisk />
                    <Toggle id="symptom-fever"           checked={form.fever === 1}             onChange={setToggle('fever')}             label="🌡️ Fever"                       sublabel="Elevated body temperature" />
                    <Toggle id="symptom-tingling"        checked={form.tingling_at_wound === 1} onChange={setToggle('tingling_at_wound')} label="⚡ Tingling at Wound Site"      sublabel="Paraesthesia or itching at bite location" />
                    <Toggle id="symptom-confusion"       checked={form.confusion === 1}         onChange={setToggle('confusion')}         label="🧠 Confusion / Disorientation"  sublabel="Altered mental status" />
                    <Toggle id="symptom-muscle-spasms"   checked={form.muscle_spasms === 1}     onChange={setToggle('muscle_spasms')}     label="💪 Muscle Spasms"               sublabel="Involuntary muscle contractions" />
                    <Toggle id="symptom-paralysis"       checked={form.paralysis === 1}         onChange={setToggle('paralysis')}         label="🫀 Paralysis"                   sublabel="Dumb/paralytic form of rabies" />
                  </div>

                  {error && (
                    <div className="mt-6 p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center gap-4 mt-6">
            {step > 1 && (
              <button
                id="prev-step-btn"
                onClick={() => setStep(s => s - 1)}
                className="glass-card border border-white/10 px-6 py-3 rounded-xl text-sm font-medium hover:border-white/20 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              id={step < 3 ? 'next-step-btn' : 'submit-btn'}
              onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
              disabled={loading || (step === 1 && !form.patient_name.trim())}
              className="flex-1 btn-danger text-white font-bold py-3 rounded-xl text-sm flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
              ) : step < 3 ? (
                <>Next <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Submit Assessment <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
