// ── Risk levels ──────────────────────────────────────────────────────────────

export type RiskLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type ActionLevel = "MONITOR" | "WARN" | "RESTRICT" | "EVACUATE";

// ── Breakdown ────────────────────────────────────────────────────────────────

export interface SensorBreakdown {
  stress_score: number;
  vibration_score: number;
  load_score: number;
  environmental_score: number;
}

// ── Core models ──────────────────────────────────────────────────────────────

export interface RiskAssessment {
  overall_score: number;
  risk_level: RiskLevel;
  breakdown: SensorBreakdown;
  contributing_factors: string[];
  forced_red?: boolean;
  forced_red_reason?: string | null;
}

export interface Decision {
  action: ActionLevel;
  urgency: string;
  recommended_actions: string[];
  justification: string;
}

export interface Alert {
  severity: string;
  title: string;
  message: string;
  timestamp: string;
}

// ── Agent activity log ──────────────────────────────────────────────────────────

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: "Ingestion" | "RiskScorer" | "Decision" | "Alert";
  message: string;
}

// ── SSE payload ──────────────────────────────────────────────────────────────

export interface SSEUpdate {
  timestamp: string;
  risk: RiskAssessment;
  decision: Decision;
  alert: Alert | null;
  agent_logs?: AgentLog[];
}
