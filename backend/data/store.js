const { v4: uuidv4 } = require("uuid");
let reports = [
  {
    id: uuidv4(),
    lat: 10.7905,
    lng: 78.7047,
    type: "road_flooded",
    description: "Main road flooded near bus stand",
    phase: "during",
    source: "crowd",
    verified: true,
    trustScore: 0.9,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    zoneId: "Z1",
  },
  {
    id: uuidv4(),
    lat: 10.8050,
    lng: 78.6900,
    type: "road_flooded",
    description: "Underpass submerged",
    phase: "during",
    source: "crowd",
    verified: true,
    trustScore: 0.85,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    zoneId: "Z2",
  },
  {
    id: uuidv4(),
    lat: 10.7780,
    lng: 78.7200,
    type: "road_clear",
    description: "Bypass road is clear and passable",
    phase: "after",
    source: "volunteer",
    verified: true,
    trustScore: 1.0,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    zoneId: "Z3",
  },
];

// ---------- ALERTS ----------
// Red-alert zones from government/IMD
let alerts = [
  {
    id: uuidv4(),
    zoneId: "Z1",
    zoneName: "Thanjavur North",
    level: "red",
    rainfall_mm: 180,
    message: "Extreme rainfall expected. Avoid travel.",
    timestamp: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    zoneId: "Z2",
    zoneName: "Thanjavur Central",
    level: "orange",
    rainfall_mm: 110,
    message: "Heavy rainfall. Use caution on roads.",
    timestamp: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    zoneId: "Z3",
    zoneName: "Thanjavur South",
    level: "yellow",
    rainfall_mm: 60,
    message: "Moderate rain. Monitor updates.",
    timestamp: new Date().toISOString(),
  },
];

// ---------- RESCUE TEAMS ----------
let rescueTeams = [
  { id: uuidv4(), name: "Team Alpha", lat: 10.7850, lng: 78.7100, available: true, assignedZone: null },
  { id: uuidv4(), name: "Team Beta",  lat: 10.8100, lng: 78.6950, available: true, assignedZone: null },
];

// ---------- TRUST SCORES ----------
// Keyed by reporter identifier (phone number or user ID)
let trustScores = {};

// ---------- HELPERS ----------
function addReport(report) {
  report.id = uuidv4();
  report.timestamp = new Date().toISOString();
  report.verified = false;
  report.trustScore = 0.5;
  reports.push(report);
  runVerification(report);
  return report;
}

function runVerification(newReport) {
  // Verify if 2+ reports exist within 500m and 30 minutes
  const RADIUS_DEG = 0.005; // ~500m
  const TIME_WINDOW = 30 * 60 * 1000;

  const nearby = reports.filter((r) => {
    if (r.id === newReport.id) return false;
    const withinSpace =
      Math.abs(r.lat - newReport.lat) < RADIUS_DEG &&
      Math.abs(r.lng - newReport.lng) < RADIUS_DEG;
    const withinTime =
      Math.abs(new Date(r.timestamp) - new Date(newReport.timestamp)) < TIME_WINDOW;
    return withinSpace && withinTime && r.type === newReport.type;
  });

  if (nearby.length >= 1) {
    // Mark this and nearby reports verified
    newReport.verified = true;
    newReport.trustScore = 0.85;
    nearby.forEach((r) => { r.verified = true; r.trustScore = 0.85; });
  }
}

function getVerifiedReports() {
  return reports.filter((r) => r.verified);
}

function getAllReports() {
  return reports;
}

function getAlerts() {
  return alerts;
}

function getRescueTeams() {
  return rescueTeams;
}

function updateRescueTeam(id, updates) {
  const team = rescueTeams.find((t) => t.id === id);
  if (team) Object.assign(team, updates);
  return team;
}

module.exports = {
  addReport,
  getAllReports,
  getVerifiedReports,
  getAlerts,
  getRescueTeams,
  updateRescueTeam,
};
