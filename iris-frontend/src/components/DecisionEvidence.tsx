import { useState } from "react";
import type { RiskAssessment, Decision, AgentLog } from "../types/schemas";

interface DecisionEvidenceProps {
  risk: RiskAssessment | null;
  decision: Decision | null;
  agentLogs: AgentLog[];
  timestamp?: string;
}

const LEVEL_COLOR: Record<string, string> = {
  GREEN: "text-emerald-400",
  YELLOW: "text-amber-400",
  ORANGE: "text-orange-400",
  RED: "text-red-400",
};

const BAR_COLOR: Record<string, string> = {
  Stress: "bg-cyan-400",
  Vibration: "bg-sky-400",
  Load: "bg-amber-400",
  Environmental: "bg-emerald-400",
};

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round(value * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-mono text-slate-300">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[label] ?? "bg-cyan-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DecisionEvidence({ risk, decision, agentLogs, timestamp }: DecisionEvidenceProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!risk || !decision) return;
    const snapshot = {
      timestamp: timestamp ?? new Date().toISOString(),
      risk: {
        score: risk.overall_score,
        level: risk.risk_level,
        breakdown: risk.breakdown,
        contributing_factors: risk.contributing_factors,
        forced_red: risk.forced_red ?? false,
        forced_red_reason: risk.forced_red_reason ?? null,
      },
      decision: {
        action: decision.action,
        urgency: decision.urgency,
        justification: decision.justification,
        recommended_actions: decision.recommended_actions,
      },
      recent_agent_logs: agentLogs.slice(-4),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  if (!risk || !decision) {
    return (
      <div className="navy-card p-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <h3 className="section-title mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
          </svg>
          Decision Evidence
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-600">
          <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[10px] font-mono">No decision data yet</span>
        </div>
      </div>
    );
  }

  const bd = risk.breakdown;

  return (
    <div className="navy-card p-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      {/* Header */}
      <h3 className="section-title mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
        </svg>
        Decision Evidence
      </h3>

      {/* Risk headline */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-2xl font-black font-mono ${LEVEL_COLOR[risk.risk_level] ?? "text-slate-400"}`}>
          {risk.overall_score}
        </span>
        <span className="text-xs text-slate-500 font-medium">/100</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
          risk.risk_level === "RED" ? "bg-red-500/15 text-red-400" :
          risk.risk_level === "ORANGE" ? "bg-orange-500/15 text-orange-400" :
          risk.risk_level === "YELLOW" ? "bg-amber-500/15 text-amber-400" :
          "bg-emerald-500/15 text-emerald-400"
        }`}>
          {risk.risk_level}
        </span>
      </div>

      {/* Forced RED note */}
      {risk.forced_red && risk.forced_red_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4 animate-slide-in">
          <span className="text-[10px] font-mono text-red-400">
            ⚠ Compound rule triggered: {risk.forced_red_reason} → forced RED
          </span>
        </div>
      )}

      {/* Breakdown bars */}
      <div className="space-y-2.5 mb-4">
        <Bar label="Stress" value={bd.stress_score} />
        <Bar label="Vibration" value={bd.vibration_score} />
        <Bar label="Load" value={bd.load_score} />
        <Bar label="Environmental" value={bd.environmental_score} />
      </div>

      {/* Contributing factors */}
      {risk.contributing_factors.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contributing Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {risk.contributing_factors.map((f) => (
              <span key={f} className="text-[9px] font-mono bg-navy-800 text-slate-300 px-2 py-0.5 rounded border border-navy-700/50">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Decision action + urgency */}
      <div className="bg-navy-900/50 rounded-lg px-3 py-2.5 border border-navy-700/40 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Action</p>
            <p className={`text-sm font-bold ${
              decision.action === "EVACUATE" ? "text-red-400" :
              decision.action === "RESTRICT" ? "text-orange-400" :
              decision.action === "WARN" ? "text-amber-400" : "text-cyan-400"
            }`}>{decision.action}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Urgency</p>
            <p className="text-sm font-bold text-slate-300">{decision.urgency}</p>
          </div>
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700/50 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 rounded-lg px-3 py-2 text-[11px] font-medium transition-all duration-200"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-emerald-400">Copied to clipboard</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3a2.25 2.25 0 00-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copy Incident Snapshot
          </>
        )}
      </button>
    </div>
  );
}
