import { useState, useRef, useCallback } from "react";
import type { Decision, RiskAssessment } from "../types/schemas";

/* ── Types ────────────────────────────────────────────────────────── */
interface AnalysisResult {
  crack_confidence: number;
  note: string;
  overlay_image_base64?: string | null;
}

interface InjectResult {
  risk: RiskAssessment;
  decision: Decision;
}

/* ── Confidence color helper ──────────────────────────────────────── */
function confColor(c: number) {
  if (c >= 0.75) return "text-red-400";
  if (c >= 0.5) return "text-orange-400";
  if (c >= 0.25) return "text-amber-400";
  return "text-green-400";
}

function confBarColor(c: number) {
  if (c >= 0.75) return "bg-red-500";
  if (c >= 0.5) return "bg-orange-500";
  if (c >= 0.25) return "bg-amber-500";
  return "bg-emerald-500";
}

function confLabel(c: number) {
  if (c >= 0.75) return "CRITICAL";
  if (c >= 0.5) return "HIGH";
  if (c >= 0.25) return "MODERATE";
  return "LOW";
}

/* ── Component ────────────────────────────────────────────────────── */
interface DamageScanProps {
  onNavigate?: (page: string) => void;
}

export default function DamageScan({ onNavigate }: DamageScanProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [injectResult, setInjectResult] = useState<InjectResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── File selection ─────────────────────────────────────────────── */
  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please select a JPG or PNG image."); return; }
    setFile(f);
    setResult(null);
    setInjectResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  /* ── Drag & Drop ─────────────────────────────────────────────────── */
  const [dragOver, setDragOver] = useState(false);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }, [handleFile]);

  /* ── Analyze ─────────────────────────────────────────────────────── */
  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true); setError(null); setInjectResult(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/vision/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  /* ── Inject into pipeline ────────────────────────────────────────── */
  const handleInject = useCallback(async () => {
    if (!result) return;
    setInjecting(true); setError(null);
    try {
      const res = await fetch("/api/vision/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crack_confidence: result.crack_confidence }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInjectResult({ risk: data.risk, decision: data.decision });
    } catch (e: any) {
      setError(e.message || "Injection failed.");
    } finally {
      setInjecting(false);
    }
  }, [result]);

  /* ── Reset ───────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setFile(null); setPreview(null); setResult(null); setInjectResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  return (
    <div className="space-y-6 animate-enter">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1.01 1.01 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            Damage Scan
          </h2>
          <p className="text-xs text-slate-500 mt-1 ml-[42px]">Upload a structural image to detect surface cracks and inject findings into the IRIS pipeline.</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400 animate-enter flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left: Upload & Preview ───────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload zone */}
          <div className="navy-card p-6 animate-fade-in-up">
            <h3 className="section-title mb-4">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Image
            </h3>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${dragOver
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-navy-600 hover:border-cyan-500/40 hover:bg-navy-800/30"
                }
              `}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-cyan-500/20 text-cyan-400" : "bg-navy-700/50 text-slate-500"}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Drop image here or click to browse</p>
                  <p className="text-[10px] text-slate-600 mt-1">JPG / PNG — max 10 MB</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 font-bold text-xs py-2.5 rounded-lg transition-all border border-cyan-500/20 cursor-pointer"
              >
                {analyzing ? (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
                {analyzing ? "Analyzing..." : "Analyze Image"}
              </button>
              <button
                onClick={handleReset}
                disabled={!file}
                className="px-4 text-xs font-semibold text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Preview card */}
          {preview && (
            <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <h3 className="section-title mb-3">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91" />
                </svg>
                Original Image
              </h3>
              <img src={preview} alt="Upload preview" className="w-full rounded-lg border border-navy-700/50 object-contain max-h-[250px] bg-navy-950" />
            </div>
          )}
        </div>

        {/* ── Right: Results ───────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Analysis result */}
          {result ? (
            <>
              {/* Confidence card */}
              <div className="navy-card p-6 animate-fade-in-up">
                <h3 className="section-title mb-5">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.1v5.71a2.25 2.25 0 01-.66 1.59L5 14.5m4.75-11.4c-.25.02-.5.05-.75.08m.75-.08a24.3 24.3 0 014.5 0" />
                  </svg>
                  Crack Detection Result
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {/* Confidence score */}
                  <div className="bg-navy-950/60 rounded-xl border border-navy-700/40 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confidence</p>
                    <p className={`text-3xl font-black font-mono ${confColor(result.crack_confidence)}`}>
                      {(result.crack_confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Severity label */}
                  <div className="bg-navy-950/60 rounded-xl border border-navy-700/40 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Severity</p>
                    <p className={`text-lg font-extrabold ${confColor(result.crack_confidence)}`}>
                      {confLabel(result.crack_confidence)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="bg-navy-950/60 rounded-xl border border-navy-700/40 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                    <p className="text-sm font-semibold text-slate-300">{result.crack_confidence > 0.45 ? "Damage Detected" : "No Major Damage"}</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Crack Confidence</span>
                    <span className={`text-xs font-mono font-bold ${confColor(result.crack_confidence)}`}>{(result.crack_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-navy-700/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${confBarColor(result.crack_confidence)}`} style={{ width: `${result.crack_confidence * 100}%` }} />
                  </div>
                </div>

                {/* Note */}
                <div className="bg-navy-950/40 rounded-lg p-3 border border-navy-700/30">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-300">Note:</span> {result.note}
                  </p>
                </div>

                {/* Inject button */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleInject}
                    disabled={injecting}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/20 to-violet-500/10 hover:from-violet-600/30 hover:to-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-violet-300 font-bold text-xs py-3 rounded-xl transition-all border border-violet-500/25 cursor-pointer"
                  >
                    {injecting ? (
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    )}
                    {injecting ? "Injecting..." : "Inject into IRIS Pipeline"}
                  </button>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate("overview")}
                      className="px-5 text-xs font-semibold text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Go to Dashboard
                    </button>
                  )}
                </div>
              </div>

              {/* Overlay preview */}
              {result.overlay_image_base64 && (
                <div className="navy-card p-5 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                  <h3 className="section-title mb-3">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    Processed Overlay — Highlighted Regions
                  </h3>
                  <img
                    src={`data:image/png;base64,${result.overlay_image_base64}`}
                    alt="Damage overlay"
                    className="w-full rounded-lg border border-red-500/20 object-contain max-h-[300px] bg-navy-950"
                  />
                  <p className="text-[10px] text-slate-600 mt-2 text-center">Red regions indicate detected edge density (potential cracks)</p>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="navy-card p-10 flex flex-col items-center justify-center min-h-[350px] animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1.01 1.01 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">No Analysis Yet</p>
              <p className="text-xs text-slate-600 text-center max-w-xs">Upload a structural image and click "Analyze" to detect surface damage using edge-density AI.</p>
            </div>
          )}

          {/* Injection result */}
          {injectResult && (
            <div className="navy-card p-6 animate-fade-in-up border-violet-500/20" style={{ animationDelay: "200ms" }}>
              <h3 className="section-title mb-4">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pipeline Response
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-navy-950/50 rounded-xl border border-navy-700/40 p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Risk Score</p>
                  <p className={`text-2xl font-black font-mono ${
                    injectResult.risk.overall_score >= 75 ? "text-red-400" :
                    injectResult.risk.overall_score >= 50 ? "text-orange-400" :
                    injectResult.risk.overall_score >= 25 ? "text-amber-400" : "text-green-400"
                  }`}>
                    {injectResult.risk.overall_score}<span className="text-xs text-slate-500 ml-1">/100</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Level: <span className="font-bold text-white">{injectResult.risk.risk_level}</span></p>
                </div>
                <div className="bg-navy-950/50 rounded-xl border border-navy-700/40 p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Decision</p>
                  <p className={`text-lg font-extrabold ${
                    injectResult.decision.action === "EVACUATE" ? "text-red-400" :
                    injectResult.decision.action === "RESTRICT" ? "text-orange-400" :
                    injectResult.decision.action === "WARN" ? "text-amber-400" : "text-cyan-400"
                  }`}>
                    {injectResult.decision.action}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Urgency: <span className="font-bold text-white">{injectResult.decision.urgency}</span></p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 bg-navy-950/40 rounded-lg p-3 border border-navy-700/30 leading-relaxed">
                <span className="font-bold text-slate-300">Justification:</span> {injectResult.decision.justification}
              </p>

              {onNavigate && (
                <button
                  onClick={() => onNavigate("overview")}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs py-2.5 rounded-lg transition-all border border-cyan-500/20 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  </svg>
                  View Live Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
