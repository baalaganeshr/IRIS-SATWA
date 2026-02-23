import { useState, useEffect } from "react";
import type { Alert } from "../types/schemas";
import type { Structure } from "../data/structures";
import { getRiskColor, getRiskTextColor, getRiskBg, getTypeIcon } from "../data/structures";
import { exportStructuralReport, exportEmergencyProtocol } from "../utils/pdfExport";

/* ── Live Sensor Ticker ───────────────────────────────────────────── */

function LiveSensorTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const sensors = [
    { id: "S-01", name: "Accelerometer A1", unit: "m/s²", base: 0.12, range: 0.08 },
    { id: "S-02", name: "Strain Gauge G3", unit: "µε", base: 245, range: 30 },
    { id: "S-03", name: "Tiltmeter T1", unit: "°", base: 0.05, range: 0.02 },
    { id: "S-04", name: "Wind Speed W1", unit: "km/h", base: 18, range: 12 },
    { id: "S-05", name: "Temperature", unit: "°C", base: 32, range: 4 },
    { id: "S-06", name: "Humidity", unit: "%", base: 65, range: 15 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {sensors.map((s) => {
        const val = +(s.base + (Math.sin(tick * 0.5 + s.base) * s.range)).toFixed(2);
        const isHigh = val > s.base + s.range * 0.6;
        return (
          <div key={s.id} className={`bg-navy-900/50 rounded-lg px-3 py-2 border transition-colors duration-500 ${isHigh ? "border-orange-500/30" : "border-navy-700/50"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isHigh ? "bg-orange-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate">{s.name}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-sm font-bold font-mono tabular-nums ${isHigh ? "text-orange-400" : "text-white"}`}>{val}</span>
              <span className="text-[9px] text-slate-600">{s.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Breakdown Bars ───────────────────────────────────────────────── */

function SimulatedBreakdown({ riskLevel }: { riskLevel: number }) {
  const bars = [
    { label: "Structural Stress", value: Math.min(100, riskLevel + Math.round(Math.random() * 15 - 5)), color: "from-rose-600 to-red-400" },
    { label: "Vibration Index", value: Math.min(100, Math.round(riskLevel * 0.8 + Math.random() * 10)), color: "from-amber-600 to-yellow-400" },
    { label: "Load Factor", value: Math.min(100, Math.round(riskLevel * 0.6 + Math.random() * 20)), color: "from-blue-600 to-cyan-400" },
    { label: "Environmental", value: Math.min(100, Math.round(riskLevel * 0.5 + Math.random() * 15)), color: "from-teal-600 to-emerald-400" },
  ];

  return (
    <div className="space-y-3">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">{bar.label}</span>
            <span className={`text-xs font-bold font-mono ${bar.value >= 70 ? "text-red-400" : bar.value >= 50 ? "text-orange-400" : "text-slate-400"}`}>
              {bar.value}%
            </span>
          </div>
          <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${bar.color} bar-shimmer`} style={{ width: `${bar.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Full Report Modal ────────────────────────────────────────────── */

function FullReportModal({ structure, onClose }: { structure: Structure; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(structure.type)}</span>
            <div>
              <h2 className="text-lg font-bold text-white">{structure.name}</h2>
              <p className="text-xs text-slate-500 font-mono">{structure.id} &bull; Full Structural Report</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Banner */}
          <div className={`flex items-center justify-between rounded-xl p-4 ${getRiskBg(structure.riskLevel)} border ${structure.riskLevel >= 75 ? "border-red-500/20" : structure.riskLevel >= 50 ? "border-orange-500/20" : "border-navy-700"}`}>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall Risk Assessment</p>
              <p className={`text-3xl font-black font-mono mt-1 ${getRiskTextColor(structure.riskLevel)}`}>{structure.riskLevel}%</p>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-bold ${getRiskTextColor(structure.riskLevel)} ${getRiskBg(structure.riskLevel)}`}>{structure.status}</div>
          </div>

          {/* Engineering Specs */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Engineering Specifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Material", structure.details.material],
                ["Built Year", structure.details.built],
                ["Length", structure.details.length ?? "—"],
                ["Width", structure.details.width ?? "—"],
                ["Spans", String(structure.details.spans)],
                ["Load Capacity", structure.details.loadCapacity],
                ["Foundation", structure.details.foundation ?? "—"],
                ["Seismic Rating", structure.details.seismicRating ?? "—"],
                ["Traffic Load", structure.details.trafficLoad ?? "—"],
                ["Last Inspection", structure.details.lastInspection],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between bg-navy-900/60 rounded-lg px-3 py-2.5 border border-navy-700/50">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs text-white font-medium font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Analysis */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Structural Analysis</h3>
            <SimulatedBreakdown riskLevel={structure.riskLevel} />
          </div>

          {/* Maintenance History */}
          {structure.details.maintenanceHistory && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Maintenance History</h3>
              <div className="space-y-2">
                {structure.details.maintenanceHistory.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 bg-navy-900/40 rounded-lg px-3 py-2.5 border border-navy-700/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{entry}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">AI Recommendations</h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {structure.riskLevel >= 75 ? (
                <>
                  <li>• Immediate load restriction to 50% capacity recommended</li>
                  <li>• Deploy additional vibration sensors on critical spans</li>
                  <li>• Schedule emergency structural assessment within 48 hours</li>
                  <li>• Notify District Administration and Fire & Rescue services</li>
                </>
              ) : structure.riskLevel >= 50 ? (
                <>
                  <li>• Increase monitoring frequency to every 30 minutes</li>
                  <li>• Plan detailed inspection within 2 weeks</li>
                  <li>• Review and update emergency evacuation routes</li>
                </>
              ) : (
                <>
                  <li>• Continue standard monitoring protocols</li>
                  <li>• Next routine inspection scheduled per calendar</li>
                  <li>• All parameters within acceptable tolerance</li>
                </>
              )}
            </ul>
          </div>

          {/* Download PDF */}
          <button
            onClick={() => exportStructuralReport(structure)}
            className="btn-primary w-full"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Emergency Protocol Modal ─────────────────────────────────────── */

function EmergencyProtocolModal({ structure, onClose }: { structure: Structure; onClose: () => void }) {
  const isHighRisk = structure.riskLevel >= 50;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-400">Emergency Protocol</h2>
              <p className="text-xs text-slate-500">{structure.name} &bull; {structure.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Threat Level */}
          <div className={`text-center py-5 rounded-xl border ${isHighRisk ? "bg-red-500/8 border-red-500/20" : "bg-orange-500/8 border-orange-500/20"}`}>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Current Threat Level</p>
            <p className={`text-4xl font-black font-mono ${getRiskTextColor(structure.riskLevel)}`}>{structure.status.toUpperCase()}</p>
            <p className="text-sm text-slate-400 mt-2">Risk Score: <span className={`font-bold ${getRiskTextColor(structure.riskLevel)}`}>{structure.riskLevel}/100</span></p>
          </div>

          {/* Emergency Steps */}
          <div>
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Immediate Action Steps</h3>
            <div className="space-y-2">
              {[
                { step: 1, action: "Activate emergency alert to all nearby stakeholders", icon: "📡", status: isHighRisk ? "urgent" : "standby" },
                { step: 2, action: "Restrict vehicular and pedestrian access within 200m radius", icon: "🚧", status: isHighRisk ? "urgent" : "standby" },
                { step: 3, action: "Deploy Fire & Rescue teams to standby positions", icon: "🚒", status: isHighRisk ? "urgent" : "ready" },
                { step: 4, action: "Initiate evacuation of nearby critical buildings", icon: "🏃", status: structure.riskLevel >= 75 ? "urgent" : "standby" },
                { step: 5, action: "Notify District Collector and Chennai Police Commissioner", icon: "📞", status: isHighRisk ? "urgent" : "standby" },
                { step: 6, action: "Activate medical emergency response at Rajiv Gandhi Govt. Hospital", icon: "🏥", status: structure.riskLevel >= 75 ? "urgent" : "standby" },
                { step: 7, action: "Set up command post and communication channels", icon: "📋", status: isHighRisk ? "ready" : "standby" },
              ].map(({ step, action, icon, status }) => (
                <div key={step} className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
                  status === "urgent" ? "bg-red-500/8 border-red-500/15" : status === "ready" ? "bg-amber-500/5 border-amber-500/15" : "bg-navy-900/50 border-navy-700/50"
                }`}>
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <span className="flex-1 text-sm text-slate-200">{action}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    status === "urgent" ? "bg-red-500/15 text-red-400" : status === "ready" ? "bg-amber-500/15 text-amber-400" : "bg-navy-700 text-slate-500"
                  }`}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contacts</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Chennai Police Control", "+91 44 2345 0000"],
                ["TN Fire & Rescue", "+91 44 2538 5000"],
                ["District Collector, Chennai", "+91 44 2536 1001"],
                ["Rajiv Gandhi Govt. Hospital", "+91 44 2530 5000"],
              ].map(([name, phone]) => (
                <div key={name} className="bg-navy-900/50 rounded-lg px-3 py-2.5 border border-navy-700/50">
                  <p className="text-xs text-slate-500">{name}</p>
                  <p className="text-sm text-cyan-400 font-mono font-medium">{phone}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evacuation Zones */}
          <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Evacuation Zone Info</h3>
            <div className="grid grid-cols-3 gap-3 text-center mt-3">
              <div>
                <p className="text-xl font-black text-red-400 font-mono">200m</p>
                <p className="text-[10px] text-slate-500 uppercase">Exclusion Zone</p>
              </div>
              <div>
                <p className="text-xl font-black text-orange-400 font-mono">500m</p>
                <p className="text-[10px] text-slate-500 uppercase">Caution Zone</p>
              </div>
              <div>
                <p className="text-xl font-black text-amber-400 font-mono">1km</p>
                <p className="text-[10px] text-slate-500 uppercase">Alert Zone</p>
              </div>
            </div>
          </div>

          {/* Download PDF */}
          <button
            onClick={() => exportEmergencyProtocol(structure)}
            className="btn-danger w-full"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Protocol as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

interface BridgeMapProps {
  structures: Structure[];
  alerts: Alert[];
  activeStructureId?: string | null;
}

export default function BridgeMap({ structures, alerts, activeStructureId }: BridgeMapProps) {
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [hoveredStructure, setHoveredStructure] = useState<Structure | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  /* Auto-select structure when demo cycles to it */
  useEffect(() => {
    if (activeStructureId) {
      const target = structures.find((s) => s.id === activeStructureId) ?? null;
      setSelectedStructure(target);
    } else {
      setSelectedStructure(null);
    }
  }, [activeStructureId, structures]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  const filteredAlerts = alerts.filter((a) => a.severity === "ORANGE" || a.severity === "RED");

  return (
    <div className="h-full flex flex-col gap-5 animate-enter">
      {/* Modals */}
      {showReport && selectedStructure && <FullReportModal structure={selectedStructure} onClose={() => setShowReport(false)} />}
      {showEmergency && selectedStructure && <EmergencyProtocolModal structure={selectedStructure} onClose={() => setShowEmergency(false)} />}

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ── Map Area ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="navy-card p-5 flex-grow">
            <h3 className="section-title mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Structural Risk Map
            </h3>

            {/* Live Sensor Readings */}
            <div className="mb-4">
              <LiveSensorTicker />
            </div>

            <div
              className="relative w-full bg-navy-950 rounded-xl border border-navy-700/60"
              style={{ height: "560px", overflow: "hidden", cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Zoom Controls — compact bottom-left */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-navy-900/95 backdrop-blur-sm rounded-lg px-1.5 py-1 border border-navy-700/60 shadow-lg">
                <button onClick={handleZoomOut} className="w-6 h-6 rounded bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer" title="Zoom Out">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </button>
                <div className="px-1.5 text-[9px] font-bold text-cyan-400 font-mono tabular-nums min-w-[36px] text-center">
                  {Math.round(zoom * 100)}%
                </div>
                <button onClick={handleZoomIn} className="w-6 h-6 rounded bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer" title="Zoom In">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button onClick={handleZoomReset} className="w-6 h-6 rounded bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer" title="Reset">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                </button>
              </div>

              {/* City label — fixed overlay */}
              <div className="absolute top-2 left-2 bg-navy-900/90 text-cyan-400 px-2 py-1 rounded-lg font-mono text-[10px] border border-navy-700/60 backdrop-blur-sm z-20">
                🌆 IRIS Risk Map — Chennai
              </div>

              {/* LIVE badge — fixed overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                <div className="bg-navy-900/90 text-slate-400 px-2 py-0.5 rounded text-[8px] font-mono border border-navy-700/60 backdrop-blur-sm">
                  5 Structures &bull; 10 Detections
                </div>
                <div className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </div>
              </div>

              {/* Coordinates — fixed overlay */}
              <div className="absolute bottom-2 left-2 bg-navy-900/90 text-slate-500 px-2 py-1 rounded text-[8px] font-mono border border-navy-700/60 backdrop-blur-sm z-20">
                13.0827° N, 80.2707° E &bull; {Math.round(14 * zoom)}x
              </div>

              {/* Legend — fixed overlay */}
              <div className="absolute bottom-2 right-2 bg-navy-900/90 text-white text-[9px] rounded-lg p-2 border border-navy-700/60 backdrop-blur-sm z-20">
                <div className="font-bold text-cyan-400 mb-1.5 text-[10px]">Risk Levels</div>
                <div className="space-y-1">
                  {[
                    ["bg-green-500", "Low"],
                    ["bg-yellow-500", "Elevated"],
                    ["bg-orange-500", "High"],
                    ["bg-red-500", "Critical"],
                  ].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoomable/Pannable Inner Container — absolute fills parent */}
              <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: "center center", transition: isPanning ? "none" : "transform 0.2s ease-out" }}>

              {/* Grid background — denser, more visible */}
              <div className="absolute inset-0 opacity-25" style={{
                backgroundImage: `
                  linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px),
                  linear-gradient(rgba(30,40,58,0.4) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(30,40,58,0.4) 1px, transparent 1px)
                `,
                backgroundSize: "200px 200px, 200px 200px, 40px 40px, 40px 40px"
              }} />

              {/* SVG River / Water body */}
              <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="river-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                {/* River path */}
                <path d="M 0 200 Q 150 180, 250 210 Q 400 250, 500 220 Q 650 180, 750 200 Q 900 230, 1000 210" fill="none" stroke="url(#river-grad)" strokeWidth="50" strokeLinecap="round" />
                <path d="M 0 200 Q 150 180, 250 210 Q 400 250, 500 220 Q 650 180, 750 200 Q 900 230, 1000 210" fill="none" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              </svg>

              {/* Major Roads */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Horizontal roads */}
                <div className="absolute w-full" style={{ top: "22%", height: "3px", background: "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
                <div className="absolute w-full" style={{ top: "48%", height: "3px", background: "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
                <div className="absolute w-full" style={{ top: "72%", height: "3px", background: "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
                {/* Vertical roads */}
                <div className="absolute h-full" style={{ left: "28%", width: "3px", background: "linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
                <div className="absolute h-full" style={{ left: "53%", width: "3px", background: "linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
                <div className="absolute h-full" style={{ left: "76%", width: "3px", background: "linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.15) 80%, transparent 100%)" }} />
              </div>

              {/* Street Names */}
              <div className="absolute pointer-events-none" style={{ top: "19%", left: "40%" }}>
                <span className="text-[8px] text-slate-600 font-mono tracking-widest uppercase">Anna Salai</span>
              </div>
              <div className="absolute pointer-events-none" style={{ top: "45%", left: "18%" }}>
                <span className="text-[8px] text-slate-600 font-mono tracking-widest uppercase">Kamarajar Salai</span>
              </div>
              <div className="absolute pointer-events-none" style={{ top: "69%", left: "60%" }}>
                <span className="text-[8px] text-slate-600 font-mono tracking-widest uppercase">Poonamallee High Rd</span>
              </div>
              <div className="absolute pointer-events-none" style={{ top: "12%", left: "25%", transform: "rotate(-90deg)" }}>
                <span className="text-[8px] text-slate-600 font-mono tracking-widest uppercase">GN Chetty Rd</span>
              </div>
              <div className="absolute pointer-events-none" style={{ top: "12%", left: "74%", transform: "rotate(-90deg)" }}>
                <span className="text-[8px] text-slate-600 font-mono tracking-widest uppercase">Adyar River Rd</span>
              </div>

              {/* Zone Areas */}
              <div className="absolute rounded-lg border border-red-500/10 bg-red-500/[0.02] pointer-events-none" style={{ top: "10%", left: "10%", width: "30%", height: "25%" }}>
                <span className="absolute top-1 left-2 text-[6px] text-red-500/40 font-bold uppercase tracking-wider">Zone A</span>
              </div>
              <div className="absolute rounded-lg border border-cyan-500/10 bg-cyan-500/[0.02] pointer-events-none" style={{ top: "30%", left: "40%", width: "30%", height: "25%" }}>
                <span className="absolute top-1 left-2 text-[6px] text-cyan-500/40 font-bold uppercase tracking-wider">Zone B</span>
              </div>
              <div className="absolute rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02] pointer-events-none" style={{ top: "58%", left: "10%", width: "25%", height: "25%" }}>
                <span className="absolute top-1 left-2 text-[6px] text-emerald-500/40 font-bold uppercase tracking-wider">Zone C</span>
              </div>

              {/* Building footprints */}
              {[
                { x: "12%", y: "30%", w: "20px", h: "16px" },
                { x: "16%", y: "33%", w: "14px", h: "20px" },
                { x: "42%", y: "56%", w: "22px", h: "14px" },
                { x: "65%", y: "62%", w: "16px", h: "18px" },
                { x: "80%", y: "30%", w: "20px", h: "12px" },
                { x: "85%", y: "50%", w: "18px", h: "18px" },
                { x: "38%", y: "78%", w: "24px", h: "12px" },
                { x: "60%", y: "80%", w: "14px", h: "16px" },
                { x: "22%", y: "75%", w: "16px", h: "14px" },
                { x: "70%", y: "16%", w: "18px", h: "14px" },
                { x: "48%", y: "14%", w: "12px", h: "18px" },
                { x: "90%", y: "72%", w: "14px", h: "20px" },
              ].map((b, i) => (
                <div key={`bld-${i}`} className="absolute bg-navy-700/30 border border-navy-600/20 rounded-[2px] pointer-events-none" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
              ))}

              {/* Animated Radar Sweep */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none opacity-20">
                <div className="absolute inset-0 rounded-full border border-cyan-500/30" />
                <div className="absolute inset-[25%] rounded-full border border-cyan-500/20" />
                <div className="absolute inset-[50%] rounded-full border border-cyan-500/10" />
                <div className="w-full h-full rounded-full animate-spin" style={{ animationDuration: "8s" }}>
                  <div className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left" style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.15) 60deg, transparent 60deg)" }} />
                </div>
              </div>

              {/* Sensor nodes with pulse rings */}
              {[
                { x: "22%", y: "28%", active: true },
                { x: "45%", y: "42%", active: true },
                { x: "70%", y: "35%", active: true },
                { x: "30%", y: "65%", active: false },
                { x: "60%", y: "73%", active: true },
                { x: "85%", y: "45%", active: true },
                { x: "50%", y: "20%", active: false },
                { x: "15%", y: "55%", active: true },
                { x: "37%", y: "30%", active: true },
                { x: "55%", y: "55%", active: true },
                { x: "78%", y: "60%", active: true },
                { x: "25%", y: "48%", active: true },
                { x: "68%", y: "22%", active: false },
                { x: "42%", y: "82%", active: true },
                { x: "88%", y: "35%", active: true },
                { x: "18%", y: "72%", active: true },
              ].map((sensor, i) => (
                <div key={`sensor-${i}`} className="absolute pointer-events-none" style={{ left: sensor.x, top: sensor.y, transform: "translate(-50%,-50%)" }}>
                  <div className={`w-2 h-2 rounded-full ${sensor.active ? "bg-cyan-400" : "bg-slate-600"}`} />
                  {sensor.active && <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-40" />}
                </div>
              ))}

              {/* Anomaly Detection Markers — compact dots with hover labels */}
              {[
                { x: "14%", y: "18%", label: "Crack Pattern", severity: "high" },
                { x: "44%", y: "15%", label: "Vibration Spike", severity: "medium" },
                { x: "85%", y: "20%", label: "Tilt Deviation", severity: "low" },
                { x: "10%", y: "48%", label: "Settlement Risk", severity: "high" },
                { x: "88%", y: "45%", label: "Corrosion Sign", severity: "medium" },
                { x: "38%", y: "58%", label: "Load Excess", severity: "medium" },
                { x: "12%", y: "85%", label: "Spalling Alert", severity: "high" },
                { x: "42%", y: "85%", label: "Moisture Ingress", severity: "low" },
                { x: "72%", y: "82%", label: "Rebar Exposure", severity: "high" },
                { x: "86%", y: "70%", label: "Thermal Shift", severity: "medium" },
              ].map((det, i) => (
                <div key={`det-${i}`} className="absolute z-[5] group/det" style={{ left: det.x, top: det.y, transform: "translate(-50%,-50%)" }}>
                  <div className={`w-3 h-3 rounded-full border-2 shadow-md cursor-default ${
                    det.severity === "high" ? "bg-red-500 border-red-300/50 shadow-red-500/30" :
                    det.severity === "medium" ? "bg-orange-500 border-orange-300/50 shadow-orange-500/30" :
                    "bg-yellow-500 border-yellow-300/50 shadow-yellow-500/30"
                  }`}>
                    {det.severity === "high" && <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />}
                  </div>
                  {/* Hover label */}
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/det:opacity-100 transition-opacity pointer-events-none bg-navy-900/95 border border-navy-700/60 shadow-lg" style={{ color: det.severity === "high" ? "#f87171" : det.severity === "medium" ? "#fb923c" : "#facc15" }}>
                    {det.label}
                  </div>
                </div>
              ))}

              {/* Connection lines between sensors (SVG overlay) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
                <line x1="22%" y1="28%" x2="45%" y2="42%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="45%" y1="42%" x2="70%" y2="35%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="70%" y1="35%" x2="85%" y2="45%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="22%" y1="28%" x2="15%" y2="55%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="15%" y1="55%" x2="30%" y2="65%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="30%" y1="65%" x2="60%" y2="73%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="45%" y1="42%" x2="50%" y2="20%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="37%" y1="30%" x2="55%" y2="55%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="55%" y1="55%" x2="78%" y2="60%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="25%" y1="48%" x2="42%" y2="82%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="88%" y1="35%" x2="78%" y2="60%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="18%" y1="72%" x2="42%" y2="82%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="68%" y1="22%" x2="88%" y2="35%" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" />
              </svg>

              {/* Structure markers */}
              {structures.map((s) => {
                const isSelected = selectedStructure?.id === s.id;
                const isHovered = hoveredStructure?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${isSelected || isHovered ? "z-20" : "z-10 hover:z-15"}`}
                    style={{ top: s.position.top, left: s.position.left }}
                    onClick={() => setSelectedStructure(isSelected ? null : s)}
                    onMouseEnter={() => setHoveredStructure(s)}
                    onMouseLeave={() => setHoveredStructure(null)}
                  >
                    {/* Outer glow ring */}
                    {s.riskLevel >= 50 && (
                      <div className={`absolute -inset-3 rounded-full ${s.riskLevel >= 75 ? "bg-red-500/10" : "bg-orange-500/10"} animate-pulse pointer-events-none`} />
                    )}

                    {/* Marker circle */}
                    <div className={`
                      w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-xl
                      ${getRiskColor(s.riskLevel)}
                      ${isSelected ? "border-cyan-400 ring-4 ring-cyan-400/40 scale-110" : isHovered ? "border-white scale-110 ring-2 ring-white/20" : "border-white/70 hover:scale-110 hover:border-white"}
                      ${s.riskLevel >= 75 ? "animate-pulse" : ""}
                    `}>
                      <span className="text-white text-xs font-bold drop-shadow">{s.riskLevel}</span>
                    </div>

                    {/* Name label — always visible, compact */}
                    <div className={`absolute top-full mt-1.5 left-1/2 transform -translate-x-1/2 text-[9px] font-semibold px-2 py-0.5 rounded whitespace-nowrap pointer-events-none transition-colors duration-200 ${isSelected ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-navy-900/80 text-slate-300 border border-navy-700/30"}`}>
                      {s.name}
                    </div>
                  </div>
                );
              })}

              </div>{/* Close zoomable container */}
            </div>
          </div>

          {/* Structure Details (when selected) */}
          {selectedStructure && (
            <div className="navy-card p-5 animate-enter">
              <h3 className="section-title mb-4">
                <span className="text-lg mr-1">{getTypeIcon(selectedStructure.type)}</span>
                Details: {selectedStructure.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Quick Stats */}
                <div className="md:col-span-1 space-y-2">
                  {[
                    ["Risk Score", selectedStructure.riskLevel + "%", getRiskTextColor(selectedStructure.riskLevel)],
                    ["Status", selectedStructure.status, getRiskTextColor(selectedStructure.riskLevel)],
                    ["Built", selectedStructure.details.built, "text-cyan-400"],
                    ["Material", selectedStructure.details.material, "text-white"],
                    ["Last Inspection", selectedStructure.details.lastInspection, "text-white"],
                    ["Load Capacity", selectedStructure.details.loadCapacity, "text-cyan-400"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex items-center justify-between bg-navy-900/60 p-3 rounded-lg border border-navy-700/40">
                      <span className="text-xs font-medium text-slate-500">{label}</span>
                      <span className={`text-xs font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Breakdown Bars */}
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Structural Analysis</h4>
                  <SimulatedBreakdown riskLevel={selectedStructure.riskLevel} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ────────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          {(() => {
            /* Show selected (clicked) structure, or hovered structure as preview, or empty state */
            const activeStructure = selectedStructure ?? hoveredStructure;
            const isPreview = !selectedStructure && !!hoveredStructure;

            if (activeStructure) {
              return (
                <div className={`navy-card p-4 transition-all duration-200 ${isPreview ? "ring-1 ring-cyan-500/20" : ""}`}>
                  <h3 className="section-title mb-3">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risk Assessment
                    {isPreview && <span className="ml-auto text-[8px] text-cyan-400/70 uppercase tracking-wider font-mono">Preview</span>}
                  </h3>

                  <div className="space-y-2.5">
                    {/* Structure name + icon */}
                    <div className="flex items-center gap-2.5 bg-navy-900/40 rounded-lg px-3 py-2.5 border border-navy-700/40">
                      <span className="text-xl leading-none">{getTypeIcon(activeStructure.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate leading-tight">{activeStructure.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono leading-tight mt-0.5">{activeStructure.id} &bull; Est. {activeStructure.details.built}</p>
                      </div>
                    </div>

                    {/* Risk score — inline row */}
                    <div className="flex items-center gap-3 bg-navy-900/30 rounded-lg px-3 py-2.5 border border-navy-700/30">
                      <div className={`text-4xl font-black font-mono leading-none ${getRiskTextColor(activeStructure.riskLevel)}`}>
                        {activeStructure.riskLevel}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Risk Score</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                          activeStructure.riskLevel >= 75 ? "bg-red-500/15 text-red-400" :
                          activeStructure.riskLevel >= 50 ? "bg-orange-500/15 text-orange-400" :
                          activeStructure.riskLevel >= 25 ? "bg-amber-500/15 text-amber-400" :
                          "bg-green-500/15 text-green-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            activeStructure.riskLevel >= 75 ? "bg-red-400 animate-pulse" :
                            activeStructure.riskLevel >= 50 ? "bg-orange-400" :
                            activeStructure.riskLevel >= 25 ? "bg-amber-400" :
                            "bg-green-400"
                          }`} />
                          {activeStructure.status}
                        </span>
                      </div>
                    </div>

                    {/* Key details — compact table style */}
                    <div className="rounded-lg border border-navy-700/40 overflow-hidden">
                      {[
                        ["Spans", String(activeStructure.details.spans)],
                        ["Type", activeStructure.type.charAt(0).toUpperCase() + activeStructure.type.slice(1)],
                        ["Material", activeStructure.details.material],
                        ["Load Capacity", activeStructure.details.loadCapacity],
                        ["Last Inspection", activeStructure.details.lastInspection],
                      ].map(([label, value], i) => (
                        <div key={label} className={`flex items-center justify-between px-3 py-2 ${i % 2 === 0 ? "bg-navy-900/40" : "bg-navy-900/20"} ${i < 4 ? "border-b border-navy-700/30" : ""}`}>
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className="text-xs text-white font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Risk Breakdown bars */}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Risk Breakdown</p>
                      <div className="space-y-1.5">
                        {[
                          { label: "Stress", pct: Math.min(100, activeStructure.riskLevel + 8), color: "from-rose-600 to-red-400" },
                          { label: "Vibration", pct: Math.min(100, Math.round(activeStructure.riskLevel * 0.8 + 5)), color: "from-amber-600 to-yellow-400" },
                          { label: "Load", pct: Math.min(100, Math.round(activeStructure.riskLevel * 0.6 + 10)), color: "from-blue-600 to-cyan-400" },
                        ].map((bar) => (
                          <div key={bar.label} className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 w-16 shrink-0">{bar.label}</span>
                            <div className="flex-1 h-2 bg-navy-900 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold font-mono w-9 text-right ${bar.pct >= 70 ? "text-red-400" : bar.pct >= 50 ? "text-orange-400" : "text-slate-400"}`}>{bar.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons — only when clicked/selected, not on hover preview */}
                    {!isPreview && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowReport(true)}
                          className="btn-primary flex-1 !py-2 !text-xs !rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Full Report
                        </button>
                        <button
                          onClick={() => setShowEmergency(true)}
                          className="btn-danger flex-1 !py-2 !text-xs !rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Emergency
                        </button>
                      </div>
                    )}

                    {/* Hover hint */}
                    {isPreview && (
                      <p className="text-center text-[9px] text-slate-600 uppercase tracking-widest pt-1">Click marker to select &amp; view full report</p>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div className="navy-card flex flex-col items-center justify-center h-48 text-slate-500 p-5">
                <svg className="w-8 h-8 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <p className="text-sm font-medium">Hover or select a structure</p>
                <p className="text-xs text-slate-600 mt-1">Point at a marker to preview details</p>
              </div>
            );
          })()}

          {/* Alert Feed */}
          <div className="navy-card p-4">
            <h3 className="section-title mb-3">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Incident &amp; Emergency Feed
            </h3>
            <div className="space-y-2">
              {filteredAlerts.length === 0 ? (
                <div className="space-y-2.5">
                  {/* All-clear banner */}
                  <div className="flex items-center gap-2.5 bg-green-500/8 border border-green-500/15 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-400">All Clear</p>
                      <p className="text-[10px] text-slate-500">No active incidents detected</p>
                    </div>
                  </div>

                  {/* Quick stats — single row */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Monitored", value: "5", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "text-cyan-400" },
                      { label: "Sensors", value: "Live", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "text-amber-400" },
                      { label: "Uptime", value: "99.8%", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-400" },
                      { label: "Scan", value: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }), icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "text-slate-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-navy-900/40 border border-navy-700/30 rounded-lg px-2 py-1.5 text-center">
                        <svg className={`w-3 h-3 ${stat.color} mx-auto mb-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                        </svg>
                        <p className={`text-[10px] font-bold ${stat.color} leading-none`}>{stat.value}</p>
                        <p className="text-[8px] text-slate-600 leading-tight mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                filteredAlerts.slice(0, 10).map((alert, i) => (
                  <div
                    key={`${alert.timestamp}-${i}`}
                    className={`border-l-3 ${alert.severity === "RED" ? "border-l-red-500 bg-red-500/5" : "border-l-orange-500 bg-orange-500/5"} rounded-r-lg p-3 animate-slide-in`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${alert.severity === "RED" ? "text-red-400" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">{alert.message}</p>
                    <p className="text-[10px] text-slate-600 pl-5 mt-0.5 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString("en-US", { hour12: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
