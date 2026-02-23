import { useRef, useEffect, useState } from "react";
import type { RiskAssessment } from "../types/schemas";

/* ── Trend helpers ────────────────────────────────────────────────── */

const TREND_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  rising:  { icon: "↑", label: "Rising",  color: "text-red-400",     bg: "bg-red-500/10" },
  stable:  { icon: "→", label: "Stable",  color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  falling: { icon: "↓", label: "Falling", color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

function riskColor(score: number): string {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 25) return "text-amber-400";
  return "text-emerald-400";
}

function riskBg(score: number): string {
  if (score >= 75) return "bg-red-500/10";
  if (score >= 50) return "bg-orange-500/10";
  if (score >= 25) return "bg-amber-500/10";
  return "bg-emerald-500/10";
}

/* ── Animated counter ─────────────────────────────────────────────── */

function AnimatedNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const dur = 500;
    const t0 = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round((start + diff * e) * 10) / 10);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display.toFixed(1)}</>;
}

/* ── Mini bar comparing current vs predicted ──────────────────────── */

function CompareBar({ current, predicted }: { current: number; predicted: number }) {
  const max = 100;

  return (
    <div className="space-y-2">
      {/* Current */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 w-16">Current</span>
        <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700"
            style={{ width: `${(current / max) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-mono font-bold w-8 text-right ${riskColor(current)}`}>
          {Math.round(current)}
        </span>
      </div>

      {/* Predicted */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 w-16">Predicted</span>
        <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-700"
            style={{ width: `${(predicted / max) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-mono font-bold w-8 text-right ${riskColor(predicted)}`}>
          <AnimatedNum value={predicted} />
        </span>
      </div>
    </div>
  );
}

/* ── Delta badge ──────────────────────────────────────────────────── */

function DeltaBadge({ current, predicted }: { current: number; predicted: number }) {
  const delta = predicted - current;
  const abs = Math.abs(delta);

  if (abs < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
        ≈ No change
      </span>
    );
  }

  const rising = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        rising ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {rising ? "▲" : "▼"} {abs.toFixed(1)} pts
    </span>
  );
}

/* ── Main component ───────────────────────────────────────────────── */

interface ForecastCardProps {
  risk: RiskAssessment | null;
}

export default function ForecastCard({ risk }: ForecastCardProps) {
  const predicted = risk?.predicted_risk;
  const trend = risk?.trend;

  // Don't render until we have forecast data
  if (predicted == null || trend == null || !risk) return null;

  const trendMeta = TREND_META[trend] ?? TREND_META.stable;

  return (
    <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Risk Forecast
          <span className="text-[9px] text-slate-600 font-normal ml-1">(5 min ahead)</span>
        </h3>

        {/* Trend badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trendMeta.bg} ${trendMeta.color}`}>
          <span className="text-sm">{trendMeta.icon}</span>
          {trendMeta.label}
        </span>
      </div>

      {/* Big predicted number */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Predicted Risk</p>
          <span className={`text-4xl font-black font-mono tabular-nums ${riskColor(predicted)}`}>
            <AnimatedNum value={predicted} />
          </span>
          <span className="text-sm text-slate-500 ml-1">/100</span>
        </div>

        <div className="flex-1 flex flex-col items-end gap-1.5">
          <DeltaBadge current={risk.overall_score} predicted={predicted} />
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${riskBg(predicted)}`}>
            <span className={`text-xl ${trendMeta.color}`}>{trendMeta.icon}</span>
          </div>
        </div>
      </div>

      {/* Compare bars */}
      <CompareBar current={risk.overall_score} predicted={predicted} />

      {/* Disclaimer */}
      <p className="text-[8px] text-slate-600 mt-3 leading-relaxed">
        <span className="font-bold text-slate-500">ADVISORY ONLY</span> — GRU neural network forecast.
        Emergency decisions are always rule-based and deterministic.
      </p>
    </div>
  );
}
