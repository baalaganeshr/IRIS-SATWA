import { useState } from "react";

/* ── Metrics Strip ────────────────────────────────────────────────── */

const METRICS = [
  {
    value: "4",
    label: "Modular Agents",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" />
      </svg>
    ),
  },
  {
    value: "24/7",
    label: "Continuous Monitoring",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "<2s",
    label: "Decision Response",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    value: "100+",
    label: "Sensor & Event Inputs",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
      </svg>
    ),
  },
];

/* ── How It Works ─────────────────────────────────────────────────── */

const WORKFLOW = [
  {
    step: "01",
    title: "Ingest",
    desc: "Live structural sensors and edge-camera detection events stream into IRIS via real-time channels.",
    color: "from-cyan-500/20 to-cyan-600/5",
    accent: "text-cyan-400",
  },
  {
    step: "02",
    title: "Analyze",
    desc: "Specialized agents evaluate stress, vibration, load, and environmental conditions using weighted risk logic.",
    color: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400",
  },
  {
    step: "03",
    title: "Decide",
    desc: "An explainable decision engine escalates conditions through MONITOR → WARN → RESTRICT → EVACUATE.",
    color: "from-violet-500/20 to-violet-600/5",
    accent: "text-violet-400",
  },
  {
    step: "04",
    title: "Alert",
    desc: "Critical risk states trigger instant alerts and coordinated emergency actions.",
    color: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-400",
  },
];

/* ── Feature Grid ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.788m13.788 0c3.808 3.808 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm0 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: "Real-Time Sensor Integration",
    desc: "SSE data streams from strain gauges, accelerometers, traffic load sensors, and environmental monitors.",
    gradient: "from-cyan-500/10 to-transparent",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Edge AI Event Integration",
    desc: "Computer vision modules running at the edge detect anomalies (e.g., cracks, abnormal tilt) and send structured alerts to IRIS.",
    gradient: "from-blue-500/10 to-transparent",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "Multi-Agent Decision Pipeline",
    desc: "Ingestion → Risk Scoring → Decision Logic → Alert Dispatch. Modular, explainable, and reliable for safety-critical systems.",
    gradient: "from-violet-500/10 to-transparent",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
      </svg>
    ),
    title: "Smart Escalation Protocol",
    desc: "Automatic, deterministic escalation ensures rapid response without black-box uncertainty.",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    title: "Live Operations Dashboard",
    desc: "Visualize risk scores, contributing factors, and recommended actions in real time.",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Instant Incident Reports",
    desc: "Generate structured incident summaries for authorities and stakeholders.",
    gradient: "from-rose-500/10 to-transparent",
  },
];

/* ── Component ────────────────────────────────────────────────────── */

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col relative overflow-hidden">
      {/* ── Background Effects ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary hero glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1100px] h-[800px] bg-cyan-500/[0.04] rounded-full blur-[180px]" />
        {/* Secondary accent glow */}
        <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute top-[60%] left-[5%] w-[350px] h-[350px] bg-violet-500/[0.015] rounded-full blur-[100px]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.35) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }} />
        {/* Top edge gradient */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>

      {/* ── Top Bar ────────────────────────────────────── */}
      <header className="relative z-10 px-6 sm:px-10 lg:px-14 py-5 flex items-center justify-between border-b border-white/[0.03]">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/20">
            <span className="text-white font-black text-xs leading-none tracking-tight">IR</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-extrabold text-white tracking-wide">IRIS</span>
            <span className="text-[9px] text-slate-600 font-semibold tracking-widest uppercase hidden sm:inline">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-500/[0.06] border border-emerald-500/15 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-[10px] text-emerald-400/80 font-semibold tracking-wide uppercase hidden sm:inline">Online</span>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 sm:px-10 lg:px-14">

        {/* Hero Content */}
        <div className="max-w-3xl w-full text-center pt-16 sm:pt-24 lg:pt-28 pb-14 sm:pb-20 animate-fade-in-up">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.04] border border-cyan-500/15 rounded-full px-5 py-2 mb-8 sm:mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-bold text-cyan-300/90 uppercase tracking-[0.2em]">Infrastructure Risk Intelligence System</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] font-black text-white leading-[1.08] tracking-[-0.02em] mb-6 sm:mb-7">
            Real-Time Bridge
            <br />
            <span className="text-gradient-iris">Safety Intelligence</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base lg:text-[17px] text-slate-400 max-w-[520px] mx-auto leading-[1.75] mb-10 sm:mb-12">
            A multi-agent emergency decision system that transforms live sensor and
            edge-camera events into actionable safety responses — in under 2&nbsp;seconds.
          </p>

          {/* CTA Button */}
          <button
            onClick={onEnter}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-navy-950 px-10 sm:px-12 py-3.5 sm:py-4 rounded-xl text-sm sm:text-[15px] font-extrabold tracking-wide shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 cursor-pointer ring-1 ring-cyan-400/30"
          >
            Open Live Dashboard
            <svg className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="w-full max-w-4xl mb-14 sm:mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-navy-600/50 to-transparent" />
        </div>

        {/* ── Metrics Strip ────────────────────────────── */}
        <div className="w-full max-w-3xl mb-20 sm:mb-24 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {METRICS.map((m) => (
              <div key={m.label} className="group relative bg-navy-900/60 backdrop-blur-sm border border-navy-700/30 hover:border-cyan-500/15 rounded-xl px-5 py-5 sm:py-6 text-center transition-all duration-300">
                <div className="flex justify-center mb-3 text-slate-600 group-hover:text-cyan-500/60 transition-colors duration-300">
                  {m.icon}
                </div>
                <div className="text-2xl sm:text-[28px] font-black text-white tabular-nums leading-none mb-1.5">{m.value}</div>
                <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-[0.18em]">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ─────────────────────────────── */}
        <div className="max-w-4xl w-full mb-20 sm:mb-24 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.3em] mb-2">Process</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            {WORKFLOW.map((w, i) => (
              <div key={w.step} className="group relative flex flex-col sm:items-center sm:text-center rounded-xl bg-gradient-to-b from-navy-800/50 to-navy-900/30 border border-navy-700/30 hover:border-cyan-500/15 p-5 sm:p-6 transition-all duration-300">
                {/* Step badge */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${w.color} border border-white/[0.06] flex items-center justify-center mb-3.5 sm:mb-4`}>
                  <span className={`text-[10px] font-mono font-extrabold ${w.accent}`}>{w.step}</span>
                </div>
                <h3 className="text-[13px] sm:text-sm font-bold text-white mb-2">{w.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-[1.65]">{w.desc}</p>
                {/* Connector arrow */}
                {i < 3 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-3 translate-x-1/2 -translate-y-1/2 w-5 h-5 items-center justify-center">
                    <svg className="w-3 h-3 text-navy-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="w-full max-w-5xl mb-20 sm:mb-24">
          <div className="h-px bg-gradient-to-r from-transparent via-navy-600/40 to-transparent" />
        </div>

        {/* ── Feature Grid ─────────────────────────────── */}
        <div className="max-w-5xl w-full mb-20 sm:mb-24 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.3em] mb-2">Features</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Core Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`
                  group relative overflow-hidden rounded-xl border text-left
                  transition-all duration-300 cursor-default
                  ${hoveredFeature === i
                    ? "border-cyan-500/20 bg-navy-800/60 shadow-lg shadow-cyan-500/[0.05] translate-y-[-2px]"
                    : "border-navy-700/30 bg-navy-900/40 hover:border-navy-600/40"
                  }
                `}
              >
                {/* Subtle gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-300 ${hoveredFeature === i ? "opacity-100" : ""}`} />

                <div className="relative p-5 sm:p-6">
                  {/* Icon container */}
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 transition-all duration-300 ${
                    hoveredFeature === i
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      : "bg-navy-800/60 border-navy-700/40 text-slate-500"
                  }`}>
                    {f.icon}
                  </div>
                  <h3 className="text-[13px] font-bold text-white mb-2 leading-snug">{f.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-[1.7]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Value Statement / CTA ────────────────────── */}
        <div className="max-w-3xl w-full text-center mb-16 sm:mb-20 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="relative py-14 sm:py-16 px-8 sm:px-12 rounded-2xl bg-gradient-to-b from-navy-800/40 to-navy-900/20 border border-navy-700/25 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-cyan-500/[0.04] rounded-full blur-[80px]" />

            <div className="relative">
              <h2 className="text-xl sm:text-2xl lg:text-[1.75rem] font-black text-white mb-4 tracking-tight leading-snug">
                From Detection to Decision — <span className="text-gradient-iris">in Seconds</span>
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-400 leading-[1.8] max-w-md mx-auto mb-8">
                Most systems detect anomalies.
                IRIS ensures those detections become coordinated, explainable action.
              </p>
              <button
                onClick={onEnter}
                className="group inline-flex items-center gap-2.5 text-cyan-400 hover:text-cyan-300 text-sm font-bold tracking-wide transition-colors duration-200 cursor-pointer"
              >
                Explore the Dashboard
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-slate-600 font-medium tracking-wide">
            IRIS v1.0 &mdash; Multi-Agent Infrastructure Risk Intelligence System
          </p>
          <p className="text-[10px] text-slate-700 font-mono tracking-wider">
            Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
