import { useEffect, useState } from "react";
import type { RiskLevel } from "../types/schemas";
import type { ConnectionStatus } from "../api/sse";

/* ── Page Title Map ───────────────────────────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  overview: "Dashboard Overview",
  map: "Structural Risk Map",
  analytics: "Analytics Hub",
  stakeholders: "Stakeholders & Response",
  settings: "Settings",
};

/* ── Risk Level Styles ────────────────────────────────────────────── */

const LEVEL_TEXT_CLR: Record<RiskLevel, string> = {
  GREEN:  "text-emerald-400",
  YELLOW: "text-amber-400",
  ORANGE: "text-orange-400",
  RED:    "text-red-400",
};

const LEVEL_BG: Record<RiskLevel, string> = {
  GREEN:  "bg-emerald-500",
  YELLOW: "bg-amber-400",
  ORANGE: "bg-orange-500",
  RED:    "bg-red-500 animate-pulse-red",
};

/* ── Clock ────────────────────────────────────────────────────────── */

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="text-sm tabular-nums text-white font-mono font-semibold tracking-tight">
        {now.toLocaleTimeString("en-US", { hour12: false })}
      </span>
      <span className="text-[9px] text-slate-500 font-medium tracking-wide">
        {now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
    </div>
  );
}

/* ── Header Component ─────────────────────────────────────────────── */

interface HeaderProps {
  riskLevel: RiskLevel | null;
  connection: ConnectionStatus;
  currentPage: string;
}

export default function Header({ riskLevel, connection, currentPage }: HeaderProps) {
  return (
    <header className="bg-navy-950/80 backdrop-blur-md sticky top-0 z-20">
      {/* Accent line */}
      <div className="h-[2px] animated-border" />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-navy-700/50">

          {/* ── Left: Page Title ─────────────────────── */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-bold text-white whitespace-nowrap">
              {PAGE_TITLES[currentPage] ?? "Dashboard"}
            </h1>
          </div>

          {/* ── Center: Connection + Clock ─────────────────── */}
          <div className="hidden md:flex items-center space-x-4">
            {/* SSE Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${
              connection === "connected"
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : connection === "connecting"
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-cyan-500/10 border border-cyan-500/20"
            }`}>
              <div className="relative flex items-center justify-center w-2 h-2">
                <span className={`absolute w-2 h-2 rounded-full ${
                  connection === "connected" ? "bg-emerald-400" : connection === "connecting" ? "bg-amber-400 animate-pulse" : "bg-cyan-400 animate-pulse"
                }`} />
                {connection === "connected" && (
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${
                connection === "connected" ? "text-emerald-400" : connection === "connecting" ? "text-amber-400" : "text-cyan-400"
              }`}>
                {connection === "connected" ? "LIVE" : connection === "connecting" ? "CONNECTING" : "DEMO"}
              </span>
            </div>

            <div className="w-px h-5 bg-navy-700/50" />

            <LiveClock />
          </div>

          {/* ── Right: Risk Level Badge ────────────────────── */}
          <div className="flex items-center gap-3">
            {riskLevel ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800/80 border border-navy-700/50">
                <span className={`w-2 h-2 rounded-full ${LEVEL_BG[riskLevel]}`} />
                <span className={`text-xs font-black uppercase tracking-[0.15em] ${LEVEL_TEXT_CLR[riskLevel]}`}>
                  {riskLevel}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800/80 border border-navy-700/50">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  STANDBY
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
