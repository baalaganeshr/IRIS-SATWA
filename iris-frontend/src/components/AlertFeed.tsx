import { useEffect, useRef, useState } from "react";
import type { Alert } from "../types/schemas";

/* ── Severity Styles ──────────────────────────────────────────────── */

const SEVERITY: Record<string, {
  border: string;
  badge: string;
  dot: string;
  bg: string;
  icon: string;
}> = {
  ORANGE: {
    border: "border-l-orange-500",
    badge: "bg-orange-500/10 text-orange-400",
    dot: "bg-orange-500",
    bg: "hover:bg-orange-500/[0.03]",
    icon: "⚠️",
  },
  RED: {
    border: "border-l-red-500",
    badge: "bg-red-500/10 text-red-400",
    dot: "bg-red-500 animate-pulse",
    bg: "hover:bg-red-500/[0.03]",
    icon: "🚨",
  },
};

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return formatTime(iso);
  } catch {
    return iso;
  }
}

/* ── Component ────────────────────────────────────────────────────── */

interface AlertFeedProps {
  alerts: Alert[];
}

export default function AlertFeed({ alerts }: AlertFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  const filtered = alerts.filter(
    (a) => a.severity === "ORANGE" || a.severity === "RED"
  );
  const redCount = filtered.filter((a) => a.severity === "RED").length;
  const orangeCount = filtered.filter((a) => a.severity === "ORANGE").length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [filtered.length]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="navy-card p-6 flex flex-col animate-fade-in-up" style={{ maxHeight: "520px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alert Feed
        </h2>
        {filtered.length > 0 && (
          <div className="flex items-center gap-1.5">
            {redCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {redCount}
              </span>
            )}
            {orangeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {orangeCount}
              </span>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-emerald-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="w-12 h-px bg-navy-700 mb-4" />
          <p className="text-sm font-semibold text-white">All Clear</p>
          <p className="text-xs text-slate-500 mt-1.5 text-center max-w-[200px]">
            No critical alerts at this time
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((alert, i) => {
            const s = SEVERITY[alert.severity] ?? SEVERITY.RED;
            const isNew = i === 0;
            return (
              <div
                key={`${alert.timestamp}-${i}`}
                className={`relative border-l-4 ${s.border} ${s.bg} bg-navy-900/50 rounded-r-lg p-3.5 transition-all duration-300
                  ${isNew ? "animate-slide-in" : "animate-fade-in"}`}
                style={{ animationDelay: isNew ? "0ms" : `${Math.min(i * 40, 200)}ms` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">{s.icon}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-[2px] rounded-md ${s.badge} flex-shrink-0 tracking-wider`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-semibold text-white truncate">
                      {alert.title}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className="text-[10px] text-slate-500 tabular-nums font-mono">
                      {timeAgo(alert.timestamp)}
                    </span>
                    <span className="text-[9px] text-slate-600 tabular-nums font-mono">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-7">
                  {alert.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
