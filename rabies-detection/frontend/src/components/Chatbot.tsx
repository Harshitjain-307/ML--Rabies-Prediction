import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatbotProps {
  /** Pass the current result context so the bot can give patient-specific advice */
  riskContext?: {
    riskLevel?: string;
    probability?: number;
    patientName?: string;
    recommendations?: string[];
  };
}

// ── Clinical Knowledge Base ───────────────────────────────────────────────────
const KNOWLEDGE: Array<{
  patterns: RegExp[];
  answer: (ctx?: ChatbotProps['riskContext']) => string;
}> = [
  {
    patterns: [/pep|post.?exposure|prophylax/i],
    answer: () =>
      `**Post-Exposure Prophylaxis (PEP)** involves:\n\n1. **Immediate wound washing** — soap & water for ≥15 min\n2. **Day 0** — First rabies vaccine dose + Rabies Immunoglobulin (RIG) infiltrated around the wound\n3. **Day 3, 7, 14** — Additional vaccine doses\n4. **Day 28** — Final dose for immunocompromised patients\n\n⚠️ PEP is nearly 100% effective if started before symptoms appear. Never delay!`,
  },
  {
    patterns: [/rig|immunoglobulin/i],
    answer: () =>
      `**Rabies Immunoglobulin (RIG)** provides immediate passive immunity:\n\n- Dose: **20 IU/kg** body weight (human RIG) or **40 IU/kg** (equine RIG)\n- As much as anatomically feasible is infiltrated into and around the wound\n- Remainder given IM at a site distant from vaccine\n- Must be given on Day 0 — **never beyond 7 days** after first vaccine dose`,
  },
  {
    patterns: [/wound|wash|clean|irrigat/i],
    answer: () =>
      `**Wound First Aid — Critical Steps:**\n\n1. 🚿 Wash vigorously with **soap and running water for 15+ minutes**\n2. Apply **70% alcohol or povidone-iodine** antiseptic\n3. Do NOT suture the wound immediately (allows drainage)\n4. If suturing is needed, do it loosely after RIG infiltration\n5. Consider **tetanus prophylaxis** as well\n\nProper wound washing alone reduces rabies risk by up to 50%.`,
  },
  {
    patterns: [/hydrophobi|water|swallow/i],
    answer: () =>
      `**Hydrophobia** (fear of water) is a hallmark of **clinical encephalitic rabies**.\n\n🚨 If hydrophobia is present:\n- Rabies has likely progressed to symptomatic stage\n- Survival is extremely rare without aggressive ICU support\n- **Milwaukee Protocol** (induced coma) has shown limited success in select cases\n- Palliative / supportive care should be discussed with family\n- Immediate isolation and barrier nursing are essential`,
  },
  {
    patterns: [/symptom|sign|what.*(look|watch)|early/i],
    answer: () =>
      `**Rabies Symptom Progression:**\n\n🟡 **Prodromal (2–10 days):** fever, headache, fatigue, tingling/pain at wound site\n\n🟠 **Acute Neurological Phase:**\n- *Furious form:* hydrophobia, aerophobia, agitation, hallucinations\n- *Paralytic form:* ascending paralysis (like Guillain-Barré)\n\n🔴 **Coma & Death:** typically within 7–14 days of symptom onset\n\n⚡ Incubation period: **2 weeks – 3 months** (can be up to 1 year)`,
  },
  {
    patterns: [/dog|cat|bat|monkey|wild|animal.*type/i],
    answer: () =>
      `**Animal Risk Classification:**\n\n🔴 **High Risk:** Bats (even without visible bite), foxes, raccoons, skunks, wild carnivores\n🟠 **Moderate Risk:** Dogs, cats (especially stray/unvaccinated)\n🟡 **Lower Risk:** Monkeys (still require full PEP assessment)\n\n🐕 Dogs account for **>99% of human rabies deaths** globally.\n🦇 Bat exposure always warrants PEP evaluation — minor scratches are often missed.`,
  },
  {
    patterns: [/vacc|immuniz|prevent/i],
    answer: () =>
      `**Rabies Vaccination:**\n\n💉 **Pre-Exposure Prophylaxis (PrEP):** Days 0, 7, 21/28 — for vets, lab workers, travelers to endemic areas\n\n💉 **Post-Exposure (PEP):** As above — never delay if bitten by a suspected animal\n\n✅ **Previously vaccinated patients** need only 2 booster doses (days 0 & 3) — no RIG required\n\nVaccine brands: Verorab, Rabipur, Imovax — all WHO-approved cell culture vaccines`,
  },
  {
    patterns: [/high.?risk|danger|critical|urgent|emergency/i],
    answer: (ctx) => {
      const base = `**High Risk Protocol:**\n\n🚨 Immediate actions required:\n1. Administer RIG + first vaccine dose **NOW**\n2. Transport to emergency department\n3. Thorough wound debridement\n4. Neurological examination\n5. Report to public health authority\n6. Animal quarantine/testing if possible`;
      if (ctx?.riskLevel === 'High') {
        return `${base}\n\n⚠️ Patient **${ctx.patientName ?? ''}** has a ${((ctx.probability ?? 0) * 100).toFixed(0)}% computed risk — all above steps apply immediately.`;
      }
      return base;
    },
  },
  {
    patterns: [/medium.?risk|moderate|watch/i],
    answer: (ctx) => {
      const base = `**Medium Risk Protocol:**\n\n1. Begin PEP vaccine series (days 0, 3, 7, 14)\n2. Thorough wound irrigation\n3. Monitor for neurological symptoms daily\n4. Animal surveillance — 10-day observation if dog/cat\n5. Follow-up appointment in 48–72 hours`;
      if (ctx?.riskLevel === 'Medium') {
        return `${base}\n\n📋 Patient **${ctx.patientName ?? ''}** scored ${((ctx.probability ?? 0) * 100).toFixed(0)}% — medium-tier protocol applies.`;
      }
      return base;
    },
  },
  {
    patterns: [/low.?risk|safe|minor|reassur/i],
    answer: (ctx) => {
      const base = `**Low Risk Assessment:**\n\n✅ Immediate hospitalization likely not needed, but:\n1. Clean the wound thoroughly\n2. Apply antiseptic\n3. Document the exposure incident\n4. Observe patient for 14 days\n5. Consider PrEP if in a high-risk occupation\n6. Seek care immediately if any symptoms develop`;
      if (ctx?.riskLevel === 'Low') {
        return `${base}\n\n🟢 Patient **${ctx.patientName ?? ''}** scored ${((ctx.probability ?? 0) * 100).toFixed(0)}% — follow standard low-risk wound care.`;
      }
      return base;
    },
  },
  {
    patterns: [/next.?step|what.*do|should.*do|recommend|advice|suggest/i],
    answer: (ctx) => {
      if (!ctx?.riskLevel) {
        return `To get personalised next-step recommendations, please complete a **Clinical Assessment** first.\n\nGeneral advice:\n- If bitten → wash wound immediately & seek medical care\n- If symptomatic (fever, tingling, hydrophobia) → go to ER now\n- If unsure → always err on the side of PEP`;
      }
      const recs = ctx.recommendations?.slice(0, 3).join('\n') ?? '';
      return `**Next Steps for ${ctx.patientName ?? 'this patient'} (${ctx.riskLevel} Risk, ${((ctx.probability ?? 0) * 100).toFixed(0)}%):**\n\n${recs}\n\n💬 Ask me about any specific step for more details!`;
    },
  },
  {
    patterns: [/diagnos|model|accuracy|xgboost|ml|machine.?learning|how.*work/i],
    answer: () =>
      `**About the AI Model:**\n\nThis tool uses an **XGBoost classifier** trained on 1,000 synthetic clinical records:\n\n- **Preprocessing:** RobustScaler (numerical) + OneHotEncoder (categorical)\n- **Features:** 17 clinical variables including animal type, wound severity, symptoms\n- **Performance:** ≥93% accuracy, ≥0.95 AUROC on hold-out test set\n- **Output:** Calibrated probability score + feature attributions\n\n⚠️ For clinical use only — not a substitute for specialist judgment.`,
  },
  {
    patterns: [/incubat|how.?long|time|period/i],
    answer: () =>
      `**Rabies Incubation Period:**\n\n- Typical: **2–12 weeks**\n- Range: 4 days to several years (rare)\n- Shorter incubation: bites to head/neck or multiple severe wounds\n- Longer incubation: wounds on extremities, lower viral inoculum\n\nThe virus travels along peripheral nerves to the brain — this determines the timeline. Wound proximity to the brain is the primary determinant.`,
  },
  {
    patterns: [/hello|hi|hey|start|help|what.*can|who.*you/i],
    answer: () =>
      `Hello! I'm **RabiesAI Assistant** 🤖\n\nI can help you with:\n\n- 💉 PEP protocol and vaccine schedules\n- 🩹 Wound care and first aid steps\n- ⚠️ Risk-specific next steps (after assessment)\n- 🐕 Animal risk classification\n- 🧠 Neurological symptoms and clinical progression\n- 📊 Understanding the AI model\n\nWhat would you like to know?`,
  },
];

const FALLBACK = `I'm not sure about that specific query. Try asking about:\n\n- **PEP protocol**\n- **Wound care**\n- **Risk level next steps**\n- **Animal risk classification**\n- **Symptom progression**\n- **How the AI model works**`;

function getBotResponse(query: string, ctx?: ChatbotProps['riskContext']): string {
  for (const entry of KNOWLEDGE) {
    if (entry.patterns.some((p) => p.test(query))) {
      return entry.answer(ctx);
    }
  }
  return FALLBACK;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="ml-4 list-disc text-white/80 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^[-•]\s/, '') }} />;
    }
    if (/^\d+\.\s/.test(line)) {
      return <li key={i} className="ml-4 list-decimal text-white/80 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^\d+\.\s/, '') }} />;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-white/80 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine }} />;
  });
}

// ── Chatbot Component ─────────────────────────────────────────────────────────
const Chatbot: React.FC<ChatbotProps> = ({ riskContext }) => {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'bot',
      text: `Hello! I'm **RabiesAI Assistant** 🤖\n\nAsk me about PEP protocols, wound care, risk-specific next steps, or anything rabies-related!\n\nYou can also ask **"What should I do next?"** after completing an assessment.`,
      timestamp: new Date(),
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  let idCounter   = useRef(1);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = { id: idCounter.current++, role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const reply = getBotResponse(text, riskContext);
      const botMsg: Message = { id: idCounter.current++, role: 'bot', text: reply, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setThinking(false);
    }, 700 + Math.random() * 500);
  }, [input, thinking, riskContext]);

  const SUGGESTIONS = riskContext?.riskLevel
    ? [`What are next steps for ${riskContext.riskLevel} risk?`, 'Explain PEP protocol', 'What does the probability mean?']
    : ['What is PEP?', 'How to clean a wound?', 'What are rabies symptoms?'];

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        id="chatbot-toggle-btn"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full btn-danger text-white shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-space-900 animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-panel"
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ height: '520px', background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(10,22,40,0.9))' }}>
              <div className="w-9 h-9 rounded-xl bg-crimson-500/20 border border-crimson-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-crimson-400" />
              </div>
              <div>
                <div className="font-bold text-sm">RabiesAI Assistant</div>
                <div className="text-xs text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Clinical Decision Support
                </div>
              </div>
              {riskContext?.riskLevel && (
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
                  riskContext.riskLevel === 'High'   ? 'badge-high' :
                  riskContext.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low'
                }`}>
                  {riskContext.riskLevel} Risk
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    m.role === 'bot' ? 'bg-crimson-500/20' : 'bg-white/10'
                  }`}>
                    {m.role === 'bot'
                      ? <Bot className="w-3.5 h-3.5 text-crimson-400" />
                      : <User className="w-3.5 h-3.5 text-white/70" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-1 ${
                    m.role === 'bot'
                      ? 'rounded-tl-none bg-white/5 border border-white/8'
                      : 'rounded-tr-none bg-crimson-500/20 border border-crimson-500/25'
                  }`}>
                    {m.role === 'bot'
                      ? <div className="space-y-0.5">{renderMarkdown(m.text)}</div>
                      : <p className="text-white/90 text-xs">{m.text}</p>
                    }
                    <p className="text-white/20 text-[10px] pt-1">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <motion.div className="flex gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="w-7 h-7 rounded-lg bg-crimson-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-crimson-400" />
                  </div>
                  <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-crimson-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(sendMessage, 50); }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg glass-card border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/8 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                id="chatbot-input"
                type="text"
                placeholder="Ask about PEP, symptoms, next steps…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="flex-1 form-input px-4 py-2.5 rounded-xl text-xs"
              />
              <button
                id="chatbot-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                className="btn-danger w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              >
                {thinking
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
