export default function Settings() {
  return (
    <div className="space-y-5 animate-enter">
      <div className="navy-card p-6">
        <h3 className="section-title mb-6">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Configuration
        </h3>

        <div className="space-y-6">
          {/* Architecture Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">System Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ["Engine", "4-Agent Pipeline"],
                ["Streaming", "SSE Real-time"],
                ["Backend", "FastAPI / Python"],
                ["Frontend", "React / TypeScript"],
                ["Sensor Interval", "3 seconds per reading"],
                ["Max Alerts Buffer", "50 alerts"],
                ["Scenario Timeout", "35 seconds"],
                ["Agent Pipeline", "Ingest → Risk → Decision → Alert"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between bg-navy-950/50 rounded-lg px-4 py-3 border border-navy-700/40">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm text-white font-medium font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Thresholds */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alert Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ["GREEN", "0 – 25", "text-green-400", "All normal"],
                ["YELLOW", "25 – 50", "text-amber-400", "Elevated monitoring"],
                ["ORANGE", "50 – 75", "text-orange-400", "High risk — attention required"],
                ["RED", "75 – 100", "text-red-400", "Critical — emergency protocol"],
              ].map(([level, range, color, desc]) => (
                <div key={level} className="flex items-center gap-3 bg-navy-950/50 rounded-lg px-4 py-3 border border-navy-700/40">
                  <span className={`text-sm font-bold font-mono ${color}`}>{level}</span>
                  <span className="text-sm text-slate-400">{range}</span>
                  <span className="text-xs text-slate-500 ml-auto">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">API Endpoints</h4>
            <div className="space-y-2">
              {[
                ["GET", "/api/status", "Current system status"],
                ["GET", "/api/alerts", "Alert history"],
                ["GET", "/api/stream", "SSE real-time stream"],
                ["GET", "/api/scenarios", "Available scenarios"],
                ["POST", "/api/scenarios/:name/start", "Start simulation"],
              ].map(([method, path, desc]) => (
                <div key={path} className="flex items-center gap-3 bg-navy-950/50 rounded-lg px-4 py-2.5 border border-navy-700/40">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    method === "GET" ? "bg-cyan-500/20 text-cyan-400" : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {method}
                  </span>
                  <span className="text-sm text-white font-mono">{path}</span>
                  <span className="text-xs text-slate-500 ml-auto hidden sm:inline">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Persistence */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Data Storage</h4>
            <div className="bg-navy-950/50 rounded-lg px-4 py-3 border border-navy-700/40 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-white font-medium">In-Memory (Demo Mode)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All data is stored in-memory for this demo. Alerts are capped at 50 entries. 
                Restarting the backend clears all data. For production deployment, 
                PostgreSQL + Redis are recommended for persistence and pub/sub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
