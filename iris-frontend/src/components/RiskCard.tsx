import { useRef, useEffect, useState } from "react";
import type { RiskAssessment, RiskLevel } from "../types/schemas";

/* ── Color System ─────────────────────────────────────────────────── */

const RING_COLORS: Record<RiskLevel, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  ORANGE: "#f97316",
  RED: "#ef4444",
};

const RING_GRADIENT: Record<RiskLevel, [string, string]> = {
  GREEN:  ["#22c55e", "#34d399"],
  YELLOW: ["#eab308", "#fbbf24"],
  ORANGE: ["#f97316", "#fb923c"],
  RED:    ["#ef4444", "#f87171"],
};

const LEVEL_TEXT: Record<RiskLevel, string> = {
  GREEN: "text-emerald-400",
  YELLOW: "text-amber-400",
  ORANGE: "text-orange-400",
  RED: "text-red-400",
};

const CARD_ACCENT: Record<RiskLevel, string> = {
  GREEN: "navy-card-green border-glow-green",
  YELLOW: "navy-card-yellow border-glow-yellow",
  ORANGE: "navy-card-orange border-glow-orange",
  RED: "navy-card-red border-glow-red",
};

const LEVEL_DESC: Record<RiskLevel, string> = {
  GREEN: "All structural parameters within safe bounds",
  YELLOW: "Minor anomalies detected — enhanced monitoring",
  ORANGE: "Significant risk — immediate attention required",
  RED: "Critical structural compromise detected",
};

const BAR_COLORS: Record<string, { gradient: string; bg: string; icon: string }> = {
  stress: {
    gradient: "from-rose-600 via-red-500 to-red-400",
    bg: "bg-red-500/10",
    icon: "⚡",
  },
  vibration: {
    gradient: "from-amber-600 via-amber-500 to-yellow-400",
    bg: "bg-amber-500/10",
    icon: "〰",
  },
  load: {
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    bg: "bg-blue-500/10",
    icon: "⏚",
  },
  environmental: {
    gradient: "from-teal-600 via-teal-500 to-emerald-400",
    bg: "bg-teal-500/10",
    icon: "🌡",
  },
};

/* ── Animated Score Counter ───────────────────────────────────────── */

function AnimatedScore({ value, level }: { value: number; level: RiskLevel }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={`text-5xl font-black tabular-nums font-mono ${LEVEL_TEXT[level]} transition-colors duration-700`}>
      {display}
    </span>
  );
}

/* ── SVG Ring Gauge ───────────────────────────────────────────────── */

function RingGauge({ score, level }: { score: number; level: RiskLevel }) {
  const RADIUS = 68;
  const STROKE = 6;
  const SIZE = 170;
  const CENTER = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const gradientId = `ring-grad-${level}`;
  const glowId = `ring-glow-${level}`;

  const angle = ((score / 100) * 360 - 90) * (Math.PI / 180);
  const dotX = CENTER + RADIUS * Math.cos(angle);
  const dotY = CENTER + RADIUS * Math.sin(angle);

  return (
    <div className="relative w-[180px] h-[180px] mx-auto">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={RING_GRADIENT[level][0]} />
            <stop offset="100%" stopColor={RING_GRADIENT[level][1]} />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none" stroke="rgba(55,65,81,0.5)" strokeWidth={STROKE} strokeLinecap="round"
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = (tick / 100) * 360;
          const rad = (a * Math.PI) / 180;
          const x1 = CENTER + (RADIUS + 6) * Math.cos(rad);
          const y1 = CENTER + (RADIUS + 6) * Math.sin(rad);
          const x2 = CENTER + (RADIUS + 10) * Math.cos(rad);
          const y2 = CENTER + (RADIUS + 10) * Math.sin(rad);
          return (
            <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(55,65,81,0.4)" strokeWidth={1.5} strokeLinecap="round" />
          );
        })}

        {/* Main arc */}
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none" stroke={`url(#${gradientId})`} strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
          filter={`url(#${glowId})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />

        {/* End dot */}
        {score > 2 && (
          <circle cx={dotX} cy={dotY} r={4} fill={RING_COLORS[level]} opacity={0.8}
            style={{ transition: "cx 0.8s cubic-bezier(0.16,1,0.3,1), cy 0.8s cubic-bezier(0.16,1,0.3,1)" }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedScore value={score} level={level} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
          risk score
        </span>
      </div>
    </div>
  );
}

/* ── Breakdown Bar ────────────────────────────────────────────────── */

function BreakdownBar({ label, keyName, value }: { label: string; keyName: string; value: number }) {
  const pct = Math.round(value * 100);
  const colors = BAR_COLORS[keyName];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-400 flex items-center gap-2 font-medium">
          <span className={`w-5 h-5 rounded-md ${colors.bg} flex items-center justify-center text-[10px]`}>
            {colors.icon}
          </span>
          {label}
        </span>
        <span className={`text-sm font-bold font-mono tabular-nums ${
          pct >= 80 ? "text-red-400" : pct >= 60 ? "text-orange-400" : pct >= 40 ? "text-amber-400" : "text-slate-400"
        }`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} bar-shimmer transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

interface RiskCardProps {
  risk: RiskAssessment | null;
}

export default function RiskCard({ risk }: RiskCardProps) {
  if (!risk) {
    return (
      <div className="navy-card p-6 flex flex-col items-center justify-center min-h-[440px] animate-fade-in-up">
        <div className="relative w-[160px] h-[160px] mx-auto mb-6">
          <svg viewBox="0 0 170 170" className="w-full h-full -rotate-90 opacity-20">
            <circle cx="85" cy="85" r="68" fill="none" stroke="rgba(55,65,81,0.5)" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl text-slate-600 font-mono font-bold">—</span>
          </div>
        </div>
        <div className="w-12 h-px bg-navy-700 mb-4" />
        <p className="text-white text-sm font-semibold">Awaiting Sensor Data</p>
        <p className="text-slate-500 text-xs mt-2 text-center max-w-[220px] leading-relaxed">
          Start a scenario to begin real-time structural analysis
        </p>
        <div className="flex items-center gap-2 mt-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-navy-700 animate-pulse" style={{ animationDelay: `${i * 250}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const bars = [
    { label: "Structural Stress", key: "stress", value: risk.breakdown.stress_score },
    { label: "Vibration", key: "vibration", value: risk.breakdown.vibration_score },
    { label: "Traffic Load", key: "load", value: risk.breakdown.load_score },
    { label: "Environmental", key: "environmental", value: risk.breakdown.environmental_score },
  ];

  return (
    <div className={`navy-card ${CARD_ACCENT[risk.risk_level]} p-6 transition-all duration-500 animate-fade-in-up`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Risk Assessment
        </h2>
        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg ${
          risk.risk_level === "GREEN"  ? "bg-emerald-500/10 text-emerald-400" :
          risk.risk_level === "YELLOW" ? "bg-amber-500/10 text-amber-400" :
          risk.risk_level === "ORANGE" ? "bg-orange-500/10 text-orange-400" :
          "bg-red-500/10 text-red-400"
        }`}>
          {risk.risk_level}
        </span>
      </div>

      <RingGauge score={risk.overall_score} level={risk.risk_level} />

      <p className={`text-center text-xs font-medium mt-3 mb-1 ${LEVEL_TEXT[risk.risk_level]} opacity-80`}>
        {LEVEL_DESC[risk.risk_level]}
      </p>

      <div className="my-5 h-px bg-navy-700" />

      <div className="space-y-4">
        {bars.map((bar) => (
          <BreakdownBar key={bar.key} label={bar.label} keyName={bar.key} value={bar.value} />
        ))}
      </div>

      {risk.contributing_factors.length > 0 && (
        <div className="mt-5 pt-4 border-t border-navy-700">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.12em] font-bold mb-2.5">Contributing Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {risk.contributing_factors.map((f, i) => (
              <span key={i} className="text-xs text-slate-400 bg-navy-800 border border-navy-700 rounded-md px-2 py-0.5 font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
