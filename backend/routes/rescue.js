const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET all rescue teams and status
router.get("/teams", (req, res) => {
  res.json({ success: true, teams: store.getRescueTeams() });
});

// GET priority rescue zones — sorts SOS reports by number of reports (most urgent first)
router.get("/priority-zones", (req, res) => {
  const reports = store.getAllReports().filter((r) => r.type === "need_rescue");

  // Group by zone and count
  const zoneCount = {};
  reports.forEach((r) => {
    zoneCount[r.zoneId] = (zoneCount[r.zoneId] || { count: 0, reports: [], lat: r.lat, lng: r.lng });
    zoneCount[r.zoneId].count++;
    zoneCount[r.zoneId].reports.push(r);
  });

  const priorityZones = Object.entries(zoneCount)
    .map(([zoneId, data]) => ({
      zoneId,
      sosCount: data.count,
      lat: data.lat,
      lng: data.lng,
      priority: data.count >= 3 ? "critical" : data.count >= 2 ? "high" : "medium",
      reports: data.reports,
    }))
    .sort((a, b) => b.sosCount - a.sosCount);

  res.json({
    success: true,
    priorityZones,
    message:
      priorityZones.length === 0
        ? "No active SOS reports"
        : `${priorityZones.length} zones need rescue attention`,
  });
});

// POST assign rescue team to zone
router.post("/assign", (req, res) => {
  const { teamId, zoneId, lat, lng } = req.body;
  if (!teamId || !zoneId) {
    return res.status(400).json({ success: false, message: "teamId and zoneId required" });
  }

  const team = store.updateRescueTeam(teamId, {
    assignedZone: zoneId,
    available: false,
    destination: { lat, lng },
  });

  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  res.json({
    success: true,
    message: `${team.name} assigned to zone ${zoneId}`,
    team,
  });
});

// POST mark rescue complete
router.post("/complete", (req, res) => {
  const { teamId } = req.body;
  const team = store.updateRescueTeam(teamId, { assignedZone: null, available: true, destination: null });
  if (!team) return res.status(404).json({ success: false, message: "Team not found" });
  res.json({ success: true, message: `${team.name} is now available`, team });
});

module.exports = router;
