import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentLog, Alert, Decision, RiskAssessment } from "./types/schemas";
import type { ConnectionStatus } from "./api/sse";
import { DEFAULT_STRUCTURES, applyRiskToStructures } from "./data/structures";
import type { Structure } from "./data/structures";
import { fetchAlerts, fetchAgentLogs, fetchStatus, startScenario } from "./api/client";
import { createSSEConnection } from "./api/sse";
import { useSmoothScroll } from "./hooks/useLenis";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LandingPage from "./components/LandingPage";
import AboutModal from "./components/AboutModal";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardOverview from "./pages/DashboardOverview";
import BridgeMap from "./pages/BridgeMap";
import AnalyticsHub from "./pages/AnalyticsHub";
import Stakeholders from "./pages/Stakeholders";
import Settings from "./pages/Settings";
import DamageScan from "./pages/DamageScan";

const MAX_ALERTS = 50;
const MAX_AGENT_LOGS = 100;
const SCENARIO_TIMEOUT = 35_000;


function App() {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connection, setConnection] = useState<ConnectionStatus>("disconnected");
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState("overview");
  const [entered, setEntered] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [structures, setStructures] = useState<Structure[]>(DEFAULT_STRUCTURES);
  const [activeStructureId, setActiveStructureId] = useState<string | null>(null);
  const scenarioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLevel = useRef<string | null>(null);
  const seenLogIds = useRef<Set<string>>(new Set());
  const mainRef = useRef<HTMLElement>(null);
  const scrollToTop = useSmoothScroll(mainRef);

  // ── Navigate handler: reset scroll instantly BEFORE React re-render ─
  const handleNavigate = useCallback((page: string) => {
    scrollToTop();
    setCurrentPage(page);
  }, [scrollToTop]);

  // Safety net: also reset after React commits the new page
  useEffect(() => {
    scrollToTop();
  }, [currentPage, scrollToTop]);

  // Reset scroll when entering dashboard from landing page
  useEffect(() => {
    if (entered) {
      // Use rAF to ensure <main> is mounted before resetting scroll
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
        }
      });
    }
  }, [entered]);

  // ── SSE + initial data ──────────────────────────────────────────────
  useEffect(() => {
    // Hydrate from last-known state (bridge until SSE connects)
    fetchStatus().then((update) => {
      if (update) {
        setRisk(update.risk);
        setDecision(update.decision);
        if (update.alert) {
          setAlerts((prev) => [update.alert!, ...prev].slice(0, MAX_ALERTS));
        }
      }
    });

    fetchAlerts().then((existing) => {
      if (existing.length) setAlerts(existing);
    });

    fetchAgentLogs().then((existing) => {
      if (existing.length) {
        for (const l of existing) seenLogIds.current.add(l.id);
        setAgentLogs(existing.slice(-MAX_AGENT_LOGS));
      }
    });

    const disconnect = createSSEConnection(
      (update) => {
        setRisk(update.risk);
        setDecision(update.decision);
        if (update.alert) {
          setAlerts((prev) => [update.alert!, ...prev].slice(0, MAX_ALERTS));
        }
        if (update.agent_logs?.length) {
          setAgentLogs((prev) => {
            const updated = [...prev];
            for (const log of update.agent_logs!) {
              if (!seenLogIds.current.has(log.id)) {
                seenLogIds.current.add(log.id);
                updated.push(log);
              }
            }
            return updated.slice(-MAX_AGENT_LOGS);
          });
        }
      },
      (status) => setConnection(status)
    );

    // Fallback poll: if SSE drops, keep cards alive by polling status
    const pollId = setInterval(async () => {
      const update = await fetchStatus();
      if (update) {
        setRisk(update.risk);
        setDecision(update.decision);
        if (update.alert) {
          setAlerts((prev) => {
            if (prev[0]?.timestamp === update.alert!.timestamp) return prev;
            return [update.alert!, ...prev].slice(0, MAX_ALERTS);
          });
        }
      }
    }, 4000);

    return () => {
      disconnect();
      clearInterval(pollId);
    };
  }, []);

  // ── RED Alert effects ───────────────────────────────────────────────
  useEffect(() => {
    if (!risk) return;
    const level = risk.risk_level;

    // When transitioning TO red
    if (level === "RED" && prevLevel.current !== "RED") {
      setRedFlash(true);
      setTimeout(() => setRedFlash(false), 1500);

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚠️ IRIS Critical Alert", {
          body: `Risk score ${risk.overall_score}/100 — EVACUATE protocol activated`,
          icon: "/favicon.svg",
        });
      }
    }

    // Notify on any transition to ORANGE or RED
    if ((level === "ORANGE" || level === "RED") && prevLevel.current !== level) {
      if ("Notification" in window && Notification.permission === "granted") {
        const msg = level === "RED"
          ? `CRITICAL: Risk score ${risk.overall_score}/100 — Immediate action required`
          : `WARNING: Risk score ${risk.overall_score}/100 — Increased monitoring active`;
        new Notification(`${level === "RED" ? "🔴" : "🟠"} IRIS ${level} Alert`, {
          body: msg,
          icon: "/favicon.svg",
          tag: `iris-${level}`, // prevents duplicate notifications
        });
      }
    }

    prevLevel.current = level;
  }, [risk]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Demo Notifications (when backend disconnected) ──────────────────
  useEffect(() => {
    if (connection !== "disconnected") return;

    const demoAlerts = [
      { title: "📊 Sensor Update", body: "Adyar River Bridge — Vibration index elevated to 67%" },
      { title: "⚠️ Load Warning", body: "Kathipara Flyover — Peak traffic load detected (18,200 vehicles)" },
      { title: "🌡️ Temperature Alert", body: "Napier Bridge — Surface temperature exceeding 42°C threshold" },
      { title: "📡 Monitoring Active", body: "IRIS scanning 47 sensors across 5 structures in Chennai" },
      { title: "🔧 Maintenance Due", body: "Ripon Building — Scheduled foundation check in 3 days" },
      { title: "🔴 Stress Warning", body: "Adyar River Bridge — Structural stress at 78%, approaching critical" },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        const alert = demoAlerts[idx % demoAlerts.length];
        new Notification(alert.title, {
          body: alert.body,
          icon: "/favicon.svg",
          tag: `iris-demo-${idx}`,
          silent: true,
        });
        idx++;
      }
    }, 30_000); // Every 30 seconds

    // Send first notification after 5 seconds
    const firstTimeout = setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("📡 IRIS Monitoring Active", {
          body: "Demo mode — Monitoring 5 structures across Chennai. Notifications enabled.",
          icon: "/favicon.svg",
          tag: "iris-demo-start",
        });
      }
    }, 5_000);

    return () => {
      clearInterval(interval);
      clearTimeout(firstTimeout);
    };
  }, [connection]);

  // ── Scenario handler ────────────────────────────────────────────────
  const handleStartScenario = useCallback(async (name: string) => {
    setScenarioRunning(true);
    if (scenarioTimer.current) clearTimeout(scenarioTimer.current);

    const ok = await startScenario(name);
    if (!ok) {
      setScenarioRunning(false);
      return;
    }

    scenarioTimer.current = setTimeout(() => {
      setScenarioRunning(false);
    }, SCENARIO_TIMEOUT);
  }, []);

  useEffect(() => {
    return () => {
      if (scenarioTimer.current) clearTimeout(scenarioTimer.current);
    };
  }, []);

  // ── Demo state callback (timer logic lives in DemoScriptControls) ──
  const handleDemoRunningChange = useCallback((v: boolean) => setDemoRunning(v), []);
  const handleActiveStructureChange = useCallback((id: string | null) => setActiveStructureId(id), []);

  // ── Keep structures in sync with pipeline risk ──────────────────────
  useEffect(() => {
    if (risk) {
      setStructures(applyRiskToStructures(DEFAULT_STRUCTURES, risk.overall_score, risk.risk_level));
    }
  }, [risk]);

  const filteredAlertCount = alerts.filter(
    (a) => a.severity === "ORANGE" || a.severity === "RED"
  ).length;

  // ── Landing Page Gate ───────────────────────────────────────────────
  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} onDamageScan={() => { setEntered(true); handleNavigate("damage-scan"); }} />;
  }

  // ── Page Router ─────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return (
          <ErrorBoundary fallbackTitle="Dashboard failed to load">
            <DashboardOverview
              risk={risk}
              decision={decision}
              alerts={alerts}
              connection={connection}
              scenarioRunning={scenarioRunning}
              filteredAlertCount={filteredAlertCount}
              onStartScenario={handleStartScenario}
              agentLogs={agentLogs}
              demoRunning={demoRunning}
              onDemoRunningChange={handleDemoRunningChange}
              structures={structures}
              activeStructureId={activeStructureId}
              onActiveStructureChange={handleActiveStructureChange}
              onNavigate={handleNavigate}
            />
          </ErrorBoundary>
        );
      case "map":
        return (
          <ErrorBoundary fallbackTitle="Map failed to load">
            <BridgeMap structures={structures} alerts={alerts} activeStructureId={activeStructureId} />
          </ErrorBoundary>
        );
      case "analytics":
        return (
          <ErrorBoundary fallbackTitle="Analytics failed to load">
            <AnalyticsHub risk={risk} alerts={alerts} />
          </ErrorBoundary>
        );
      case "stakeholders":
        return (
          <ErrorBoundary fallbackTitle="Stakeholders failed to load">
            <Stakeholders />
          </ErrorBoundary>
        );
      case "settings":
        return (
          <ErrorBoundary fallbackTitle="Settings failed to load">
            <Settings />
          </ErrorBoundary>
        );
      case "damage-scan":
        return (
          <ErrorBoundary fallbackTitle="Damage Scan failed to load">
            <DamageScan onNavigate={handleNavigate} />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary fallbackTitle="Dashboard failed to load">
            <DashboardOverview
              risk={risk}
              decision={decision}
              alerts={alerts}
              connection={connection}
              scenarioRunning={scenarioRunning}
              filteredAlertCount={filteredAlertCount}
              onStartScenario={handleStartScenario}
              agentLogs={agentLogs}
              demoRunning={demoRunning}
              onDemoRunningChange={handleDemoRunningChange}
              structures={structures}
              activeStructureId={activeStructureId}
              onActiveStructureChange={handleActiveStructureChange}
              onNavigate={handleNavigate}
            />
          </ErrorBoundary>
        );
    }
  };

  const isRed = risk?.risk_level === "RED";

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen bg-navy-950 font-sans ${isRed ? "red-alert-border" : ""}`}>
      {/* Red flash overlay */}
      {redFlash && (
        <div className="fixed inset-0 z-[200] bg-red-500/10 pointer-events-none animate-red-flash" />
      )}

      {/* About Modal */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onAboutOpen={() => setAboutOpen(true)}
        onExit={() => { setEntered(false); handleNavigate("overview"); }}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header
          riskLevel={risk?.risk_level ?? null}
          connection={connection}
          currentPage={currentPage}
        />

        {/* Connection banner */}
        {connection === "disconnected" && (
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 text-center text-xs text-cyan-300 flex items-center justify-center gap-2 animate-enter">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Demo Mode — Showing simulated data &bull; Start backend for live streaming</span>
          </div>
        )}

        {connection === "connected" && (
          <div className="bg-emerald-500/[0.06] border-b border-emerald-500/15 px-4 py-1.5 text-center text-xs text-emerald-400 flex items-center justify-center gap-2 animate-enter">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">LIVE — Connected to IRIS Backend</span>
          </div>
        )}

        {/* Main scrollable content */}
        <main ref={mainRef} className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-navy-950 p-4 lg:p-6 pb-20 md:pb-6" style={{ scrollBehavior: 'auto' }}>
          <div className="max-w-[1520px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
