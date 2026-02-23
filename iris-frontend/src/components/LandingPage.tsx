import { useState, useEffect, useRef } from "react";

/* ── Animated Counter Hook ────────────────────────────────────────── */
function useCounter(end: number, duration = 1800, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = Math.max(1, Math.floor(end / (duration / 16)));
      const id = setInterval(() => {
        start += step;
        if (start >= end) { setCount(end); clearInterval(id); }
        else setCount(start);
      }, 16);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);
  return count;
}

/* ── Live Particle Canvas ─────────────────────────────────────────── */
function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr); };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${p.o})`;
        ctx.fill();
      }
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* ── Metrics Strip ────────────────────────────────────────────────── */
const METRICS = [
  { value: 4, suffix: "", label: "AI Agents", icon: "M9.75 3.1v5.71a2.25 2.25 0 01-.66 1.59L5 14.5M9.75 3.1c-.25.02-.5.05-.75.08m.75-.08a24.3 24.3 0 014.5 0m0 0v5.71c0 .6.24 1.17.66 1.59L19.8 15.3M14.25 3.1c.25.02.5.05.75.08M19.8 15.3l-1.57.39A9.07 9.07 0 0112 15a9.07 9.07 0 00-6.23.69L5 14.5" },
  { value: 24, suffix: "/7", label: "Always On", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  { value: 2, suffix: "s", prefix: "<", label: "Response Time", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  { value: 100, suffix: "+", label: "Sensor Inputs", icon: "M9.35 14.65a3.75 3.75 0 010-5.3m5.3 0a3.75 3.75 0 010 5.3m-7.42 2.12a6.75 6.75 0 010-9.55m9.55 0a6.75 6.75 0 010 9.55" },
];

/* ── How It Works ─────────────────────────────────────────────────── */
const WORKFLOW = [
  { step: "01", title: "Ingest", desc: "Real-time sensor streams and edge-camera events flow into IRIS continuously.", color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
  { step: "02", title: "Analyze", desc: "Specialized agents evaluate stress, vibration, load, and environmental factors.", color: "from-violet-500/20 to-violet-600/5", accent: "text-violet-400", icon: "M9.75 3.1v5.71a2.25 2.25 0 01-.66 1.59L5 14.5m4.75-11.4c-.25.02-.5.05-.75.08m.75-.08a24.3 24.3 0 014.5 0" },
  { step: "03", title: "Decide", desc: "Explainable engine escalates: MONITOR → WARN → RESTRICT → EVACUATE.", color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400", icon: "M12 9v3.75m0-10.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75" },
  { step: "04", title: "Alert", desc: "Critical risk states trigger instant alerts and coordinated emergency response.", color: "from-red-500/20 to-red-600/5", accent: "text-red-400", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
];

/* ── Feature Grid ─────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "M9.35 14.65a3.75 3.75 0 010-5.3m5.3 0a3.75 3.75 0 010 5.3m-7.42 2.12a6.75 6.75 0 010-9.55m9.55 0a6.75 6.75 0 010 9.55M5.11 18.89c-3.81-3.81-3.81-9.98 0-13.79m13.79 0c3.81 3.81 3.81 9.98 0 13.79M12 12h.01v.01H12V12z", title: "Real-Time Sensors", desc: "SSE streams from strain gauges, accelerometers, and traffic load sensors.", gradient: "from-blue-500/10 to-transparent", tag: "LIVE" },
  { icon: "M2.04 12.32a1.01 1.01 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z", title: "Edge AI Vision", desc: "Computer vision at the edge detects cracks, tilt, and structural anomalies.", gradient: "from-violet-500/10 to-transparent", tag: "AI" },
  { icon: "M9.75 3.1v5.71a2.25 2.25 0 01-.66 1.59L5 14.5m14.8.8l1.4 1.4c1.23 1.23.65 3.32-1.07 3.61A48.3 48.3 0 0112 21c-2.77 0-5.49-.24-8.14-.69-1.72-.29-2.3-2.38-1.07-3.61L5 14.5", title: "Multi-Agent Pipeline", desc: "Ingest → Score → Decide → Alert. Modular, explainable, and safety-critical.", gradient: "from-emerald-500/10 to-transparent", tag: "CORE" },
  { icon: "M12 9v3.75m0-10.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75h-.15c-3.2 0-6.1-1.25-8.25-3.29z", title: "Smart Escalation", desc: "Deterministic, auditable escalation — no black-box uncertainty.", gradient: "from-amber-500/10 to-transparent", tag: "SAFE" },
  { icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z", title: "Live Dashboard", desc: "Visualize risk scores, contributing factors, and action recommendations.", gradient: "from-blue-500/10 to-transparent", tag: "VIZ" },
  { icon: "M19.5 14.25v-2.63a3.38 3.38 0 00-3.38-3.38h-1.5A1.13 1.13 0 0113.5 7.13v-1.5A3.38 3.38 0 0010.13 2.25H8.25m2.25 0H5.63c-.62 0-1.13.5-1.13 1.13v17.25c0 .62.5 1.13 1.13 1.13h12.75c.62 0 1.13-.5 1.13-1.13V11.25a9 9 0 00-9-9z", title: "Instant Reports", desc: "Auto-generate structured incident summaries for authorities.", gradient: "from-rose-500/10 to-transparent", tag: "PDF" },
];

/* ── Trusted / Tech Stack ─────────────────────────────────────────── */
const TECH = ["FastAPI", "React 19", "PyTorch", "SSE", "TailwindCSS", "Pydantic v2"];

/* ── Component ────────────────────────────────────────────────────── */
interface LandingPageProps { onEnter: () => void; onDamageScan?: () => void; }

export default function LandingPage({ onEnter, onDamageScan }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const agents = useCounter(4, 1200, 600);
  const sensors = useCounter(100, 1800, 800);
  const responseTime = useCounter(2, 800, 1000);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col relative overflow-x-hidden">
      {/* ── Background Effects (multi-layer) ───────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <ParticleField />
        {/* Primary hero glow */}
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px] bg-blue-500/[0.05] rounded-full blur-[200px] animate-[pulse_8s_ease-in-out_infinite]" />
        {/* Secondary accent glows */}
        <div className="absolute top-[25%] right-[-5%] w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-[65%] left-[-5%] w-[400px] h-[400px] bg-blue-500/[0.025] rounded-full blur-[120px]" />
        {/* Radial dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(rgba(96,165,250,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Horizon line */}
        <div className="absolute top-[45%] inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        {/* Top + Bottom edge accents */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
      </div>

      {/* ── Top Bar ────────────────────────────────────── */}
      <header className={`relative z-10 px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
        <div className="flex items-center gap-3.5">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/20">
            <span className="text-white font-black text-[11px] leading-none tracking-tight">IR</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[17px] font-extrabold text-white tracking-wide">IRIS</span>
            <span className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase hidden sm:inline">v1.0</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
          <button onClick={() => document.getElementById('section-hazards')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Modules</button>
          <button onClick={() => document.getElementById('section-features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Features</button>
          <button onClick={() => document.getElementById('section-pipeline')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Pipeline</button>
          <button onClick={() => document.getElementById('section-about')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">About</button>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 sm:px-10 lg:px-16">

        {/* Hero Content */}
        <div className={`max-w-4xl w-full text-center pt-14 sm:pt-16 lg:pt-20 pb-10 sm:pb-14 transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/[0.1] to-violet-500/[0.05] border border-blue-500/20 rounded-full px-6 py-2.5 mb-10 sm:mb-12 backdrop-blur-sm">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-400 animate-ping opacity-50" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-300/90 uppercase tracking-[0.25em]">Intelligent Risk &amp; Structural Analysis</span>
          </div>

          {/* Main Headline */}
          <h1 className={`text-[2.75rem] sm:text-[3.75rem] lg:text-[4.5rem] font-black text-white leading-[1.05] tracking-[-0.03em] mb-5 sm:mb-6 transition-all duration-1000 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Infrastructure Risk
            <br />
            <span className="text-gradient-iris relative">
              Intelligence System
              <svg className="absolute -bottom-2 left-0 w-full h-3 opacity-30" viewBox="0 0 300 12" preserveAspectRatio="none">
                <path d="M0 6 Q75 0 150 6 Q225 12 300 6" fill="none" stroke="url(#hero-underline)" strokeWidth="2" />
                <defs><linearGradient id="hero-underline" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0" /><stop offset="50%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`text-sm sm:text-[17px] lg:text-lg text-slate-400 max-w-[620px] mx-auto leading-[1.8] mb-8 sm:mb-10 transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            A modular infrastructure risk intelligence platform that transforms
            live sensor and vision inputs into actionable safety responses — <span className="text-white font-semibold">in under 2&nbsp;seconds</span>.
          </p>

          {/* CTA Button */}
          <div className={`flex items-center justify-center transition-all duration-1000 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <button
              onClick={onEnter}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white px-10 sm:px-14 py-4 sm:py-[18px] rounded-2xl text-sm sm:text-[15px] font-extrabold tracking-wide shadow-2xl shadow-blue-500/30 hover:shadow-blue-400/50 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300 cursor-pointer ring-1 ring-blue-400/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative">Open Live Dashboard</span>
              <svg className="relative w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Multi-Hazard Monitoring Section ──────────── */}
        <div id="section-hazards" className={`max-w-5xl w-full mb-16 sm:mb-20 scroll-mt-20 transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/[0.06] border border-blue-500/15 rounded-full px-4 py-1.5 mb-4">
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="text-[8px] font-bold text-blue-400/80 uppercase tracking-[0.25em]">Platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Multi-Hazard Monitoring Platform
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
              IRIS ingests structural, seismic, environmental, and vision-based risk signals — transforming them into unified, actionable safety decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1 — Structural Monitoring */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-navy-900/60 shadow-lg shadow-blue-500/[0.04] hover:border-blue-500/35 hover:shadow-xl hover:shadow-blue-500/[0.1] hover:translate-y-[-4px] transition-all duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/[0.08] border border-blue-500/15 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/15 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 21V3.75a.75.75 0 01.75-.75h6a.75.75 0 01.75.75V21M3.75 21h7.5M13.5 21V10.5a.75.75 0 01.75-.75h5.25a.75.75 0 01.75.75V21M13.5 21h7.5" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-black tracking-[0.15em] px-2.5 py-1 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400">LIVE</span>
                </div>
                <h3 className="text-[14px] font-bold text-white mb-2.5 leading-snug">Structural Monitoring</h3>
                <p className="text-[11px] text-slate-500 leading-[1.75] mb-6">
                  Live stress, vibration, load, and environmental sensor analysis with rule-based emergency escalation.
                </p>
                <button
                  onClick={onEnter}
                  className="group/btn inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide border border-blue-500/20 hover:border-blue-400/35 transition-all duration-300 cursor-pointer"
                >
                  Open Live Dashboard
                  <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Card 2 — Vision Damage Assessment */}
            <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-navy-900/60 shadow-lg shadow-violet-500/[0.04] hover:border-violet-500/35 hover:shadow-xl hover:shadow-violet-500/[0.1] hover:translate-y-[-4px] transition-all duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/[0.08] border border-violet-500/15 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/15 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-all duration-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1.01 1.01 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-black tracking-[0.15em] px-2.5 py-1 rounded-lg border bg-violet-500/10 border-violet-500/20 text-violet-400">AI</span>
                </div>
                <h3 className="text-[14px] font-bold text-white mb-2.5 leading-snug">Vision Damage Assessment</h3>
                <p className="text-[11px] text-slate-500 leading-[1.75] mb-6">
                  Upload structural images to detect crack patterns and inject visual risk signals into IRIS.
                </p>
                {onDamageScan ? (
                  <button
                    onClick={onDamageScan}
                    className="group/btn inline-flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide border border-violet-500/20 hover:border-violet-400/35 transition-all duration-300 cursor-pointer"
                  >
                    Open Damage Scan
                    <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={onEnter}
                    className="group/btn inline-flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide border border-violet-500/20 hover:border-violet-400/35 transition-all duration-300 cursor-pointer"
                  >
                    Open Damage Scan
                    <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Card 3 — Seismic & Flood Monitoring (Coming Soon) */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-500/[0.03] to-navy-900/60 opacity-60 transition-all duration-500 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent" />
              {/* Diagonal "Coming Soon" ribbon */}
              <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none">
                <div className="absolute top-[14px] right-[-32px] w-[140px] text-center rotate-45 bg-emerald-500/20 border-y border-emerald-500/25 py-[3px]">
                  <span className="text-[7px] font-black text-emerald-400/80 uppercase tracking-[0.15em]">Coming Soon</span>
                </div>
              </div>
              <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-slate-500/[0.06] border border-slate-500/15 flex items-center justify-center text-slate-500 transition-all duration-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12c1.5-3 3-4 4.5-1s3 3 4.5 0 3-4 4.5-1 3 3 4.5 0" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-black tracking-[0.15em] px-2.5 py-1 rounded-lg border bg-slate-500/10 border-slate-500/20 text-slate-500">SOON</span>
                </div>
                <h3 className="text-[14px] font-bold text-slate-400 mb-2.5 leading-snug">Seismic &amp; Flood Monitoring</h3>
                <p className="text-[11px] text-slate-600 leading-[1.75] mb-6">
                  Ingest earthquake acceleration and water-level data to evaluate environmental risk in real time.
                </p>
                <button
                  disabled
                  className="inline-flex items-center gap-2 bg-slate-500/5 text-slate-600 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide border border-slate-500/10 cursor-not-allowed"
                >
                  Coming Soon
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Gradient Divider ─────────────────────────── */}
        <div className="w-full max-w-5xl mb-20 sm:mb-28">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
        </div>

        {/* ── Animated Metrics Strip ───────────────────── */}
        <div className={`w-full max-w-4xl mb-24 sm:mb-32 transition-all duration-1000 delay-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {METRICS.map((m, i) => {
              const counters = [agents, 24, responseTime, sensors];
              return (
                <div key={m.label} className="group relative bg-navy-900/50 backdrop-blur-md border border-navy-700/30 hover:border-blue-500/25 rounded-2xl px-5 py-6 sm:py-7 text-center transition-all duration-500 hover:translate-y-[-3px] hover:shadow-lg hover:shadow-blue-500/[0.05] overflow-hidden">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="flex justify-center mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/[0.08] border border-blue-500/15 flex items-center justify-center text-blue-400/60 group-hover:text-blue-400 group-hover:bg-blue-500/15 transition-all duration-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl sm:text-[34px] font-black text-white tabular-nums leading-none mb-2 font-mono">
                      {m.prefix || ""}{counters[i]}{m.suffix}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{m.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tech Stack Ticker ─────────────────────────── */}
        <div className="w-full max-w-3xl mb-20 sm:mb-28">
          <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-5">Built With</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {TECH.map((t) => (
              <span key={t} className="px-4 py-2 rounded-full bg-navy-900/40 border border-navy-700/25 text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 hover:text-blue-400 hover:border-blue-500/20 transition-all duration-300 cursor-default backdrop-blur-sm">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Gradient Divider ─────────────────────────── */}
        <div className="w-full max-w-5xl mb-20 sm:mb-28">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
        </div>

        {/* ── How It Works (with animated pipeline) ─────── */}
        <div id="section-pipeline" className="max-w-5xl w-full mb-24 sm:mb-32 scroll-mt-20">
          <div className="text-center mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/[0.06] border border-blue-500/15 rounded-full px-4 py-1.5 mb-4">
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="text-[8px] font-bold text-blue-400/80 uppercase tracking-[0.25em]">Process</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How IRIS Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
              From raw sensor data to coordinated emergency response in four stages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5 relative">
            {/* Pipeline connector line (desktop) */}
            <div className="hidden sm:block absolute top-[52px] left-[12%] right-[12%] h-px">
              <div className="h-full bg-gradient-to-r from-blue-500/20 via-violet-500/20 via-amber-500/15 to-red-500/20" />
              <div className="absolute inset-0 h-full bg-gradient-to-r from-blue-400 to-blue-400 animate-[shimmer_3s_ease-in-out_infinite]" style={{ width: "30%", filter: "blur(4px)", opacity: 0.3 }} />
            </div>

            {WORKFLOW.map((w, i) => (
              <div key={w.step} className="group relative flex flex-col items-center text-center rounded-2xl bg-gradient-to-b from-navy-800/50 to-navy-900/30 border border-navy-700/25 hover:border-blue-500/20 p-6 sm:p-7 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-blue-500/[0.04] backdrop-blur-sm overflow-hidden">
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${w.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative">
                  {/* Step circle */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${w.color} border border-white/[0.06] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                    <svg className={`w-5 h-5 ${w.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={w.icon} />
                    </svg>
                  </div>
                  <div className={`text-[9px] font-mono font-black ${w.accent} mb-2 tracking-[0.2em]`}>STEP {w.step}</div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-white mb-2.5">{w.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-[1.7]">{w.desc}</p>
                </div>

                {/* Mobile connector */}
                {i < 3 && (
                  <div className="sm:hidden my-4 flex flex-col items-center gap-1">
                    <div className="w-px h-4 bg-gradient-to-b from-navy-600 to-transparent" />
                    <svg className="w-3 h-3 text-navy-600 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Gradient Divider ─────────────────────────── */}
        <div className="w-full max-w-5xl mb-20 sm:mb-28">
          <div className="h-px bg-gradient-to-r from-transparent via-navy-600/40 to-transparent" />
        </div>

        {/* ── Feature Grid — Premium Cards ──────────────── */}
        <div id="section-features" className="max-w-5xl w-full mb-24 sm:mb-32 scroll-mt-20">
          <div className="text-center mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/[0.06] border border-blue-500/15 rounded-full px-4 py-1.5 mb-4">
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="text-[8px] font-bold text-blue-400/80 uppercase tracking-[0.25em]">Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Core Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
              Everything needed for intelligent infrastructure safety monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`
                  group relative overflow-hidden rounded-2xl border text-left backdrop-blur-sm
                  transition-all duration-500 cursor-default
                  ${hoveredFeature === i
                    ? "border-blue-500/25 bg-navy-800/70 shadow-xl shadow-blue-500/[0.06] translate-y-[-4px]"
                    : "border-navy-700/30 bg-navy-900/40 hover:border-navy-600/50"
                  }
                `}
              >
                {/* Animated gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-500 ${hoveredFeature === i ? "opacity-100" : ""}`} />
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${f.gradient} opacity-0 transition-opacity duration-500 rounded-bl-full ${hoveredFeature === i ? "opacity-60" : ""}`} />

                <div className="relative p-6 sm:p-7">
                  {/* Top row: icon + tag */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-500 ${
                      hoveredFeature === i
                        ? "bg-blue-500/15 border-blue-500/25 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "bg-navy-800/60 border-navy-700/40 text-slate-500"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                      </svg>
                    </div>
                    <span className={`text-[8px] font-black tracking-[0.15em] px-2.5 py-1 rounded-lg border transition-all duration-500 ${
                      hoveredFeature === i
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-navy-800/40 border-navy-700/30 text-slate-600"
                    }`}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-white mb-2.5 leading-snug">{f.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-[1.75]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Big CTA Section ──────────────────────────── */}
        <div id="section-about" className="max-w-4xl w-full text-center mb-20 sm:mb-28 scroll-mt-20">
          <div className="relative py-16 sm:py-20 px-8 sm:px-14 rounded-3xl bg-gradient-to-b from-navy-800/50 to-navy-900/25 border border-navy-700/25 overflow-hidden backdrop-blur-sm">
            {/* Animated background orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-500/[0.06] rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-[20%] w-[200px] h-[200px] bg-violet-500/[0.03] rounded-full blur-[80px]" />
            {/* Decorative dots */}
            <div className="absolute top-4 left-4 grid grid-cols-3 gap-1.5 opacity-20">
              {Array.from({length: 9}).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />)}
            </div>
            <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1.5 opacity-20">
              {Array.from({length: 9}).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />)}
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-blue-500/[0.08] border border-blue-500/15 rounded-full px-4 py-1.5 mb-6">
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span className="text-[8px] font-bold text-blue-400/80 uppercase tracking-[0.2em]">Ready</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-black text-white mb-5 tracking-tight leading-snug">
                From Detection to Decision
                <br />
                <span className="text-gradient-iris">In Seconds, Not Hours</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-[1.85] max-w-lg mx-auto mb-10">
                Most systems detect anomalies. IRIS ensures those detections become
                coordinated, explainable, and <span className="text-white font-medium">life-saving action</span>.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onEnter}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white px-10 py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-2xl shadow-blue-500/25 hover:shadow-blue-400/40 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer ring-1 ring-blue-400/25"
                >
                  Launch Dashboard
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-7 border-t border-white/[0.04] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[7px]">IR</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium tracking-wide">
              IRIS v1.0 &mdash; Multi-Agent Intelligent Risk &amp; Structural Analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-700 font-mono tracking-wider">Hackathon 2026</span>
            <div className="w-px h-3 bg-navy-700" />
            <span className="text-[10px] text-slate-700 font-mono tracking-wider">Chennai, India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
