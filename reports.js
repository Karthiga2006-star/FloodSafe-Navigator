const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET all verified reports (shown on map)
router.get("/", (req, res) => {
  const { all } = req.query;
  const data = all === "true" ? store.getAllReports() : store.getVerifiedReports();
  res.json({ success: true, count: data.length, reports: data });
});

// POST new crowd report
// Body: { lat, lng, type, description, phase, source, reporterId }
router.post("/", (req, res) => {
  const { lat, lng, type, description, phase, source, reporterId } = req.body;

  if (!lat || !lng || !type) {
    return res.status(400).json({ success: false, message: "lat, lng, and type are required" });
  }

  const validTypes = ["road_flooded", "road_clear", "need_rescue", "water_receding", "bridge_damaged"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(", ")}` });
  }

  const report = store.addReport({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    type,
    description: description || "",
    phase: phase || "during",
    source: source || "crowd",
    reporterId: reporterId || "anonymous",
    zoneId: req.body.zoneId || "UNKNOWN",
  });

  res.status(201).json({
    success: true,
    message: report.verified
      ? "Report submitted and verified!"
      : "Report submitted. Pending verification from nearby reports.",
    report,
  });
});

// GET reports near a location
// Query: lat, lng, radius (in degrees, ~0.01 = ~1km)
router.get("/nearby", (req, res) => {
  const { lat, lng, radius = 0.05 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng required" });

  const all = store.getAllReports();
  const nearby = all.filter((r) => {
    return (
      Math.abs(r.lat - parseFloat(lat)) < parseFloat(radius) &&
      Math.abs(r.lng - parseFloat(lng)) < parseFloat(radius)
    );
  });

  res.json({ success: true, count: nearby.length, reports: nearby });
});

// GET summary stats
router.get("/stats", (req, res) => {
  const all = store.getAllReports();
  const stats = {
    total: all.length,
    verified: all.filter((r) => r.verified).length,
    pending: all.filter((r) => !r.verified).length,
    byType: {},
    byPhase: { before: 0, during: 0, after: 0 },
  };
  all.forEach((r) => {
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    if (r.phase) stats.byPhase[r.phase]++;
  });
  res.json({ success: true, stats });
});

module.exports = router;
