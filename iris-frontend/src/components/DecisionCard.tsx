import type { ActionLevel, Decision } from "../types/schemas";

/* ── Action Level Styles ──────────────────────────────────────────── */

const ACTION_STYLE: Record<
  ActionLevel,
  {
    gradient: string;
    icon: string;
    bg: string;
    desc: string;
    text: string;
    pulse: boolean;
  }
> = {
  MONITOR: {
    gradient: "from-cyan-600 to-blue-600",
    icon: "👁",
    bg: "bg-cyan-600",
    desc: "Standard monitoring protocols active",
    text: "text-cyan-400",
    pulse: false,
  },
  WARN: {
    gradient: "from-amber-500 to-yellow-600",
    icon: "⚠️",
    bg: "bg-amber-600",
    desc: "Elevated conditions — personnel alerted",
    text: "text-amber-400",
    pulse: false,
  },
  RESTRICT: {
    gradient: "from-orange-600 to-orange-500",
    icon: "🚧",
    bg: "bg-orange-600",
    desc: "Access restrictions — reduced capacity enforced",
    text: "text-orange-400",
    pulse: false,
  },
  EVACUATE: {
    gradient: "from-red-600 to-red-500",
    icon: "🚨",
    bg: "bg-red-600",
    desc: "EMERGENCY — Immediate evacuation required",
    text: "text-red-400",
    pulse: true,
  },
};

const URGENCY_STYLE: Record<string, { color: string; bg: string; dots: number }> = {
  low:      { color: "text-emerald-400", bg: "bg-emerald-500/10", dots: 1 },
  moderate: { color: "text-amber-400",   bg: "bg-amber-500/10",   dots: 2 },
  high:     { color: "text-orange-400",  bg: "bg-orange-500/10",  dots: 3 },
  critical: { color: "text-red-400",     bg: "bg-red-500/10",     dots: 4 },
};

/* ── Component ────────────────────────────────────────────────────── */

interface DecisionCardProps {
  decision: Decision | null;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  if (!decision) {
    return (
      <div className="navy-card p-6 flex flex-col items-center justify-center min-h-[420px] animate-fade-in-up">
        <div className="w-16 h-16 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <div className="w-12 h-px bg-navy-700 mb-4" />
        <p className="text-white text-sm font-semibold">Decision Engine Idle</p>
        <p className="text-slate-500 text-xs mt-2 text-center max-w-[220px] leading-relaxed">
          The AI decision engine activates once risk data streams in
        </p>
      </div>
    );
  }

  const style = ACTION_STYLE[decision.action];
  const urgency = URGENCY_STYLE[decision.urgency] ?? URGENCY_STYLE.low;

  return (
    <div className={`navy-card p-6 transition-all duration-500 animate-fade-in-up ${style.pulse ? "severity-stripe-red" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          Decision Engine
        </h2>

        {/* Urgency badge with dots */}
        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg ${urgency.bg} ${urgency.color}`}>
          <span className="flex gap-0.5">
            {Array.from({ length: urgency.dots }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-current" />
            ))}
          </span>
          {decision.urgency}
        </div>
      </div>

      {/* Hero Action Badge */}
      <div className="text-center mb-6">
        <div className={`inline-flex flex-col items-center gap-3 ${style.pulse ? "animate-pulse-red" : ""}`}>
          <span className="text-4xl animate-scale-in">{style.icon}</span>
          <div className={`relative px-10 py-3.5 rounded-xl bg-gradient-to-r ${style.gradient} shadow-lg animate-scale-in`}>
            <span className="text-lg font-black text-white uppercase tracking-[0.25em]">
              {decision.action}
            </span>
            {/* Shimmer overlay */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="w-full h-full shimmer" />
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium max-w-[260px]">{style.desc}</span>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mb-5 bg-navy-900/50 rounded-xl p-4 border border-navy-700">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-cyan-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Analysis
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {decision.justification}
        </p>
      </div>

      {/* Protocol Actions */}
      <div>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-3 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-cyan-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Protocol Actions
          <span className="text-slate-600 font-mono text-[9px] ml-1">
            {decision.recommended_actions.length} steps
          </span>
        </h3>
        <ul className="space-y-2">
          {decision.recommended_actions.map((action, i) => (
            <li
              key={i}
              className="group flex items-start gap-3 text-sm text-slate-300 animate-slide-in bg-navy-900/50 rounded-lg px-3.5 py-3 border border-navy-700 hover:border-cyan-600/30 hover:bg-navy-800/50 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white ${style.bg}`}>
                {i + 1}
              </span>
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
