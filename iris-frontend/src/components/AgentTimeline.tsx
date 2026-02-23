import { useEffect, useRef } from "react";
import type { AgentLog } from "../types/schemas";

const AGENT_STYLE: Record<AgentLog["agent"], { bg: string; text: string; dot: string }> = {
  Ingestion:  { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400" },
  RiskScorer: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
  Decision:   { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400" },
  Alert:      { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400" },
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

interface AgentTimelineProps {
  logs: AgentLog[];
}

export default function AgentTimeline({ logs }: AgentTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <h3 className="section-title mb-3">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Agent Timeline
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[8px] text-cyan-400 font-bold">LIVE</span>
        </span>
      </h3>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-600">
          <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-[10px] font-mono">Awaiting agent activity…</span>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {logs.map((entry, i) => {
            const style = AGENT_STYLE[entry.agent];
            return (
              <div
                key={entry.id}
                className="flex items-start gap-2 bg-navy-900/50 rounded px-2.5 py-1.5 border border-navy-700/40 animate-slide-in"
                style={{ animationDelay: `${Math.min(i, 3) * 40}ms` }}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${style.dot}`} />
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${style.bg} ${style.text}`}>
                  {entry.agent}
                </span>
                <span className="text-[9px] font-mono text-slate-600 flex-shrink-0">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="text-[10px] font-mono text-slate-300 break-words">
                  {entry.message}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
