import { useState } from "react";

interface ScenarioControlsProps {
  onStart: (name: string) => void;
  isRunning: boolean;
  demoRunning: boolean;
}

const SCENARIOS = [
  {
    name: "normal",
    label: "Normal Day",
    emoji: "☀️",
    description: "Calm conditions — all green",
    steps: 8,
    color: "cyan",
    activeBg: "bg-cyan-600/20",
    activeBorder: "border-cyan-500",
    activeText: "text-cyan-400",
    btnBg: "bg-cyan-600 hover:bg-cyan-700",
    focusRing: "focus:ring-cyan-500",
  },
  {
    name: "storm",
    label: "Storm Escalation",
    emoji: "⛈️",
    description: "Rising wind & vibration",
    steps: 10,
    color: "orange",
    activeBg: "bg-orange-600/20",
    activeBorder: "border-orange-500",
    activeText: "text-orange-400",
    btnBg: "bg-orange-600 hover:bg-orange-700",
    focusRing: "focus:ring-orange-500",
  },
  {
    name: "critical",
    label: "Critical Failure",
    emoji: "💥",
    description: "Rapid spike — danger",
    steps: 10,
    color: "red",
    activeBg: "bg-red-600/20",
    activeBorder: "border-red-500",
    activeText: "text-red-400",
    btnBg: "bg-red-600 hover:bg-red-700",
    focusRing: "focus:ring-red-500",
  },
];

export default function ScenarioControls({ onStart, isRunning, demoRunning }: ScenarioControlsProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const allDisabled = isRunning || demoRunning;

  const handleStart = (name: string) => {
    setActiveScenario(name);
    onStart(name);
  };

  return (
    <div className="navy-card p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Simulation
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2 bg-cyan-600/20 rounded-lg px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.1em]">
              Streaming
            </span>
          </div>
        )}
      </div>

      {/* Scenario buttons */}
      <div className="space-y-2.5">
        {SCENARIOS.map((s) => {
          const isActive = isRunning && activeScenario === s.name;
          return (
            <button
              key={s.name}
              onClick={() => handleStart(s.name)}
              disabled={allDisabled}
              className={`group relative w-full text-left rounded-lg px-4 py-3.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-800 ${s.focusRing}
                ${isActive
                  ? `${s.activeBg} border ${s.activeBorder} !opacity-100`
                  : `${s.btnBg} text-white font-semibold shadow-sm hover:shadow-md`
                }
                disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  {s.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isActive ? s.activeText : "text-white"}`}>
                      {s.label}
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-white/20 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs leading-snug ${isActive ? "text-slate-400" : "text-white/70"}`}>
                      {s.description}
                    </span>
                    <span className={`text-[10px] font-mono ${isActive ? "text-slate-500" : "text-white/50"}`}>
                      · {s.steps} pts
                    </span>
                  </div>
                </div>
                {!isActive && (
                  <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-navy-700">
        <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isRunning ? "Data streaming every 3s via SSE" : "Select a scenario to start"}
        </p>
      </div>
    </div>
  );
}
