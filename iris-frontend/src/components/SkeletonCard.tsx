/* ── Skeleton Loading Components ───────────────────────────────────── */

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`bg-navy-700/40 rounded animate-pulse ${className}`} />;
}

/* ── Metric Card Skeleton ─────────────────────────────────────────── */
export function SkeletonMetricCard() {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Pulse className="h-2.5 w-20" />
          <Pulse className="h-6 w-14" />
        </div>
        <Pulse className="w-9 h-9 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

/* ── Navy Card Skeleton ───────────────────────────────────────────── */
export function SkeletonNavyCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="navy-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Pulse className="w-4 h-4 rounded" />
        <Pulse className="h-3 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Pulse className={`h-2.5 ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Pipeline Skeleton ────────────────────────────────────────────── */
export function SkeletonPipeline() {
  return (
    <div className="navy-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Pulse className="w-4 h-4 rounded" />
        <Pulse className="h-3 w-28" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <Pulse className="flex-1 h-14 rounded-lg" />
            {i < 4 && <Pulse className="w-3 h-3 rounded-full flex-shrink-0" />}
          </div>
        ))}
      </div>
      <Pulse className="h-24 rounded-lg" />
    </div>
  );
}

/* ── Welcome Prompt (no data yet) ─────────────────────────────────── */
export function WelcomePrompt() {
  return (
    <div className="navy-card p-8 text-center animate-fade-in-up">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
        <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-white mb-2">Ready to Monitor</h3>
      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
        Click a scenario in the right panel to begin simulation, or connect the backend for live sensor data.
      </p>
      <div className="flex items-center justify-center gap-4 mt-5">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
          4 Agents Standing By
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          8 Sensors Online
        </div>
      </div>
    </div>
  );
}
