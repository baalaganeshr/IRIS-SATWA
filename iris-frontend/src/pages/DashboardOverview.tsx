import { useState, useEffect } from "react";
import type { RiskAssessment, Decision, Alert, AgentLog } from "../types/schemas";
import type { ConnectionStatus } from "../api/sse";
import type { Structure } from "../data/structures";
import { getRiskColor, getRiskTextColor, getTypeIcon } from "../data/structures";
import RiskCard from "../components/RiskCard";
import DecisionCard from "../components/DecisionCard";
import AlertFeed from "../components/AlertFeed";
import SystemStatus from "../components/SystemStatus";
import ScenarioControls from "../components/ScenarioControls";
import AgentTimeline from "../components/AgentTimeline";
import DecisionEvidence from "../components/DecisionEvidence";
import DemoScriptControls from "../components/DemoScriptControls";
import ExplainabilityPack from "../components/ExplainabilityPack";
import ForecastCard from "../components/ForecastCard";

interface DashboardOverviewProps {
  risk: RiskAssessment | null;
  decision: Decision | null;
  alerts: Alert[];
  connection: ConnectionStatus;
  scenarioRunning: boolean;
  filteredAlertCount: number;
  onStartScenario: (name: string) => void;
  agentLogs: AgentLog[];
  demoRunning: boolean;
  onDemoRunningChange: (running: boolean) => void;
  structures: Structure[];
  activeStructureId?: string | null;
  onActiveStructureChange?: (id: string | null) => void;
  onNavigate?: (page: string) => void;
}

/* ── Live Mini Ticker — simulated sensor stream ───────────────────── */

function LiveMiniTicker() {
  const [readings, setReadings] = useState<{ time: string; sensor: string; value: string; status: "ok" | "warn" | "crit" }[]>([]);

  useEffect(() => {
    const sensors = [
      { name: "ACC-A1", unit: "m/s²", base: 0.12, range: 0.15, threshold: 0.22 },
      { name: "STR-G3", unit: "µε", base: 245, range: 60, threshold: 280 },
      { name: "TLT-T1", unit: "°", base: 0.05, range: 0.04, threshold: 0.08 },
      { name: "WND-W1", unit: "km/h", base: 18, range: 20, threshold: 32 },
      { name: "TMP-01", unit: "°C", base: 32, range: 5, threshold: 36 },
    ];

    const addReading = () => {
      const s = sensors[Math.floor(Math.random() * sensors.length)];
      const val = +(s.base + (Math.random() - 0.3) * s.range).toFixed(2);
      const status = val > s.threshold * 1.2 ? "crit" as const : val > s.threshold ? "warn" as const : "ok" as const;
      const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setReadings((prev) => [{ time, sensor: s.name, value: `${val} ${s.unit}`, status }, ...prev].slice(0, 6));
    };

    addReading();
    const id = setInterval(addReading, 2500);
    return () => clearInterval(id);
  }, []);

  const statusDot: Record<string, string> = {
    ok: "bg-emerald-400",
    warn: "bg-amber-400 animate-pulse",
    crit: "bg-red-400 animate-pulse",
  };

  const statusText: Record<string, string> = {
    ok: "text-emerald-400",
    warn: "text-amber-400",
    crit: "text-red-400",
  };

  return (
    <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <h3 className="section-title mb-3">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Live Feed
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] text-emerald-400 font-bold">STREAMING</span>
        </span>
      </h3>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {readings.map((r, i) => (
          <div key={`${r.time}-${i}`} className="flex items-center gap-2 bg-navy-900/50 rounded px-2.5 py-1.5 border border-navy-700/40 animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[r.status]}`} />
            <span className="text-[9px] font-mono text-slate-600 w-16 flex-shrink-0">{r.time}</span>
            <span className="text-[10px] font-bold text-slate-400 w-14 flex-shrink-0">{r.sensor}</span>
            <span className={`text-[10px] font-mono font-bold ${statusText[r.status]}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardOverview({
  risk,
  decision,
  alerts,
  connection,
  scenarioRunning,
  filteredAlertCount,
  onStartScenario,
  agentLogs,
  demoRunning,
  onDemoRunningChange,
  structures,
  activeStructureId,
  onActiveStructureChange,
  onNavigate,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-5 animate-enter">
      {/* Top Row: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">System Status</h4>
              <p className={`text-sm font-bold truncate ${connection === "connected" ? "text-emerald-400" : "text-cyan-400"}`}>
                {connection === "connected" ? "Online" : "Demo Mode"}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${connection === "connected" ? "bg-emerald-500/10" : "bg-cyan-500/10"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${connection === "connected" ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"}`} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Risk Score</h4>
              <p className={`text-2xl font-black font-mono ${
                !risk ? "text-slate-600" :
                risk.overall_score >= 75 ? "text-red-400" :
                risk.overall_score >= 50 ? "text-orange-400" :
                risk.overall_score >= 25 ? "text-amber-400" : "text-green-400"
              }`}>
                {risk ? `${risk.overall_score}` : "—"}
                {risk && <span className="text-xs font-medium text-slate-500 ml-1">/100</span>}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!risk ? "bg-navy-700" : risk.overall_score >= 50 ? "bg-orange-500/10" : "bg-green-500/10"}`}>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Active Alerts</h4>
              <p className={`text-2xl font-black font-mono ${filteredAlertCount > 0 ? "text-red-400" : "text-cyan-400"}`}>
                {filteredAlertCount}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${filteredAlertCount > 0 ? "bg-red-500/10" : "bg-cyan-500/10"}`}>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Decision Engine</h4>
              <p className={`text-sm font-bold truncate ${
                decision?.action === "EVACUATE" ? "text-red-400" :
                decision?.action === "RESTRICT" ? "text-orange-400" :
                decision?.action === "WARN" ? "text-amber-400" :
                decision ? "text-cyan-400" : "text-slate-600"
              }`}>
                {decision?.action ?? "Idle"}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${decision ? "bg-cyan-500/10" : "bg-navy-700"}`}>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Risk + Forecast + Structures + System Status */}
        <div className="lg:col-span-4 space-y-5">
          <RiskCard risk={risk} structures={structures} activeStructureId={activeStructureId} />

          {/* ── Monitored Structures ── */}
          <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <h3 className="section-title mb-3">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              Monitored Structures
              <span className="ml-auto text-[9px] font-bold text-slate-500">{structures.length} active</span>
            </h3>
            <div className="space-y-2">
              {structures.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onActiveStructureChange?.(s.id);
                    onNavigate?.("map");
                  }}
                  className={`w-full text-left grid grid-cols-[24px_1fr_44px_68px] items-center gap-2 bg-navy-900/50 rounded-lg px-3 py-2.5 border transition-all duration-500 cursor-pointer group ${
                    activeStructureId === s.id
                      ? 'border-cyan-400/60 ring-1 ring-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
                      : 'border-navy-700/40 hover:border-cyan-500/40 hover:bg-navy-800/60'
                  }`}
                >
                  {/* Icon */}
                  <span className="text-base leading-none">{getTypeIcon(s.type)}</span>

                  {/* Name + risk bar */}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-300 truncate group-hover:text-cyan-300 transition-colors">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1.5 bg-navy-700/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${getRiskColor(s.riskLevel)}`} style={{ width: `${s.riskLevel}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Risk % — fixed width */}
                  <span className={`text-[11px] font-mono font-bold tabular-nums text-right ${getRiskTextColor(s.riskLevel)}`}>
                    {s.riskLevel}%
                  </span>

                  {/* Status badge — fixed width */}
                  <span className={`text-center px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider leading-tight ${
                    s.riskLevel >= 75 ? "bg-red-500/15 text-red-400"
                    : s.riskLevel >= 50 ? "bg-orange-500/15 text-orange-400"
                    : s.riskLevel >= 25 ? "bg-amber-500/15 text-amber-400"
                    : "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    {s.status.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Hint */}
            <p className="mt-2 text-[9px] text-slate-600 text-center">Click a structure to view on Risk Map</p>

            {/* Fleet average */}
            <div className="mt-3 flex items-center justify-between bg-navy-950/50 rounded-lg px-3 py-2 border border-navy-700/30">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fleet Avg Risk</span>
              <span className={`text-sm font-black font-mono ${getRiskTextColor(Math.round(structures.reduce((sum, s) => sum + s.riskLevel, 0) / structures.length))}`}>
                {Math.round(structures.reduce((sum, s) => sum + s.riskLevel, 0) / structures.length)}%
              </span>
            </div>
          </div>

          <ForecastCard risk={risk} />
          <SystemStatus
            connected={connection === "connected"}
            scenarioRunning={scenarioRunning}
            alertCount={filteredAlertCount}
            riskScore={risk?.overall_score ?? null}
          />
        </div>

        {/* Center: Decision + Evidence + Alerts */}
        <div className="lg:col-span-5 space-y-5">
          <DecisionCard decision={decision} />
          <DecisionEvidence risk={risk} decision={decision} agentLogs={agentLogs} />
          <ExplainabilityPack risk={risk} decision={decision} alerts={alerts} agentLogs={agentLogs} />
          <AlertFeed alerts={alerts} />
        </div>

        {/* Right: Controls + Architecture */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20 space-y-5">
            <ScenarioControls
              onStart={onStartScenario}
              isRunning={scenarioRunning}
              demoRunning={demoRunning}
            />

            {/* Demo Script Mode */}
            <DemoScriptControls
              onStartScenario={onStartScenario}
              disabled={scenarioRunning}
              onDemoRunningChange={onDemoRunningChange}
              onActiveStructureChange={onActiveStructureChange}
            />

            {/* Agent Activity Timeline */}
            <AgentTimeline logs={agentLogs} />

            {/* Live Data Mini Feed */}
            <LiveMiniTicker />
          </div>
        </div>
      </div>
    </div>
  );
}
