import { useState } from "react";
import { exportStakeholderReport } from "../utils/pdfExport";

/* ── Types ────────────────────────────────────────────────────────── */

type UserRole = "Police" | "Government" | "Fire Department" | "Emergency Medical" | "Structural Engineer";
type UserStatus = "Online" | "Offline" | "On Duty";

interface Stakeholder {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  area: string;
  status: UserStatus;
  lastActive: string;
  phone: string;
}

interface NearbyBuilding {
  id: string;
  name: string;
  type: string;
  distance: string;
  occupancy: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  evacuationTime: string;
}

/* ── Data ─────────────────────────────────────────────────────────── */

const STAKEHOLDERS: Stakeholder[] = [
  { id: "USR-001", name: "Inspector Rajan K.", role: "Police", department: "Traffic Division", area: "Central Bridge Zone", status: "On Duty", lastActive: "0m ago", phone: "+91 98765 43210" },
  { id: "USR-002", name: "Commissioner Meena S.", role: "Police", department: "Disaster Response Unit", area: "City HQ", status: "Online", lastActive: "2m ago", phone: "+91 98765 43211" },
  { id: "USR-003", name: "Collector Arjun P.", role: "Government", department: "District Administration", area: "District Office", status: "Online", lastActive: "1m ago", phone: "+91 98765 43212" },
  { id: "USR-004", name: "Secretary Divya R.", role: "Government", department: "Urban Development", area: "Municipal Corp", status: "Online", lastActive: "5m ago", phone: "+91 98765 43213" },
  { id: "USR-005", name: "Chief Eng. Prakash N.", role: "Structural Engineer", department: "TN-PWD Structures", area: "Bridge Monitoring Cell, Chennai", status: "On Duty", lastActive: "0m ago", phone: "+91 44 2345 6001" },
  { id: "USR-006", name: "Commander Vijay T.", role: "Fire Department", department: "TN Fire & Rescue (TNFRS)", area: "Station 3 - Mylapore", status: "On Duty", lastActive: "0m ago", phone: "+91 44 2538 5001" },
  { id: "USR-007", name: "Dr. Priya M.", role: "Emergency Medical", department: "Emergency Services", area: "Rajiv Gandhi Govt. Hospital", status: "Online", lastActive: "3m ago", phone: "+91 44 2530 5001" },
  { id: "USR-008", name: "Sub-Inspector Karthik L.", role: "Police", department: "Traffic Control", area: "Adyar Traffic Station", status: "Offline", lastActive: "45m ago", phone: "+91 44 2345 0002" },
  { id: "USR-009", name: "Joint Collector Anita B.", role: "Government", department: "Revenue & Disaster Mgmt", area: "District Office", status: "Online", lastActive: "0m ago", phone: "+91 98765 43218" },
];

const NEARBY_BUILDINGS: NearbyBuilding[] = [
  { id: "NB-001", name: "Govt. Higher Secondary School, Nungambakkam", type: "Educational", distance: "200m", occupancy: 850, riskLevel: "High", evacuationTime: "12 min" },
  { id: "NB-002", name: "Rajiv Gandhi Govt. General Hospital", type: "Medical", distance: "350m", occupancy: 1200, riskLevel: "Critical", evacuationTime: "25 min" },
  { id: "NB-003", name: "Adyar Riverside Apartments (Block A-D)", type: "Residential", distance: "150m", occupancy: 480, riskLevel: "High", evacuationTime: "15 min" },
  { id: "NB-004", name: "Koyambedu Market Complex", type: "Commercial", distance: "400m", occupancy: 2000, riskLevel: "Medium", evacuationTime: "20 min" },
  { id: "NB-005", name: "TNFRS Fire Station, Mylapore", type: "Emergency Services", distance: "500m", occupancy: 35, riskLevel: "Low", evacuationTime: "3 min" },
  { id: "NB-006", name: "Greater Chennai Corporation Office", type: "Government", distance: "300m", occupancy: 200, riskLevel: "Medium", evacuationTime: "8 min" },
  { id: "NB-007", name: "Kapaleeshwarar Temple Complex", type: "Religious/Heritage", distance: "250m", occupancy: 500, riskLevel: "High", evacuationTime: "18 min" },
];

/* ── Status Colors ────────────────────────────────────────────────── */

function getStatusColor(status: UserStatus): string {
  switch (status) {
    case "Online": return "bg-green-500/20 text-green-400";
    case "On Duty": return "bg-cyan-500/20 text-cyan-400";
    case "Offline": return "bg-red-500/20 text-red-400";
  }
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case "Police": return "bg-blue-500/20 text-blue-400";
    case "Government": return "bg-sky-500/20 text-sky-400";
    case "Fire Department": return "bg-orange-500/20 text-orange-400";
    case "Emergency Medical": return "bg-emerald-500/20 text-emerald-400";
    case "Structural Engineer": return "bg-cyan-500/20 text-cyan-400";
  }
}

function getBuildingRiskColor(risk: string): string {
  switch (risk) {
    case "Critical": return "bg-red-500/20 text-red-400";
    case "High": return "bg-orange-500/20 text-orange-400";
    case "Medium": return "bg-yellow-500/20 text-yellow-400";
    case "Low": return "bg-green-500/20 text-green-400";
    default: return "bg-slate-500/20 text-slate-400";
  }
}

/* ── Component ────────────────────────────────────────────────────── */

type StakeholderFilter = "all" | UserRole;
type TabView = "users" | "buildings";

export default function Stakeholders() {
  const [filter, setFilter] = useState<StakeholderFilter>("all");
  const [tab, setTab] = useState<TabView>("users");

  const filteredUsers = STAKEHOLDERS.filter((u) => filter === "all" || u.role === filter);

  const roles: StakeholderFilter[] = ["all", "Police", "Government", "Fire Department", "Emergency Medical", "Structural Engineer"];

  return (
    <div className="space-y-5 animate-enter">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("users")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "users" ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-600/20" : "bg-navy-800 text-slate-400 border border-navy-700/60 hover:bg-navy-700 hover:text-white"
            }`}
          >
            👤 Stakeholders &amp; Officers
          </button>
          <button
            onClick={() => setTab("buildings")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "buildings" ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-600/20" : "bg-navy-800 text-slate-400 border border-navy-700/60 hover:bg-navy-700 hover:text-white"
            }`}
          >
            🏢 Nearby Critical Buildings
          </button>
        </div>
        <button
          onClick={() => exportStakeholderReport(STAKEHOLDERS, NEARBY_BUILDINGS)}
          className="btn-primary text-xs !py-2 !px-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      {tab === "users" ? (
        /* ── Users Table ────────────────────────────────────── */
        <div className="navy-card p-5">
          <h3 className="section-title mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Emergency Response Stakeholders
          </h3>


          {/* Filters */}
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                  filter === r ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25" : "bg-navy-900/50 text-slate-500 border border-navy-700/40 hover:bg-navy-700 hover:text-slate-300"
                }`}
              >
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-700/40">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="font-mono font-medium text-white whitespace-nowrap">{user.id}</td>
                    <td className="font-medium text-white">{user.name}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.department}</td>
                    <td>{user.area}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Nearby Buildings Table ─────────────────────────── */
        <div className="navy-card p-5">
          <h3 className="section-title mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Nearby Disaster-Critical Buildings &amp; Surroundings
          </h3>

          <div className="overflow-x-auto rounded-xl border border-navy-700/40">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Building</th>
                  <th>Type</th>
                  <th>Distance</th>
                  <th>Occupancy</th>
                  <th>Risk Level</th>
                  <th>Est. Evacuation</th>
                </tr>
              </thead>
              <tbody>
                {NEARBY_BUILDINGS.map((bldg) => (
                  <tr key={bldg.id}>
                    <td className="font-medium text-white">{bldg.name}</td>
                    <td>{bldg.type}</td>
                    <td className="font-mono text-cyan-400">{bldg.distance}</td>
                    <td className="font-mono font-bold text-white">{bldg.occupancy.toLocaleString()}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getBuildingRiskColor(bldg.riskLevel)}`}>
                        {bldg.riskLevel}
                      </span>
                    </td>
                    <td className="font-mono">{bldg.evacuationTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="metric-card text-center">
              <div className="text-2xl font-black text-red-400 font-mono">
                {NEARBY_BUILDINGS.reduce((sum, b) => sum + b.occupancy, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Total People at Risk</div>
            </div>
            <div className="metric-card text-center">
              <div className="text-2xl font-black text-orange-400 font-mono">
                {NEARBY_BUILDINGS.filter((b) => b.riskLevel === "Critical" || b.riskLevel === "High").length}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">High Risk Buildings</div>
            </div>
            <div className="metric-card text-center">
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {NEARBY_BUILDINGS.length}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Monitored Structures</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
