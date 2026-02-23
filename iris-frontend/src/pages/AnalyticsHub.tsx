import { useMemo, useState } from "react";
import type { RiskAssessment, Alert } from "../types/schemas";
import { exportAnalyticsReport } from "../utils/pdfExport";

/* ══════════════════════════════════════════════════════════════════════
   DATA GENERATORS
   ══════════════════════════════════════════════════════════════════════ */

function generateHistoricalData() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  let prev = 25;
  return hours.map((h) => {
    const hourNum = parseInt(h);
    const dayBias = hourNum >= 8 && hourNum <= 18 ? 15 : 0;
    const rushBias = (hourNum >= 8 && hourNum <= 10) || (hourNum >= 17 && hourNum <= 19) ? 12 : 0;
    const noise = (Math.random() - 0.5) * 20;
    prev = Math.max(5, Math.min(95, prev * 0.6 + (25 + dayBias + rushBias + noise) * 0.4));
    return { time: h, risk: Math.round(prev) };
  });
}

function generateWeeklyData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d) => ({
    day: d,
    avg: Math.round(25 + Math.random() * 35),
    peak: Math.round(50 + Math.random() * 40),
    alerts: Math.round(Math.random() * 12),
  }));
}

function generateHourlyHeatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    hours: Array.from({ length: 24 }, (_, h) => {
      const rush = (h >= 8 && h <= 10) || (h >= 17 && h <= 19) ? 20 : 0;
      const night = h >= 22 || h <= 5 ? -15 : 0;
      return Math.max(0, Math.min(100, Math.round(30 + rush + night + (Math.random() - 0.5) * 30)));
    }),
  }));
}

function generateAlertTimeline() {
  const types = [
    { severity: "HIGH", color: "#ef4444", label: "Structural Warning" },
    { severity: "MEDIUM", color: "#f97316", label: "Vibration Anomaly" },
    { severity: "LOW", color: "#eab308", label: "Load Spike" },
    { severity: "HIGH", color: "#ef4444", label: "Corrosion Detected" },
    { severity: "MEDIUM", color: "#f97316", label: "Temp Threshold" },
    { severity: "LOW", color: "#eab308", label: "Sensor Drift" },
    { severity: "HIGH", color: "#ef4444", label: "Critical Stress" },
    { severity: "MEDIUM", color: "#f97316", label: "Tilt Deviation" },
  ];
  return types.map((t, i) => ({
    ...t,
    time: `${String(Math.floor(Math.random() * 12 + 8)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    bridge: ["Adyar River Bridge", "Kathipara Flyover", "Napier Bridge", "Ripon Building", "T. Nagar Block"][i % 5],
  })).sort((a, b) => a.time.localeCompare(b.time));
}

/* ══════════════════════════════════════════════════════════════════════
   CHART COMPONENTS
   ══════════════════════════════════════════════════════════════════════ */

/** Area Line Chart with threshold zones and hover tooltip */
function AreaLineChart({ data, height = 220 }: { data: { time: string; risk: number }[]; height?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data || data.length < 2) return null;
  const W = 600, H = height, PAD = { t: 20, r: 20, b: 30, l: 42 };
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;

  const points = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * plotW,
    y: PAD.t + plotH - (d.risk / 100) * plotH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + plotH} L ${points[0].x} ${PAD.t + plotH} Z`;

  const hp = hovered !== null ? points[hovered] : null;
  const riskLabel = (v: number) => v >= 75 ? "CRITICAL" : v >= 55 ? "HIGH" : v >= 30 ? "ELEVATED" : "LOW";
  const riskColor = (v: number) => v >= 75 ? "#ef4444" : v >= 55 ? "#f97316" : v >= 30 ? "#eab308" : "#22c55e";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGrad1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Threshold zones — colored bands */}
      <rect x={PAD.l} y={PAD.t} width={plotW} height={plotH * 0.25} fill="rgba(239,68,68,0.04)" />
      <rect x={PAD.l} y={PAD.t + plotH * 0.25} width={plotW} height={plotH * 0.20} fill="rgba(249,115,22,0.03)" />
      <rect x={PAD.l} y={PAD.t + plotH * 0.45} width={plotW} height={plotH * 0.25} fill="rgba(234,179,8,0.02)" />

      {/* Threshold lines */}
      {[
        { y: 75, label: "EVACUATE", color: "#ef4444" },
        { y: 55, label: "RESTRICT", color: "#f97316" },
        { y: 30, label: "WARN", color: "#eab308" },
      ].map((t) => {
        const yPos = PAD.t + plotH - (t.y / 100) * plotH;
        return (
          <g key={t.label}>
            <line x1={PAD.l} y1={yPos} x2={W - PAD.r} y2={yPos} stroke={t.color} strokeWidth={0.7} strokeDasharray="6 4" opacity={0.3} />
            <text x={W - PAD.r - 2} y={yPos - 4} textAnchor="end" fill={t.color} fontSize={8} fontWeight="600" opacity={0.6}>{t.label}</text>
          </g>
        );
      })}

      {/* Y axis */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = PAD.t + plotH - (v / 100) * plotH;
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(148,163,184,0.1)" strokeWidth={0.5} />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize={9}>{v}</text>
          </g>
        );
      })}

      {/* X labels */}
      {points.filter((_, i) => i % 4 === 0).map((p) => (
        <text key={p.time} x={p.x} y={H - 6} textAnchor="middle" fill="#94a3b8" fontSize={8}>{p.time}</text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad1)" />

      {/* Line — thicker, more visible */}
      <path d={pathD} fill="none" stroke="url(#lineGrad1)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {points.filter((_, i) => i % 3 === 0).map((p) => (
        <circle key={p.time} cx={p.x} cy={p.y} r={3} fill="#22d3ee" stroke="#0a0f1a" strokeWidth={1.5} />
      ))}

      {/* Invisible hover zones for each data point */}
      {points.map((p, i) => (
        <rect
          key={`hover-${i}`}
          x={p.x - plotW / data.length / 2}
          y={PAD.t}
          width={plotW / data.length}
          height={plotH}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {/* Hover crosshair + tooltip */}
      {hp && (
        <g>
          <line x1={hp.x} y1={PAD.t} x2={hp.x} y2={PAD.t + plotH} stroke="#22d3ee" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
          <line x1={PAD.l} y1={hp.y} x2={W - PAD.r} y2={hp.y} stroke={riskColor(hp.risk)} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.4} />
          <circle cx={hp.x} cy={hp.y} r={5} fill={riskColor(hp.risk)} stroke="#fff" strokeWidth={2} />

          {/* Tooltip background */}
          <rect
            x={Math.min(hp.x + 10, W - 130)}
            y={Math.max(hp.y - 48, PAD.t)}
            width={120}
            height={42}
            rx={6}
            fill="rgba(10,15,26,0.95)"
            stroke="rgba(34,211,238,0.3)"
            strokeWidth={1}
          />
          {/* Tooltip text */}
          <text x={Math.min(hp.x + 18, W - 122)} y={Math.max(hp.y - 30, PAD.t + 18)} fill="#22d3ee" fontSize={10} fontWeight="700">{hp.time} — Risk: {hp.risk}%</text>
          <text x={Math.min(hp.x + 18, W - 122)} y={Math.max(hp.y - 16, PAD.t + 32)} fill={riskColor(hp.risk)} fontSize={9} fontWeight="600">{riskLabel(hp.risk)} {hp.risk >= 75 ? "⚠ Evacuate" : hp.risk >= 55 ? "⚠ Restrict" : hp.risk >= 30 ? "Monitor" : "✓ Safe"}</text>
        </g>
      )}
    </svg>
  );
}

/** Weekly Comparison Bar Chart with hover tooltip */
function WeeklyBarChart({ data }: { data: { day: string; avg: number; peak: number; alerts: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data || data.length === 0) return null;
  const W = 600, H = 200, PAD = { t: 15, r: 20, b: 30, l: 42 };
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const barGroupW = plotW / data.length;
  const barW = barGroupW * 0.3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      {[0, 25, 50, 75, 100].map((v) => {
        const y = PAD.t + plotH - (v / 100) * plotH;
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(148,163,184,0.1)" strokeWidth={0.5} />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize={9}>{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = PAD.l + (i + 0.5) * barGroupW;
        const avgH = (d.avg / 100) * plotH;
        const peakH = (d.peak / 100) * plotH;
        const isHov = hovered === i;
        return (
          <g key={d.day}>
            {/* Hover highlight band */}
            {isHov && <rect x={cx - barGroupW / 2} y={PAD.t} width={barGroupW} height={plotH} fill="rgba(34,211,238,0.04)" rx={4} />}

            <rect x={cx - barW - 1} y={PAD.t + plotH - avgH} width={barW} height={avgH} rx={3} fill="#06b6d4" opacity={isHov ? 1 : 0.85} />
            <rect x={cx + 1} y={PAD.t + plotH - peakH} width={barW} height={peakH} rx={3} fill="#f97316" opacity={isHov ? 1 : 0.8} />
            <text x={cx - barW / 2 - 1} y={PAD.t + plotH - avgH - 5} textAnchor="middle" fill="#22d3ee" fontSize={8} fontWeight="700">{d.avg}</text>
            <text x={cx + barW / 2 + 1} y={PAD.t + plotH - peakH - 5} textAnchor="middle" fill="#fb923c" fontSize={8} fontWeight="700">{d.peak}</text>
            <text x={cx} y={H - 8} textAnchor="middle" fill={isHov ? "#22d3ee" : "#94a3b8"} fontSize={9} fontWeight="600">{d.day}</text>

            {/* Invisible hover zone */}
            <rect
              x={cx - barGroupW / 2}
              y={PAD.t}
              width={barGroupW}
              height={plotH + PAD.b}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />

            {/* Tooltip */}
            {isHov && (
              <g>
                <rect
                  x={Math.min(cx + barW + 8, W - 140)}
                  y={Math.max(PAD.t + plotH - peakH - 56, PAD.t)}
                  width={132}
                  height={50}
                  rx={6}
                  fill="rgba(10,15,26,0.95)"
                  stroke="rgba(34,211,238,0.3)"
                  strokeWidth={1}
                />
                <text x={Math.min(cx + barW + 16, W - 132)} y={Math.max(PAD.t + plotH - peakH - 38, PAD.t + 18)} fill="#22d3ee" fontSize={10} fontWeight="700">{d.day} — Avg: {d.avg}%</text>
                <text x={Math.min(cx + barW + 16, W - 132)} y={Math.max(PAD.t + plotH - peakH - 24, PAD.t + 32)} fill="#fb923c" fontSize={9} fontWeight="600">Peak: {d.peak}%  •  {d.alerts} alerts</text>
                <text x={Math.min(cx + barW + 16, W - 132)} y={Math.max(PAD.t + plotH - peakH - 12, PAD.t + 44)} fill={d.peak >= 75 ? "#ef4444" : d.peak >= 50 ? "#f97316" : "#22c55e"} fontSize={8} fontWeight="600">{d.peak >= 75 ? "⚠ Action Required" : d.peak >= 50 ? "Monitor Closely" : "✓ Normal Range"}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Sensor Breakdown Radar */
function SensorRadar({ breakdown }: { breakdown: { stress: number; vibration: number; load: number; environmental: number } }) {
  const CX = 120, CY = 110, R = 80;
  const labels = [
    { key: "stress", label: "Stress", angle: -90, color: "#ef4444" },
    { key: "vibration", label: "Vibration", angle: 0, color: "#f97316" },
    { key: "load", label: "Load", angle: 90, color: "#eab308" },
    { key: "environmental", label: "Environ.", angle: 180, color: "#22c55e" },
  ] as const;

  const vals = labels.map((l) => breakdown[l.key]);
  const radarPoints = labels.map((l, i) => {
    const rad = (l.angle * Math.PI) / 180;
    const v = vals[i];
    return { x: CX + Math.cos(rad) * R * v, y: CY + Math.sin(rad) * R * v };
  });
  const radarD = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 240 220" width={240} height={220} style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="radarFill">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={labels.map((l) => {
          const rad = (l.angle * Math.PI) / 180;
          return `${CX + Math.cos(rad) * R * f},${CY + Math.sin(rad) * R * f}`;
        }).join(" ")} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={0.5} />
      ))}

      {/* Axes */}
      {labels.map((l, i) => {
        const rad = (l.angle * Math.PI) / 180;
        const ex = CX + Math.cos(rad) * R;
        const ey = CY + Math.sin(rad) * R;
        const lx = CX + Math.cos(rad) * (R + 20);
        const ly = CY + Math.sin(rad) * (R + 20);
        return (
          <g key={l.key}>
            <line x1={CX} y1={CY} x2={ex} y2={ey} stroke="rgba(148,163,184,0.15)" strokeWidth={0.5} />
            <text x={lx} y={ly + 3} textAnchor="middle" fill={l.color} fontSize={10} fontWeight="600">{l.label}</text>
            <text x={lx} y={ly + 14} textAnchor="middle" fill="#94a3b8" fontSize={8}>{Math.round(vals[i] * 100)}%</text>
          </g>
        );
      })}

      {/* Data polygon */}
      <path d={radarD} fill="url(#radarFill)" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {radarPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={labels[i].color} stroke="#0a0f1a" strokeWidth={2} />
      ))}
    </svg>
  );
}

/** Risk Distribution Donut */
function RiskDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const CX = 90, CY = 90, R = 68, INNER = 44;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  let cumAngle = -90;

  const arcs = data.map((d) => {
    const angle = (d.value / total) * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    cumAngle += angle;

    const x1o = CX + Math.cos(startRad) * R;
    const y1o = CY + Math.sin(startRad) * R;
    const x2o = CX + Math.cos(endRad) * R;
    const y2o = CY + Math.sin(endRad) * R;
    const x1i = CX + Math.cos(endRad) * INNER;
    const y1i = CY + Math.sin(endRad) * INNER;
    const x2i = CX + Math.cos(startRad) * INNER;
    const y2i = CY + Math.sin(startRad) * INNER;

    const large = angle > 180 ? 1 : 0;
    const path = `M ${x1o} ${y1o} A ${R} ${R} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${INNER} ${INNER} 0 ${large} 0 ${x2i} ${y2i} Z`;

    return { ...d, path };
  });

  return (
    <svg viewBox="0 0 180 180" width={180} height={180} style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      {arcs.map((a) => (
        <path key={a.label} d={a.path} fill={a.color} opacity={0.9} stroke="#0a0f1a" strokeWidth={1.5} />
      ))}
      <circle cx={CX} cy={CY} r={INNER - 4} fill="rgba(10,15,26,0.6)" />
      <text x={CX} y={CY - 6} textAnchor="middle" fill="#fff" fontSize={18} fontWeight="800">{total}</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="600">HOURS</text>
    </svg>
  );
}

/** Heatmap Grid with hover tooltip */
function HeatmapGrid({ data }: { data: { day: string; hours: number[] }[] }) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  if (!data || data.length === 0) return null;
  const cellW = 18, cellH = 16, PAD = { l: 32, t: 22 };
  const svgW = PAD.l + 24 * cellW + 10;
  const svgH = PAD.t + 7 * cellH + 30;

  function heatColor(v: number): string {
    if (v >= 75) return "rgba(239,68,68,0.75)";
    if (v >= 55) return "rgba(249,115,22,0.6)";
    if (v >= 30) return "rgba(234,179,8,0.45)";
    return "rgba(34,211,238,0.2)";
  }
  function riskLabel(v: number) { return v >= 75 ? "Critical" : v >= 55 ? "High" : v >= 30 ? "Elevated" : "Low"; }
  function riskTxtColor(v: number) { return v >= 75 ? "#ef4444" : v >= 55 ? "#f97316" : v >= 30 ? "#eab308" : "#22c55e"; }

  const hv = hovered ? { day: data[hovered.row].day, hour: hovered.col, val: data[hovered.row].hours[hovered.col] } : null;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ display: "block", width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      {/* Hour labels */}
      {Array.from({ length: 24 }, (_, h) => h).filter((h) => h % 3 === 0).map((h) => (
        <text key={h} x={PAD.l + h * cellW + cellW / 2} y={PAD.t - 6} textAnchor="middle" fill="#64748b" fontSize={7}>{String(h).padStart(2, "0")}</text>
      ))}

      {data.map((row, ri) => (
        <g key={row.day}>
          <text x={PAD.l - 6} y={PAD.t + ri * cellH + cellH / 2 + 3} textAnchor="end" fill="#94a3b8" fontSize={8} fontWeight="500">{row.day}</text>
          {row.hours.map((v, hi) => {
            const isHov = hovered?.row === ri && hovered?.col === hi;
            return (
              <rect
                key={hi}
                x={PAD.l + hi * cellW}
                y={PAD.t + ri * cellH}
                width={cellW - 1.5}
                height={cellH - 1.5}
                rx={2}
                fill={heatColor(v)}
                stroke={isHov ? "#22d3ee" : "none"}
                strokeWidth={isHov ? 1.5 : 0}
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered({ row: ri, col: hi })}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </g>
      ))}

      {/* Hover tooltip */}
      {hv && hovered && (() => {
        const tx = PAD.l + hovered.col * cellW + cellW / 2;
        const ty = PAD.t + hovered.row * cellH;
        const tipX = Math.min(Math.max(tx + 12, 10), svgW - 120);
        const tipY = Math.max(ty - 36, 2);
        return (
          <g>
            <rect x={tipX} y={tipY} width={110} height={32} rx={5} fill="rgba(10,15,26,0.95)" stroke="rgba(34,211,238,0.3)" strokeWidth={1} />
            <text x={tipX + 8} y={tipY + 14} fill="#22d3ee" fontSize={9} fontWeight="700">{hv.day} {String(hv.hour).padStart(2, "0")}:00 — {hv.val}%</text>
            <text x={tipX + 8} y={tipY + 26} fill={riskTxtColor(hv.val)} fontSize={8} fontWeight="600">{riskLabel(hv.val)} Risk</text>
          </g>
        );
      })()}

      {/* Legend */}
      <g transform={`translate(${PAD.l}, ${PAD.t + 7 * cellH + 6})`}>
        {[
          { label: "Low", color: "rgba(34,211,238,0.15)" },
          { label: "Warn", color: "rgba(234,179,8,0.4)" },
          { label: "High", color: "rgba(249,115,22,0.55)" },
          { label: "Critical", color: "rgba(239,68,68,0.7)" },
        ].map((l, i) => (
          <g key={l.label} transform={`translate(${i * 65}, 0)`}>
            <rect width={10} height={8} rx={1.5} fill={l.color} />
            <text x={14} y={7} fill="#64748b" fontSize={7}>{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   KPI CARD
   ══════════════════════════════════════════════════════════════════════ */

function KPICard({ label, value, unit, trend, trendLabel, color, icon }: {
  label: string; value: string | number; unit?: string; trend?: "up" | "down" | "stable";
  trendLabel?: string; color: string; icon: React.ReactNode;
}) {
  const trendColors = { up: "text-red-400", down: "text-emerald-400", stable: "text-slate-500" };
  const trendIcons = { up: "\u2191", down: "\u2193", stable: "\u2192" };

  return (
    <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-4 hover:border-navy-600/40 transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-white tabular-nums">{value}</span>
        {unit && <span className="text-xs text-slate-500 font-semibold">{unit}</span>}
      </div>
      {trend && trendLabel && (
        <div className={`flex items-center gap-1 mt-1.5 ${trendColors[trend]}`}>
          <span className="text-xs font-bold">{trendIcons[trend]}</span>
          <span className="text-[10px] font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

interface AnalyticsProps {
  risk: RiskAssessment | null;
  alerts: Alert[];
}

export default function AnalyticsHub({ risk, alerts }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"24h" | "7d">("24h");
  const historicalData = useMemo(() => generateHistoricalData(), []);
  const weeklyData = useMemo(() => generateWeeklyData(), []);
  const heatmapData = useMemo(() => generateHourlyHeatmap(), []);
  const alertTimeline = useMemo(() => generateAlertTimeline(), []);

  const score = risk?.overall_score ?? 42;
  const avgScore = Math.round(historicalData.reduce((s, d) => s + d.risk, 0) / historicalData.length);
  const peakScore = Math.max(...historicalData.map((d) => d.risk));
  const alertCount = alerts.length;

  const sensorBreakdown = useMemo(() => ({
    stress: risk?.breakdown.stress_score ?? 0.45,
    vibration: risk?.breakdown.vibration_score ?? 0.35,
    load: risk?.breakdown.load_score ?? 0.30,
    environmental: risk?.breakdown.environmental_score ?? 0.25,
  }), [risk]);

  const riskDistribution = useMemo(() => {
    const counts = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 };
    historicalData.forEach((d) => {
      if (d.risk >= 75) counts.RED++;
      else if (d.risk >= 55) counts.ORANGE++;
      else if (d.risk >= 30) counts.YELLOW++;
      else counts.GREEN++;
    });
    return [
      { label: "GREEN", value: counts.GREEN, color: "#22c55e" },
      { label: "YELLOW", value: counts.YELLOW, color: "#eab308" },
      { label: "ORANGE", value: counts.ORANGE, color: "#f97316" },
      { label: "RED", value: counts.RED, color: "#ef4444" },
    ];
  }, [historicalData]);

  const sensorDistribution = useMemo(() => [
    { category: "Strain Gauges", count: risk ? Math.round(200 + risk.overall_score * 4) : 450 },
    { category: "Accelerometers", count: risk ? Math.round(100 + risk.breakdown.vibration_score * 150) : 180 },
    { category: "Load Cells", count: risk ? Math.round(150 + risk.breakdown.load_score * 200) : 280 },
    { category: "Temp Sensors", count: risk ? Math.round(80 + risk.breakdown.environmental_score * 120) : 160 },
  ], [risk]);

  const handleExportPDF = () => {
    exportAnalyticsReport({
      historicalData: historicalData.filter((_, i) => i % 2 === 0),
      predictiveData: weeklyData.map((w) => ({ hour: w.day, predicted: w.avg })),
      sensorData: sensorDistribution,
      currentRiskScore: risk?.overall_score ?? null,
    });
  };

  return (
    <div className="space-y-4 animate-enter">

      {/* ── Header Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Analytics &amp; Insights
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Risk trends, sensor analysis, and operational intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Tabs */}
          <div className="flex bg-navy-800/60 border border-navy-700/30 rounded-lg p-0.5">
            {(["24h", "7d"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === tab ? "bg-cyan-500/15 text-cyan-400 shadow-sm" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} className="btn-primary text-xs !py-2 !px-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* ── KPI Summary Row ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Current Score"
          value={score}
          unit="/100"
          trend={score > 55 ? "up" : score < 30 ? "down" : "stable"}
          trendLabel={score > 55 ? "Elevated" : score < 30 ? "Normal range" : "Stable"}
          color="bg-cyan-500/10 text-cyan-400"
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <KPICard
          label="24h Average"
          value={avgScore}
          unit="/100"
          trend={avgScore > 45 ? "up" : "down"}
          trendLabel={`${avgScore > 45 ? "+" : ""}${avgScore - 38} vs yesterday`}
          color="bg-blue-500/10 text-blue-400"
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
        />
        <KPICard
          label="Peak (Today)"
          value={peakScore}
          unit="/100"
          trend={peakScore > 70 ? "up" : "stable"}
          trendLabel="Recorded at peak hour"
          color="bg-orange-500/10 text-orange-400"
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
        />
        <KPICard
          label="Alerts Today"
          value={alertCount || alertTimeline.length}
          trend={alertCount > 5 ? "up" : "down"}
          trendLabel={`${alertTimeline.filter((a) => a.severity === "HIGH").length} high severity`}
          color="bg-red-500/10 text-red-400"
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>}
        />
      </div>

      {/* ── Main Charts Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Trend — spans 2 cols */}
        <div className="lg:col-span-2 navy-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {activeTab === "24h" ? "Risk Score — Last 24 Hours" : "Weekly Comparison — Avg vs Peak"}
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              {activeTab === "24h" ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-cyan-400" /> Score
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/75" /> Avg
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/70" /> Peak
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ height: 220, overflow: "visible" }} className="bg-navy-950/40 rounded-xl border border-navy-700/25 p-2">
            {activeTab === "24h" ? (
              <AreaLineChart data={historicalData} />
            ) : (
              <WeeklyBarChart data={weeklyData} />
            )}
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="navy-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Risk Distribution
          </h3>
          <div style={{ height: 180, overflow: "visible" }} className="flex items-center justify-center">
            <RiskDonut data={riskDistribution} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {riskDistribution.map((d) => (
              <div key={d.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-800/30">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color, opacity: 0.85 }} />
                <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                <span className="text-[10px] text-white font-bold ml-auto tabular-nums">{d.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sensor Analysis Row ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sensor Radar */}
        <div className="navy-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Sensor Breakdown
          </h3>
          <div style={{ height: 220, overflow: "visible" }} className="flex items-center justify-center">
            <SensorRadar breakdown={sensorBreakdown} />
          </div>
          {/* Breakdown bars */}
          <div className="space-y-2.5 mt-2">
            {([
              { key: "stress", label: "Stress", color: "bg-red-500" },
              { key: "vibration", label: "Vibration", color: "bg-orange-500" },
              { key: "load", label: "Load", color: "bg-yellow-500" },
              { key: "environmental", label: "Environment", color: "bg-emerald-500" },
            ] as const).map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                  <span className="text-[10px] text-white font-bold tabular-nums">{Math.round(sensorBreakdown[s.key] * 100)}%</span>
                </div>
                <div className="h-1.5 bg-navy-800/50 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${sensorBreakdown[s.key] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Heatmap — spans 2 cols */}
        <div className="lg:col-span-2 navy-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Risk Heatmap — Hourly by Day
          </h3>
          <div style={{ height: 200, overflow: "visible" }} className="bg-navy-950/40 rounded-xl border border-navy-700/25 p-3">
            <HeatmapGrid data={heatmapData} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: "Rush Hour Peak", value: "08:00 – 10:00", sub: "Morning commute" },
              { label: "Evening Surge", value: "17:00 – 19:00", sub: "Return traffic" },
              { label: "Lowest Risk", value: "02:00 – 05:00", sub: "Night window" },
            ].map((insight) => (
              <div key={insight.label} className="bg-navy-800/30 rounded-lg px-3 py-2.5">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{insight.label}</div>
                <div className="text-[13px] text-white font-bold mt-0.5 tabular-nums">{insight.value}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{insight.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alert Timeline + Sensor Readings ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert Activity */}
        <div className="navy-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Alert Timeline
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {alertTimeline.map((a, i) => (
              <div key={i} className="flex items-start gap-3 bg-navy-800/30 rounded-lg px-3.5 py-2.5 border border-navy-700/20">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-white font-bold truncate">{a.label}</span>
                    <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">{a.time}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: a.color }}>{a.severity}</span>
                    <span className="text-[9px] text-slate-600">&bull;</span>
                    <span className="text-[10px] text-slate-500 truncate">{a.bridge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Reading Summary */}
        <div className="navy-card p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Sensor Reading Summary
          </h3>
          <div className="space-y-3">
            {sensorDistribution.map((s) => {
              const pct = Math.round((s.count / 500) * 100);
              const barColor = pct > 70 ? "bg-red-500" : pct > 50 ? "bg-orange-500" : pct > 30 ? "bg-yellow-500" : "bg-cyan-500";
              return (
                <div key={s.category} className="bg-navy-800/30 rounded-lg px-4 py-3 border border-navy-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white font-bold">{s.category}</span>
                    <span className="text-[11px] text-cyan-400 font-mono font-bold tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700/30 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-slate-600">readings / interval</span>
                    <span className="text-[9px] text-slate-500 font-mono">{pct}% capacity</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-navy-700/20">
            {[
              { label: "Total Readings", value: sensorDistribution.reduce((s, d) => s + d.count, 0).toLocaleString() },
              { label: "Active Sensors", value: "47" },
              { label: "Uptime", value: "99.7%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-sm text-white font-bold tabular-nums">{stat.value}</div>
                <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
