import { useCallback, useEffect, useRef, useState } from "react";

interface DemoScriptControlsProps {
  onStartScenario: (name: string) => void;
  disabled: boolean;
  onDemoRunningChange: (running: boolean) => void;
}

/* ── Phase definitions ────────────────────────────────────────────── */

const PHASES = [
  {
    name: "normal",
    label: "NORMAL",
    duration: 15,
    narration: "Baseline monitoring — all factors within safe range.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  {
    name: "storm",
    label: "STORM",
    duration: 30,
    narration: "Environmental stress rising — escalating to WARN/RESTRICT as needed.",
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/25",
    dot: "bg-orange-400",
  },
  {
    name: "critical",
    label: "CRITICAL",
    duration: 30,
    narration: "Compound trigger fired — forced RED, evacuation protocol engaged.",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/25",
    dot: "bg-red-400",
  },
] as const;

const TOTAL = PHASES.reduce((s, p) => s + p.duration, 0); // 75s active + buffer ≈ 90s

export default function DemoScriptControls({ onStartScenario, disabled, onDemoRunningChange }: DemoScriptControlsProps) {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [countdown, setCountdown] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef(0); // mutable countdown

  /* ── Cleanup helper ─────────────────────────────────────────────── */
  const cleanup = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /* ── Run Demo ───────────────────────────────────────────────────── */
  const handleRun = useCallback(() => {
    cleanup();
    setRunning(true);
    onDemoRunningChange(true);

    let elapsed = 0;

    PHASES.forEach((phase, idx) => {
      const t = setTimeout(() => {
        setPhaseIdx(idx);
        cdRef.current = phase.duration;
        setCountdown(phase.duration);
        onStartScenario(phase.name);
      }, elapsed * 1000);
      timers.current.push(t);
      elapsed += phase.duration;
    });

    // 1-second countdown ticker
    cdRef.current = PHASES[0].duration;
    tickRef.current = setInterval(() => {
      cdRef.current -= 1;
      if (cdRef.current >= 0) setCountdown(cdRef.current);
    }, 1000);

    // Auto-finish (total phase time + 15s observation buffer = ~90s)
    const finishT = setTimeout(() => {
      cleanup();
      setRunning(false);
      setPhaseIdx(-1);
      setCountdown(0);
      onDemoRunningChange(false);
    }, (TOTAL + 15) * 1000);
    timers.current.push(finishT);
  }, [cleanup, onStartScenario, onDemoRunningChange]);

  /* ── Stop Demo ──────────────────────────────────────────────────── */
  const handleStop = useCallback(() => {
    cleanup();
    setRunning(false);
    setPhaseIdx(-1);
    setCountdown(0);
    onDemoRunningChange(false);
  }, [cleanup, onDemoRunningChange]);

  const phase = phaseIdx >= 0 ? PHASES[phaseIdx] : null;

  return (
    <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      {/* Header */}
      <h3 className="section-title mb-3">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 12 6 12.504 6 13.125" />
        </svg>
        Demo Script Mode
      </h3>

      {/* Primary / Secondary buttons */}
      {running ? (
        <button
          onClick={handleStop}
          className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
          </svg>
          Stop Demo
        </button>
      ) : (
        <button
          onClick={handleRun}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Run Full Demo (90s)
        </button>
      )}

      {/* Status line — phase + countdown */}
      {running && phase && (
        <div className={`mt-3 flex items-center justify-between ${phase.bg} ${phase.border} border rounded-lg px-3 py-2 animate-slide-in`}>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${phase.dot} animate-pulse`} />
            <span className={`text-[11px] font-bold tracking-wider ${phase.color}`}>
              {phase.label}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300">
            {countdown}s
          </span>
        </div>
      )}

      {/* Narration strip */}
      {running && phase && (
        <p className="mt-2 text-[10px] font-mono text-slate-400 leading-relaxed animate-fade-in">
          {phase.narration}
        </p>
      )}

      {/* Idle info */}
      {!running && (
        <p className="mt-2 text-[10px] text-slate-600 text-center">
          Cycles through Normal → Storm → Critical with live narration
        </p>
      )}
    </div>
  );
}
