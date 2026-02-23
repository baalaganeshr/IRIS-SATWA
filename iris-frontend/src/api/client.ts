import type { AgentLog, Alert, SSEUpdate } from "../types/schemas";

const API_BASE = "/api";

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) return [];
    return (await res.json()) as Alert[];
  } catch {
    console.warn("Failed to fetch alerts");
    return [];
  }
}

export async function fetchAgentLogs(): Promise<AgentLog[]> {
  try {
    const res = await fetch(`${API_BASE}/agent-logs`);
    if (!res.ok) return [];
    return (await res.json()) as AgentLog[];
  } catch {
    console.warn("Failed to fetch agent logs");
    return [];
  }
}

export async function startScenario(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scenarios/${name}/start`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    console.warn(`Failed to start scenario: ${name}`);
    return false;
  }
}

export async function fetchStatus(): Promise<SSEUpdate | null> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok || res.status === 204) return null;
    return (await res.json()) as SSEUpdate;
  } catch {
    return null;
  }
}
