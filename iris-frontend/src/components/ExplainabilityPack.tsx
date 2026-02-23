import { useState } from "react";
import type { RiskAssessment, Decision, Alert, AgentLog } from "../types/schemas";

interface ExplainabilityPackProps {
  risk: RiskAssessment | null;
  decision: Decision | null;
  alerts: Alert[];
  agentLogs: AgentLog[];
}

/* ── Protocol mapping table ──────────────────────────────────────── */

const PROTOCOL_MAP: { level: string; action: string; color: string; bg: string }[] = [
  { level: "GREEN", action: "MONITOR", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25" },
  { level: "YELLOW", action: "WARN", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/25" },
  { level: "ORANGE", action: "RESTRICT", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/25" },
  { level: "RED", action: "EVACUATE", color: "text-red-400", bg: "bg-red-500/15 border-red-500/25" },
];

const BAR_COLORS: Record<string, string> = {
  Stress: "bg-cyan-400",
  Vibration: "bg-sky-400",
  Load: "bg-amber-400",
  Environmental: "bg-emerald-400",
};

export default function ExplainabilityPack({ risk, decision, alerts, agentLogs }: ExplainabilityPackProps) {
  const [downloaded, setDownloaded] = useState(false);

  /* ── Ranked drivers (top 3) ──────────────────────────────────── */
  const rankedDrivers = risk
    ? [
        { label: "Stress", value: risk.breakdown.stress_score },
        { label: "Vibration", value: risk.breakdown.vibration_score },
        { label: "Load", value: risk.breakdown.load_score },
        { label: "Environmental", value: risk.breakdown.environmental_score },
      ]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
    : [];

  /* ── JSON export ─────────────────────────────────────────────── */
  const handleDownload = () => {
    if (!risk || !decision) return;

    const snapshot = {
      timestamp: new Date().toISOString(),
      risk: {
        overall_score: risk.overall_score,
        risk_level: risk.risk_level,
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
      recent_agent_logs: agentLogs.slice(-8),
      recent_alerts: alerts.slice(-5),
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iris-incident-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  };

  /* ── Empty state ─────────────────────────────────────────────── */
  if (!risk || !decision) {
    return (
      <div className="navy-card p-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <h3 className="section-title mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          Why this decision?
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-600">
          <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span className="text-[10px] font-mono">Waiting for pipeline data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="navy-card p-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
      {/* Header */}
      <h3 className="section-title mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        Why this decision?
      </h3>

      {/* ── Section A: Trigger Summary ────────────────────────── */}
      {risk.forced_red && risk.forced_red_reason ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4 animate-slide-in">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <span className="text-[10px] font-mono text-red-400">
              Forced RED — {risk.forced_red_reason}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-navy-900/50 border border-navy-700/40 rounded-lg px-3 py-2.5 mb-4">
          <span className="text-[10px] text-slate-400">
            Level derived from weighted risk score ({risk.overall_score}/100)
          </span>
        </div>
      )}

      {/* ── Section B: Ranked Drivers (top 3) ─────────────────── */}
      <div className="mb-4">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">Top Risk Drivers</p>
        <div className="space-y-2">
          {rankedDrivers.map((d, i) => {
            const pct = Math.min(100, Math.round(d.value * 100));
            return (
              <div key={d.label} className="animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-slate-600">#{i + 1}</span>
                    {d.label}
                  </span>
                  <span className="font-mono text-slate-300">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[d.label] ?? "bg-cyan-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section C: Protocol Mapping ───────────────────────── */}
      <div className="mb-4">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">Protocol Mapping</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PROTOCOL_MAP.map((p) => {
            const isActive = decision.action === p.action;
            return (
              <div
                key={p.level}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border text-[10px] transition-all duration-200 ${
                  isActive
                    ? `${p.bg} ring-1 ring-current ${p.color} font-bold`
                    : "bg-navy-900/40 border-navy-700/40 text-slate-600"
                }`}
              >
                <span className="font-mono">{p.level}</span>
                <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span>{p.action}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section D: Export ──────────────────────────────────── */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700/50 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 rounded-lg px-3 py-2 text-[11px] font-medium transition-all duration-200"
      >
        {downloaded ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-emerald-400">Downloaded</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Incident Snapshot (.json)
          </>
        )}
      </button>
    </div>
  );
}
