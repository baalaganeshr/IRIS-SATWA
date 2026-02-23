import { useState } from "react";

/* ── Tabs ──────────────────────────────────────────────────────────── */

type Tab = "overview" | "agents" | "formula" | "stakeholders";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "formula", label: "Risk Formula" },
  { id: "stakeholders", label: "Stakeholders" },
];

/* ── Agent Info ────────────────────────────────────────────────────── */

const AGENT_INFO = [
  {
    icon: "📡", name: "Ingestion Agent",
    role: "Data Collection & Validation",
    input: "Raw sensor readings (acc, strain, tilt, wind, temp)",
    output: "Normalized 0–1 values per sensor + anomaly flags",
    detail: "Validates against physical ranges. Normalizes using min-max scaling. Flags any reading above the 95th percentile as an immediate anomaly.",
  },
  {
    icon: "📊", name: "Risk Scorer Agent",
    role: "Composite Risk Analysis",
    input: "Normalized sensor values from Ingestion Agent",
    output: "0–100 risk score + GREEN/YELLOW/ORANGE/RED level",
    detail: "Uses a weighted formula combining structural stress, vibration amplitude, traffic load, and environmental conditions into a single actionable risk score.",
  },
  {
    icon: "🧠", name: "Decision Agent",
    role: "Protocol Determination",
    input: "Risk score + risk level from Risk Scorer",
    output: "MONITOR / WARN / RESTRICT / EVACUATE action + justification",
    detail: "Maps risk scores to actionable protocols using deterministic rules. Every decision includes a natural-language justification string for full explainability.",
  },
  {
    icon: "🔔", name: "Alert Agent",
    role: "Notification Dispatch",
    input: "Decision + risk level from Decision Agent",
    output: "Alert notifications to stakeholders (ORANGE & RED only)",
    detail: "Only fires alerts for significant risk events. Stores the last 50 alerts in an in-memory ring buffer. Dispatches via SSE to all connected dashboards.",
  },
];

/* ── Stakeholder Info ──────────────────────────────────────────────── */

const STAKEHOLDERS = [
  { role: "Police", icon: "🛡️", responsibility: "Traffic diversion, area cordoning, crowd control, evacuation enforcement" },
  { role: "Government", icon: "🏛️", responsibility: "Policy decisions, resource allocation, public communication, media coordination" },
  { role: "Engineers", icon: "🔧", responsibility: "Structural inspection, sensor recalibration, repair prioritization, load assessment" },
  { role: "Medical", icon: "🏥", responsibility: "Casualty triage, ambulance pre-positioning, hospital bed coordination" },
  { role: "Fire Dept", icon: "🚒", responsibility: "Rescue operations, hazmat assessment, structural collapse response" },
];

/* ── Component ────────────────────────────────────────────────────── */

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const [tab, setTab] = useState<Tab>("overview");

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ─────────────────────────────────── */}
        <div className="sticky top-0 bg-navy-900/95 backdrop-blur-md px-6 py-4 border-b border-navy-700/50 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white font-black text-xs">IR</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">About IRIS</h2>
                <p className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase">Multi-Agent Risk Intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t.id
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4">
          {tab === "overview" && (
            <div className="space-y-4 animate-enter">
              <div>
                <h3 className="text-xs font-bold text-white mb-2">What is IRIS?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  IRIS (Infrastructure Risk Intelligence System) is a real-time AI-powered monitoring platform
                  for critical infrastructure — specifically bridges. It uses a multi-agent pipeline to
                  continuously ingest sensor data, compute risk scores, determine action protocols, and
                  dispatch alerts to relevant stakeholders.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-2">How It Works</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sensors deployed on the bridge send readings every 3 seconds. The 4-agent pipeline processes each
                  reading: validating & normalizing the data, computing a weighted risk score (0–100), determining
                  the appropriate action protocol, and dispatching alerts when thresholds are exceeded.
                  All data streams to this dashboard via Server-Sent Events (SSE) in real-time.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-2">Architecture</h3>
                <div className="bg-navy-950/60 rounded-xl p-4 border border-navy-700/40 font-mono text-[10px] text-slate-500 leading-relaxed whitespace-pre">
{`Sensors → [Ingestion] → [Risk Scorer] → [Decision] → [Alerter]
              ↓               ↓               ↓             ↓
          Normalize       Score 0-100     MONITOR/WARN   Notify if
          + Validate      + Risk Level    RESTRICT/EVAC   ≥ ORANGE

Backend:  Python + FastAPI + SSE Streaming
Frontend: React + TypeScript + TailwindCSS
Deploy:   Docker Compose (one command)`}
                </div>
              </div>
            </div>
          )}

          {tab === "agents" && (
            <div className="space-y-3 animate-enter">
              {AGENT_INFO.map((agent) => (
                <div key={agent.name} className="bg-navy-950/50 rounded-xl p-4 border border-navy-700/40">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{agent.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                      <p className="text-[9px] text-cyan-500 font-semibold">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{agent.detail}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-navy-900/60 rounded-lg px-3 py-2 border border-navy-700/30">
                      <span className="text-[8px] text-slate-600 uppercase font-bold tracking-wider">Input</span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{agent.input}</p>
                    </div>
                    <div className="bg-navy-900/60 rounded-lg px-3 py-2 border border-navy-700/30">
                      <span className="text-[8px] text-slate-600 uppercase font-bold tracking-wider">Output</span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{agent.output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "formula" && (
            <div className="space-y-4 animate-enter">
              <div>
                <h3 className="text-xs font-bold text-white mb-2">Risk Scoring Formula</h3>
                <div className="bg-navy-950/60 rounded-xl p-4 border border-cyan-500/20">
                  <p className="text-xs text-cyan-400 font-mono font-bold text-center mb-3">
                    Score = (S×0.35 + V×0.25 + L×0.20 + E×0.20) × 100
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["S", "Structural Stress", "35%", "Steel/concrete strain normalized to 0–1"],
                      ["V", "Vibration", "25%", "Acceleration amplitude from accelerometers"],
                      ["L", "Traffic Load", "20%", "Live load from weight sensors (tons)"],
                      ["E", "Environmental", "20%", "Wind speed + temperature combined"],
                    ].map(([symbol, name, weight, desc]) => (
                      <div key={symbol} className="bg-navy-900/60 rounded-lg px-3 py-2.5 border border-navy-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 font-mono font-bold text-xs">{symbol}</span>
                          <span className="text-[10px] text-white font-semibold">{name}</span>
                          <span className="ml-auto text-[9px] text-slate-500 font-mono">{weight}</span>
                        </div>
                        <p className="text-[9px] text-slate-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white mb-2">Risk Level Thresholds</h3>
                <div className="space-y-1.5">
                  {[
                    ["GREEN", "0 – 30", "bg-emerald-500", "text-emerald-400", "Normal operation. Standard monitoring continues."],
                    ["YELLOW", "31 – 55", "bg-amber-400", "text-amber-400", "Elevated risk. Increase monitoring frequency, notify maintenance."],
                    ["ORANGE", "56 – 75", "bg-orange-500", "text-orange-400", "High risk. Reduce traffic, deploy inspection team, alert authorities."],
                    ["RED", "76 – 100", "bg-red-500", "text-red-400", "Critical emergency. Close bridge, deploy emergency services, full detour."],
                  ].map(([level, range, bg, textClr, desc]) => (
                    <div key={level} className="flex items-center gap-3 bg-navy-950/50 rounded-lg px-4 py-2.5 border border-navy-700/40">
                      <div className={`w-2.5 h-2.5 rounded-full ${bg} flex-shrink-0`} />
                      <span className={`text-xs font-bold font-mono w-14 ${textClr}`}>{level}</span>
                      <span className="text-xs text-slate-400 font-mono w-14">{range}</span>
                      <span className="text-[10px] text-slate-500 flex-1">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white mb-2">Compound Escalation Rules</h3>
                <div className="bg-navy-950/60 rounded-xl p-4 border border-navy-700/40 text-[10px] text-slate-400 space-y-1.5">
                  <p>• If <span className="text-cyan-400 font-mono">stress &gt; 0.8</span> AND <span className="text-cyan-400 font-mono">vibration &gt; 0.7</span> → Force <span className="text-red-400 font-bold">RED</span> regardless of total score</p>
                  <p>• If any single factor &gt; 0.95 → Flag as <span className="text-orange-400 font-bold">anomaly</span> and immediately escalate</p>
                  <p>• Three consecutive ORANGE readings → Auto-escalate to <span className="text-red-400 font-bold">RED</span></p>
                </div>
              </div>
            </div>
          )}

          {tab === "stakeholders" && (
            <div className="space-y-3 animate-enter">
              <p className="text-xs text-slate-400 leading-relaxed">
                IRIS automatically notifies the following stakeholders when risk levels reach ORANGE or RED:
              </p>
              {STAKEHOLDERS.map((s) => (
                <div key={s.role} className="flex items-start gap-3 bg-navy-950/50 rounded-xl p-4 border border-navy-700/40">
                  <span className="text-xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.role}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{s.responsibility}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
