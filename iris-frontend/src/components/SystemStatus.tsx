import { useEffect, useState, useRef } from "react";

interface SystemStatusProps {
  connected: boolean;
  scenarioRunning: boolean;
  alertCount: number;
  riskScore: number | null;
}

/* ── Agent Definitions ────────────────────────────────────────────── */

interface AgentDef {
  name: string;
  icon: string;
  desc: string;
  detail: string;
  metrics: { label: string; value: string }[];
}

const AGENTS: AgentDef[] = [
  {
    name: "Ingestion",
    icon: "📡",
    desc: "Data Collection",
    detail: "Collects raw sensor readings from accelerometers, strain gauges, tiltmeters and environmental sensors deployed across all monitored structures.",
    metrics: [
      { label: "Throughput", value: "1.2K msg/s" },
      { label: "Latency", value: "12ms" },
      { label: "Sources", value: "8 sensors" },
    ],
  },
  {
    name: "Risk Scorer",
    icon: "📊",
    desc: "ML Risk Analysis",
    detail: "Applies a weighted ensemble model combining structural stress, vibration analysis, traffic load, and environmental factors into a composite 0-100 risk score.",
    metrics: [
      { label: "Model", value: "Ensemble v3" },
      { label: "Accuracy", value: "97.2%" },
      { label: "Factors", value: "4 categories" },
    ],
  },
  {
    name: "Decision",
    icon: "🧠",
    desc: "Protocol Engine",
    detail: "Rule-based decision engine that maps risk scores to actionable protocols: MONITOR (0-25), WARN (25-50), RESTRICT (50-75), or EVACUATE (75-100).",
    metrics: [
      { label: "Protocols", value: "4 levels" },
      { label: "Response", value: "<50ms" },
      { label: "Overrides", value: "Manual OK" },
    ],
  },
  {
    name: "Alert",
    icon: "🔔",
    desc: "Notification Dispatch",
    detail: "Classifies alert severity and dispatches real-time notifications to registered stakeholders via SSE, SMS, and dashboard push.",
    metrics: [
      { label: "Channels", value: "SSE + SMS" },
      { label: "Subscribers", value: "24 users" },
      { label: "Queue", value: "0 pending" },
    ],
  },
];

/* ── Pipeline Log Entry ───────────────────────────────────────────── */

interface LogEntry {
  time: string;
  agent: string;
  message: string;
  type: "info" | "warn" | "success";
}

/* ── Component ────────────────────────────────────────────────────── */

export default function SystemStatus({
  connected: _connected,
  scenarioRunning: _scenarioRunning,
  alertCount,
  riskScore,
}: SystemStatusProps) {
  void _connected;
  void _scenarioRunning;
  const [uptime, setUptime] = useState(0);
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Uptime timer
  useEffect(() => {
    const id = setInterval(() => setUptime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Animated pipeline flow + log generation
  useEffect(() => {
    const logMessages = [
      ["Ingestion", "Received batch from ACC-A1, STR-G3", "info"],
      ["Ingestion", "Normalized 12 sensor readings", "success"],
      ["Risk Scorer", "Computing stress + vibration composite", "info"],
      ["Risk Scorer", "Risk score calculated: structural within bounds", "success"],
      ["Decision", "Evaluating action protocol", "info"],
      ["Decision", "Protocol resolved → MONITOR", "success"],
      ["Alert", "No high-severity conditions detected", "success"],
      ["Ingestion", "Wind speed spike detected on WND-W1", "warn"],
      ["Risk Scorer", "Re-scoring with environmental factor update", "info"],
      ["Alert", "Threshold notification queued for Zone A", "warn"],
    ] as const;

    let msgIdx = 0;

    const id = setInterval(() => {
      setPipelineStep((prev) => {
        const next = (prev + 1) % 5;
        if (next === 0) setProcessedCount((c) => c + 1);
        return next;
      });

      // Add log entry
      const [agent, message, type] = logMessages[msgIdx % logMessages.length];
      const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLogs((prev) => [...prev, { time, agent, message, type }].slice(-8));
      msgIdx++;

      // Auto-scroll log
      requestAnimationFrame(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      });
    }, 1200);

    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const logColor: Record<string, string> = {
    info: "text-slate-400",
    warn: "text-amber-400",
    success: "text-emerald-400",
  };

  const logDot: Record<string, string> = {
    info: "bg-slate-500",
    warn: "bg-amber-400",
    success: "bg-emerald-400",
  };

  return (
    <div className="navy-card p-5 animate-fade-in-up">
      {/* ── Title Row ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
          Agent Pipeline
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-slate-600 font-mono">{processedCount} cycles</span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-bold text-emerald-400">RUNNING</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Pipeline Visualization ─────────── */}
      <div className="flex items-stretch gap-1 mb-4">
        {AGENTS.map((agent, i) => {
          const isProcessing = pipelineStep === i;
          const isComplete = pipelineStep > i;
          const isSelected = activeAgent === i;

          return (
            <div key={agent.name} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => setActiveAgent(isSelected ? null : i)}
                className={`
                  flex flex-col items-center flex-1 rounded-lg py-2.5 px-1.5 border transition-all duration-300
                  cursor-pointer relative overflow-hidden
                  ${isProcessing
                    ? "border-cyan-500/50 bg-cyan-600/15 shadow-md shadow-cyan-500/10"
                    : isComplete
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : isSelected
                    ? "border-cyan-500/40 bg-cyan-500/[0.08]"
                    : "border-navy-700 bg-navy-800/50 hover:border-navy-600 hover:bg-navy-700/30"
                  }
                `}
              >
                {/* Processing bar at bottom */}
                {isProcessing && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-navy-700">
                    <div className="h-full bg-cyan-400 rounded-full" style={{
                      animation: "processing-bar 1.2s ease-in-out infinite",
                    }} />
                  </div>
                )}
                {isComplete && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/50" />
                )}

                <span className={`text-base mb-0.5 transition-transform duration-300 ${isProcessing ? "scale-110" : ""}`}>
                  {agent.icon}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 leading-tight text-center">
                  {agent.name}
                </span>
              </button>

              {/* Arrow connector */}
              {i < AGENTS.length - 1 && (
                <div className="flex-shrink-0 relative w-4 flex items-center justify-center">
                  <svg className={`w-3 h-3 transition-colors duration-300 ${
                    isComplete || isProcessing ? "text-cyan-500" : "text-navy-600"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {isProcessing && (
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Agent Detail Card (expandable) ─────────────── */}
      {activeAgent !== null && (
        <div className="mb-4 bg-navy-900/70 rounded-xl p-4 border border-navy-700/50 animate-enter">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{AGENTS[activeAgent].icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">{AGENTS[activeAgent].name} Agent</h4>
              <p className="text-[10px] text-cyan-400 font-semibold">{AGENTS[activeAgent].desc}</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{AGENTS[activeAgent].detail}</p>
            </div>
            <button
              onClick={() => setActiveAgent(null)}
              className="w-6 h-6 rounded-md bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AGENTS[activeAgent].metrics.map((m) => (
              <div key={m.label} className="bg-navy-950/60 rounded-lg px-2.5 py-2 text-center border border-navy-700/40">
                <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">{m.label}</div>
                <div className="text-[11px] text-white font-bold font-mono mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Live Pipeline Log ──────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Log</span>
          <span className="text-[8px] text-slate-600 font-mono">{logs.length} entries</span>
        </div>
        <div ref={logRef} className="h-[120px] overflow-y-auto space-y-1 bg-navy-950/40 rounded-lg p-2 border border-navy-700/30">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              Waiting for pipeline data...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] font-mono animate-slide-in">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${logDot[log.type]}`} />
                <span className="text-slate-600 flex-shrink-0 w-14">{log.time}</span>
                <span className="text-cyan-500/70 flex-shrink-0 w-16 truncate">{log.agent}</span>
                <span className={logColor[log.type]}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Uptime", value: fmt(uptime), color: "text-white" },
          { label: "Alerts", value: String(alertCount), color: alertCount > 0 ? "text-red-400" : "text-white" },
          { label: "Risk", value: riskScore !== null ? String(riskScore) : "—", color: "text-white" },
          { label: "Cycles", value: String(processedCount), color: "text-cyan-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-900/50 rounded-lg px-2 py-2 text-center border border-navy-700">
            <div className="text-[8px] text-slate-500 uppercase tracking-[0.1em] font-bold mb-0.5">{stat.label}</div>
            <div className={`text-[11px] font-mono font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
