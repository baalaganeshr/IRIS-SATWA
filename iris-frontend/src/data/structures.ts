/* ═══════════════════════════════════════════════════════════════════
   Shared Structure Data — consumed by Overview + Risk Map + any page
   ═══════════════════════════════════════════════════════════════════ */

export interface Structure {
  id: string;
  name: string;
  type: "bridge" | "building" | "overpass";
  position: { top: string; left: string };
  riskLevel: number;
  status: string;
  details: {
    built: string;
    material: string;
    spans: number;
    lastInspection: string;
    loadCapacity: string;
    length?: string;
    width?: string;
    foundation?: string;
    seismicRating?: string;
    trafficLoad?: string;
    maintenanceHistory?: string[];
  };
}

/* ── Default structure data (Chennai) ────────────────────────────── */

export const DEFAULT_STRUCTURES: Structure[] = [
  {
    id: "BR-001",
    name: "Adyar River Bridge (Anna Salai)",
    type: "bridge",
    position: { top: "30%", left: "20%" },
    riskLevel: 82,
    status: "Critical",
    details: {
      built: "1987", material: "Reinforced Concrete", spans: 4, lastInspection: "2025-12-15", loadCapacity: "45 tons",
      length: "320m", width: "18m", foundation: "Deep Piling (24m)", seismicRating: "Zone III",
      trafficLoad: "12,400 vehicles/day",
      maintenanceHistory: ["2025-12: Crack monitoring sensors installed", "2025-06: Bearing pad replacement (NHAI)", "2024-09: Deck resurfacing — PWD", "2023-03: Structural load test — IIT Madras"],
    },
  },
  {
    id: "BR-002",
    name: "Kathipara Flyover (NH-45)",
    type: "overpass",
    position: { top: "48%", left: "50%" },
    riskLevel: 35,
    status: "Normal",
    details: {
      built: "2010", material: "Steel & Concrete", spans: 2, lastInspection: "2026-01-20", loadCapacity: "60 tons",
      length: "180m", width: "22m", foundation: "Spread Footing", seismicRating: "Zone III",
      trafficLoad: "18,200 vehicles/day",
      maintenanceHistory: ["2026-01: Routine inspection — passed (CMDA)", "2025-07: Joint sealant replacement", "2025-01: Anti-corrosion coating"],
    },
  },
  {
    id: "BL-001",
    name: "Ripon Building (Corporation HQ)",
    type: "building",
    position: { top: "72%", left: "22%" },
    riskLevel: 48,
    status: "Elevated",
    details: {
      built: "1913", material: "Heritage Masonry & Steel Frame", spans: 1, lastInspection: "2026-02-01", loadCapacity: "N/A",
      length: "85m", width: "60m", foundation: "Mat Foundation", seismicRating: "Zone III",
      trafficLoad: "N/A",
      maintenanceHistory: ["2026-02: Foundation settlement check", "2025-10: Seismic retrofitting assessment", "2025-05: Fire safety audit — TNFRS"],
    },
  },
  {
    id: "BR-003",
    name: "Napier Bridge (Cooum River)",
    type: "bridge",
    position: { top: "30%", left: "78%" },
    riskLevel: 62,
    status: "High",
    details: {
      built: "1869", material: "Stone & Pre-stressed Concrete", spans: 3, lastInspection: "2025-11-30", loadCapacity: "15 tons",
      length: "140m", width: "6m", foundation: "Bored Piles (18m)", seismicRating: "Zone III",
      trafficLoad: "2,800 pedestrians/day",
      maintenanceHistory: ["2025-11: Vibration anomaly detected", "2025-08: Heritage railing restoration", "2025-02: Deck waterproofing — Chennai Corp"],
    },
  },
  {
    id: "BL-002",
    name: "T. Nagar Residential Block",
    type: "building",
    position: { top: "72%", left: "68%" },
    riskLevel: 20,
    status: "Normal",
    details: {
      built: "2018", material: "Reinforced Concrete", spans: 1, lastInspection: "2026-01-10", loadCapacity: "N/A",
      length: "45m", width: "30m", foundation: "Raft Foundation", seismicRating: "Zone III",
      trafficLoad: "N/A",
      maintenanceHistory: ["2026-01: Annual structural audit — passed (CMDA)", "2025-06: Plumbing & utility check"],
    },
  },
];

/* ── Helper functions ────────────────────────────────────────────── */

export function getRiskColor(level: number): string {
  if (level >= 75) return "bg-red-500";
  if (level >= 50) return "bg-orange-500";
  if (level >= 25) return "bg-yellow-500";
  return "bg-green-500";
}

export function getRiskTextColor(level: number): string {
  if (level >= 75) return "text-red-400";
  if (level >= 50) return "text-orange-400";
  if (level >= 25) return "text-amber-400";
  return "text-green-400";
}

export function getRiskBg(level: number): string {
  if (level >= 75) return "bg-red-500/10";
  if (level >= 50) return "bg-orange-500/10";
  if (level >= 25) return "bg-amber-500/10";
  return "bg-green-500/10";
}

export function getTypeIcon(type: string): string {
  switch (type) {
    case "bridge": return "🌉";
    case "overpass": return "🛣️";
    case "building": return "🏢";
    default: return "📍";
  }
}

export function statusFromRisk(score: number): string {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Elevated";
  return "Normal";
}

/**
 * Apply a pipeline risk update to the structures array.
 * The primary structure (index 0) gets the real pipeline score.
 * Other structures get a correlated jitter so the whole fleet reacts.
 */
export function applyRiskToStructures(
  base: Structure[],
  overallScore: number,
  riskLevel: string,
): Structure[] {
  return base.map((s, i) => {
    if (i === 0) {
      // Primary: direct pipeline score
      return { ...s, riskLevel: overallScore, status: statusFromRisk(overallScore) };
    }
    // Others: correlate with pipeline — shift toward the overall score
    const delta = (overallScore - s.riskLevel) * 0.35; // 35% correlation
    const jitter = Math.round(Math.random() * 6 - 3);  // ±3 noise
    const newLevel = Math.max(0, Math.min(100, Math.round(s.riskLevel + delta + jitter)));
    return { ...s, riskLevel: newLevel, status: statusFromRisk(newLevel) };
  });
}
