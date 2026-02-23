import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── Brand Colors ─────────────────────────────────────────────────── */

const COLORS = {
  bg: [4, 8, 17] as [number, number, number],
  card: [17, 24, 39] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  slate300: [203, 213, 225] as [number, number, number],
  slate400: [148, 163, 184] as [number, number, number],
  slate500: [100, 116, 139] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  magenta: [217, 70, 239] as [number, number, number],
};

function getRiskColor(level: number): [number, number, number] {
  if (level >= 75) return COLORS.red;
  if (level >= 50) return COLORS.orange;
  if (level >= 25) return COLORS.amber;
  return COLORS.green;
}

/* ── Common PDF Header / Footer ───────────────────────────────────── */

function addBranding(doc: jsPDF, title: string, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Dark background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageW, 50, "F");

  // Accent line
  doc.setFillColor(...COLORS.cyan);
  doc.rect(0, 0, pageW, 3, "F");

  // Gradient accent (left magenta to right cyan)
  doc.setFillColor(...COLORS.magenta);
  doc.rect(0, 0, pageW / 2, 3, "F");
  doc.setFillColor(...COLORS.cyan);
  doc.rect(pageW / 2, 0, pageW / 2, 3, "F");

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.cyan);
  doc.text("IRIS", 15, 22);

  // Version badge
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate400);
  doc.text("v1.0", 46, 22);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text(title, 15, 36);

  // Subtitle
  if (subtitle) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate500);
    doc.text(subtitle, 15, 44);
  }

  // Timestamp
  const now = new Date();
  const ts = now.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.text(`Generated: ${ts}`, pageW - 15, 22, { align: "right" });
  doc.text("Infrastructure Risk Intelligence System", pageW - 15, 30, { align: "right" });
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    const pageW = doc.internal.pageSize.getWidth();

    // Footer line
    doc.setDrawColor(...COLORS.slate500);
    doc.setLineWidth(0.3);
    doc.line(15, pageH - 15, pageW - 15, pageH - 15);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.text("IRIS — Infrastructure Risk Intelligence System • Confidential", 15, pageH - 9);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 15, pageH - 9, { align: "right" });
  }
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.text(title.toUpperCase(), 15, y);

  // Underline
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.5);
  const textW = doc.getTextWidth(title.toUpperCase());
  doc.line(15, y + 1.5, 15 + textW, y + 1.5);

  return y + 8;
}

/* ══════════════════════════════════════════════════════════════════════
   1. STRUCTURAL REPORT PDF
   ══════════════════════════════════════════════════════════════════════ */

interface StructureData {
  id: string;
  name: string;
  type: string;
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

export function exportStructuralReport(structure: StructureData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addBranding(doc, `Structural Report — ${structure.name}`, `${structure.id} • ${structure.type.charAt(0).toUpperCase() + structure.type.slice(1)} • Generated Report`);

  let y = 60;

  // ── Risk Assessment Banner ──
  const riskClr = getRiskColor(structure.riskLevel);
  doc.setFillColor(...COLORS.card);
  doc.roundedRect(15, y, 180, 28, 3, 3, "F");
  doc.setFillColor(...riskClr);
  doc.roundedRect(15, y, 4, 28, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.text("OVERALL RISK ASSESSMENT", 25, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...riskClr);
  doc.text(`${structure.riskLevel}%`, 25, y + 23);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(structure.status.toUpperCase(), 60, y + 23);

  // Risk bar
  doc.setFillColor(30, 40, 58);
  doc.roundedRect(100, y + 16, 85, 6, 2, 2, "F");
  doc.setFillColor(...riskClr);
  doc.roundedRect(100, y + 16, Math.max(4, (structure.riskLevel / 100) * 85), 6, 2, 2, "F");

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate400);
  doc.text("0%", 100, y + 14);
  doc.text("100%", 181, y + 14);

  y += 38;

  // ── Engineering Specifications ──
  y = addSectionTitle(doc, "Engineering Specifications", y);

  const specs = [
    ["Material", structure.details.material],
    ["Year Built", structure.details.built],
    ["Length", structure.details.length ?? "—"],
    ["Width", structure.details.width ?? "—"],
    ["Spans", String(structure.details.spans)],
    ["Load Capacity", structure.details.loadCapacity],
    ["Foundation", structure.details.foundation ?? "—"],
    ["Seismic Rating", structure.details.seismicRating ?? "—"],
    ["Traffic Load", structure.details.trafficLoad ?? "—"],
    ["Last Inspection", structure.details.lastInspection],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Value"]],
    body: specs,
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Maintenance History ──
  if (structure.details.maintenanceHistory?.length) {
    y = addSectionTitle(doc, "Maintenance History", y);

    autoTable(doc, {
      startY: y,
      head: [["#", "Entry"]],
      body: structure.details.maintenanceHistory.map((entry, i) => [String(i + 1), entry]),
      margin: { left: 15, right: 15 },
      styles: {
        fillColor: COLORS.card,
        textColor: COLORS.slate300,
        fontSize: 9,
        cellPadding: 4,
        lineColor: [26, 35, 50],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [26, 35, 50],
        textColor: COLORS.cyan,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [10, 15, 26],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── AI Recommendations ──
  y = addSectionTitle(doc, "AI Recommendations", y);

  const recs = structure.riskLevel >= 75
    ? [
        "Immediate load restriction to 50% capacity recommended",
        "Deploy additional vibration sensors on critical spans",
        "Schedule emergency structural assessment within 48 hours",
        "Notify District Administration and TN Fire & Rescue services",
      ]
    : structure.riskLevel >= 50
    ? [
        "Increase monitoring frequency to every 30 minutes",
        "Plan detailed inspection within 2 weeks",
        "Review and update emergency evacuation routes",
      ]
    : [
        "Continue standard monitoring protocols",
        "Next routine inspection scheduled per calendar",
        "All parameters within acceptable tolerance",
      ];

  recs.forEach((rec) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate300);
    doc.text(`•  ${rec}`, 20, y);
    y += 6;
  });

  addFooter(doc);
  doc.save(`IRIS_Structural_Report_${structure.id}_${Date.now()}.pdf`);
}

/* ══════════════════════════════════════════════════════════════════════
   2. EMERGENCY PROTOCOL PDF
   ══════════════════════════════════════════════════════════════════════ */

export function exportEmergencyProtocol(structure: StructureData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isHighRisk = structure.riskLevel >= 50;
  const riskClr = getRiskColor(structure.riskLevel);

  addBranding(doc, `Emergency Protocol — ${structure.name}`, `${structure.id} • Threat Response Plan`);

  let y = 60;

  // ── Threat Level Banner ──
  doc.setFillColor(...(isHighRisk ? [40, 10, 10] as [number, number, number] : [40, 30, 10] as [number, number, number]));
  doc.roundedRect(15, y, 180, 30, 3, 3, "F");
  doc.setFillColor(...riskClr);
  doc.roundedRect(15, y, 4, 30, 2, 2, "F");

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate400);
  doc.text("CURRENT THREAT LEVEL", 25, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...riskClr);
  doc.text(structure.status.toUpperCase(), 25, y + 22);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate300);
  doc.text(`Risk Score: ${structure.riskLevel}/100`, 25, y + 28);

  y += 40;

  // ── Action Steps ──
  y = addSectionTitle(doc, "Immediate Action Steps", y);

  const steps = [
    { step: 1, action: "Activate emergency alert to all nearby stakeholders", status: isHighRisk ? "URGENT" : "STANDBY" },
    { step: 2, action: "Restrict vehicular and pedestrian access within 200m radius", status: isHighRisk ? "URGENT" : "STANDBY" },
    { step: 3, action: "Deploy Fire & Rescue teams to standby positions", status: isHighRisk ? "URGENT" : "READY" },
    { step: 4, action: "Initiate evacuation of nearby critical buildings", status: structure.riskLevel >= 75 ? "URGENT" : "STANDBY" },
    { step: 5, action: "Notify District Collector and Chennai Police Commissioner", status: isHighRisk ? "URGENT" : "STANDBY" },
    { step: 6, action: "Activate medical emergency response at Rajiv Gandhi Govt. Hospital", status: structure.riskLevel >= 75 ? "URGENT" : "STANDBY" },
    { step: 7, action: "Set up command post and communication channels", status: isHighRisk ? "READY" : "STANDBY" },
  ];

  autoTable(doc, {
    startY: y,
    head: [["Step", "Action", "Status"]],
    body: steps.map((s) => [String(s.step), s.action, s.status]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.red,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 25, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data: any) => {
      if (data.column.index === 2 && data.section === "body") {
        const val = data.cell.raw;
        if (val === "URGENT") data.cell.styles.textColor = COLORS.red;
        else if (val === "READY") data.cell.styles.textColor = COLORS.amber;
        else data.cell.styles.textColor = COLORS.slate500;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Emergency Contacts ──
  y = addSectionTitle(doc, "Emergency Contacts", y);

  autoTable(doc, {
    startY: y,
    head: [["Department", "Contact Number"]],
    body: [
      ["Chennai Police Control", "+91 44 2345 0000"],
      ["TN Fire & Rescue", "+91 44 2538 5000"],
      ["District Collector, Chennai", "+91 44 2536 1001"],
      ["Rajiv Gandhi Govt. Hospital", "+91 44 2530 5000"],
    ],
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      1: { textColor: COLORS.cyan, fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Evacuation Zones ──
  y = addSectionTitle(doc, "Evacuation Zone Information", y);

  autoTable(doc, {
    startY: y,
    head: [["Zone", "Radius", "Classification"]],
    body: [
      ["Exclusion Zone", "200m", "Immediate evacuation required"],
      ["Caution Zone", "500m", "Restricted access — authorized personnel only"],
      ["Alert Zone", "1 km", "Public advisory — stay alert for updates"],
    ],
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.orange,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    didParseCell: (data: any) => {
      if (data.column.index === 0 && data.section === "body") {
        const val = data.cell.raw;
        if (val === "Exclusion Zone") data.cell.styles.textColor = COLORS.red;
        else if (val === "Caution Zone") data.cell.styles.textColor = COLORS.orange;
        else data.cell.styles.textColor = COLORS.amber;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  addFooter(doc);
  doc.save(`IRIS_Emergency_Protocol_${structure.id}_${Date.now()}.pdf`);
}

/* ══════════════════════════════════════════════════════════════════════
   3. ANALYTICS REPORT PDF
   ══════════════════════════════════════════════════════════════════════ */

interface AnalyticsExportData {
  historicalData: { time: string; risk: number }[];
  predictiveData: { hour: string; predicted: number }[];
  sensorData: { category: string; count: number }[];
  currentRiskScore: number | null;
}

export function exportAnalyticsReport(data: AnalyticsExportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addBranding(doc, "Analytics & Predictive Insights Report", "Comprehensive risk analytics and sensor data analysis");

  let y = 60;

  // ── Current Status ──
  if (data.currentRiskScore !== null) {
    const riskClr = getRiskColor(data.currentRiskScore);
    doc.setFillColor(...COLORS.card);
    doc.roundedRect(15, y, 180, 20, 3, 3, "F");
    doc.setFillColor(...riskClr);
    doc.roundedRect(15, y, 4, 20, 2, 2, "F");

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate400);
    doc.text("CURRENT RISK SCORE", 25, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...riskClr);
    doc.text(`${data.currentRiskScore}%`, 25, y + 17);

    y += 28;
  }

  // ── Historical Risk Data ──
  y = addSectionTitle(doc, "Historical Risk Data (Today)", y);

  autoTable(doc, {
    startY: y,
    head: [["Time", "Risk Score (%)"]],
    body: data.historicalData.map((d) => [d.time, String(d.risk)]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 3,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    didParseCell: (data: any) => {
      if (data.column.index === 1 && data.section === "body") {
        const val = parseInt(data.cell.raw);
        if (val >= 75) data.cell.styles.textColor = COLORS.red;
        else if (val >= 50) data.cell.styles.textColor = COLORS.orange;
        else if (val >= 25) data.cell.styles.textColor = COLORS.amber;
        else data.cell.styles.textColor = COLORS.green;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Predictive Risk ──
  y = addSectionTitle(doc, "Predictive Risk Forecast (Next 6 Hours)", y);

  autoTable(doc, {
    startY: y,
    head: [["Hour", "Predicted Risk (%)"]],
    body: data.predictiveData.map((d) => [d.hour, String(d.predicted)]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 3,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    didParseCell: (data: any) => {
      if (data.column.index === 1 && data.section === "body") {
        const val = parseInt(data.cell.raw);
        if (val >= 75) data.cell.styles.textColor = COLORS.red;
        else if (val >= 50) data.cell.styles.textColor = COLORS.orange;
        else if (val >= 25) data.cell.styles.textColor = COLORS.amber;
        else data.cell.styles.textColor = COLORS.green;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Sensor Distribution ──
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y = addSectionTitle(doc, "Sensor Reading Distribution", y);

  autoTable(doc, {
    startY: y,
    head: [["Sensor Type", "Reading Count"]],
    body: data.sensorData.map((d) => [d.category, String(d.count)]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.magenta,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      1: { halign: "center", fontStyle: "bold", textColor: COLORS.cyan },
    },
  });

  // ── Summary Stats ──
  y = (doc as any).lastAutoTable.finalY + 10;
  y = addSectionTitle(doc, "Summary Statistics", y);

  const avgHistorical = Math.round(data.historicalData.reduce((s, d) => s + d.risk, 0) / data.historicalData.length);
  const avgPredicted = Math.round(data.predictiveData.reduce((s, d) => s + d.predicted, 0) / data.predictiveData.length);
  const peakHistorical = Math.max(...data.historicalData.map((d) => d.risk));
  const totalSensors = data.sensorData.reduce((s, d) => s + d.count, 0);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Average Historical Risk", `${avgHistorical}%`],
      ["Peak Historical Risk", `${peakHistorical}%`],
      ["Average Predicted Risk", `${avgPredicted}%`],
      ["Total Sensor Readings", totalSensors.toLocaleString()],
      ["Data Points Analyzed", String(data.historicalData.length + data.predictiveData.length + data.sensorData.length)],
    ],
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      1: { fontStyle: "bold", textColor: COLORS.white },
    },
  });

  addFooter(doc);
  doc.save(`IRIS_Analytics_Report_${Date.now()}.pdf`);
}

/* ══════════════════════════════════════════════════════════════════════
   4. STAKEHOLDERS REPORT PDF
   ══════════════════════════════════════════════════════════════════════ */

interface StakeholderData {
  id: string;
  name: string;
  role: string;
  department: string;
  area: string;
  status: string;
  lastActive: string;
  phone: string;
}

interface BuildingData {
  id: string;
  name: string;
  type: string;
  distance: string;
  occupancy: number;
  riskLevel: string;
  evacuationTime: string;
}

export function exportStakeholderReport(stakeholders: StakeholderData[], buildings: BuildingData[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  addBranding(doc, "Stakeholders & Emergency Response Report", "Personnel roster, contact details, and nearby infrastructure risk assessment");

  let y = 58;

  // ── Stakeholder Table ──
  y = addSectionTitle(doc, "Emergency Response Stakeholders", y);

  autoTable(doc, {
    startY: y,
    head: [["ID", "Name", "Role", "Department", "Area", "Status", "Last Active", "Phone"]],
    body: stakeholders.map((s) => [s.id, s.name, s.role, s.department, s.area, s.status, s.lastActive, s.phone]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 8,
      cellPadding: 3,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: COLORS.white, cellWidth: 20 },
      1: { textColor: COLORS.white, cellWidth: 38 },
      5: { cellWidth: 18 },
      7: { textColor: COLORS.cyan, cellWidth: 30 },
    },
    didParseCell: (data: any) => {
      if (data.column.index === 5 && data.section === "body") {
        const val = data.cell.raw;
        if (val === "Online") data.cell.styles.textColor = COLORS.green;
        else if (val === "On Duty") data.cell.styles.textColor = COLORS.cyan;
        else data.cell.styles.textColor = COLORS.red;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 2 && data.section === "body") {
        const val = data.cell.raw;
        if (val === "Police") data.cell.styles.textColor = [96, 165, 250];
        else if (val === "Government") data.cell.styles.textColor = [192, 132, 252];
        else if (val === "Fire Department") data.cell.styles.textColor = COLORS.orange;
        else if (val === "Emergency Medical") data.cell.styles.textColor = COLORS.green;
        else data.cell.styles.textColor = COLORS.cyan;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Buildings Table ──
  y = addSectionTitle(doc, "Nearby Disaster-Critical Buildings", y);

  autoTable(doc, {
    startY: y,
    head: [["Building", "Type", "Distance", "Occupancy", "Risk Level", "Est. Evacuation"]],
    body: buildings.map((b) => [b.name, b.type, b.distance, b.occupancy.toLocaleString(), b.riskLevel, b.evacuationTime]),
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 8,
      cellPadding: 3,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      0: { textColor: COLORS.white, fontStyle: "bold" },
      2: { textColor: COLORS.cyan },
      3: { halign: "center", fontStyle: "bold", textColor: COLORS.white },
    },
    didParseCell: (data: any) => {
      if (data.column.index === 4 && data.section === "body") {
        const val = data.cell.raw;
        if (val === "Critical") data.cell.styles.textColor = COLORS.red;
        else if (val === "High") data.cell.styles.textColor = COLORS.orange;
        else if (val === "Medium") data.cell.styles.textColor = COLORS.amber;
        else data.cell.styles.textColor = COLORS.green;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── Summary ──
  y = (doc as any).lastAutoTable.finalY + 12;
  y = addSectionTitle(doc, "Summary", y);

  const totalPeople = buildings.reduce((s, b) => s + b.occupancy, 0);
  const highRisk = buildings.filter((b) => b.riskLevel === "Critical" || b.riskLevel === "High").length;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Stakeholders", String(stakeholders.length)],
      ["Currently On Duty", String(stakeholders.filter((s) => s.status === "On Duty").length)],
      ["Total People at Risk (Nearby Buildings)", totalPeople.toLocaleString()],
      ["High/Critical Risk Buildings", String(highRisk)],
      ["Total Monitored Structures", String(buildings.length)],
    ],
    margin: { left: 15, right: 15 },
    styles: {
      fillColor: COLORS.card,
      textColor: COLORS.slate300,
      fontSize: 9,
      cellPadding: 4,
      lineColor: [26, 35, 50],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [26, 35, 50],
      textColor: COLORS.cyan,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [10, 15, 26],
    },
    columnStyles: {
      1: { fontStyle: "bold", textColor: COLORS.white, halign: "center" },
    },
  });

  addFooter(doc);
  doc.save(`IRIS_Stakeholder_Report_${Date.now()}.pdf`);
}
