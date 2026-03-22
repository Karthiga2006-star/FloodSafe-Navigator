const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET all active alerts
router.get("/", (req, res) => {
  const alerts = store.getAlerts();
  res.json({ success: true, alerts });
});

// GET alerts by level
router.get("/level/:level", (req, res) => {
  const { level } = req.params;
  const alerts = store.getAlerts().filter((a) => a.level === level);
  res.json({ success: true, alerts });
});

// GET flood risk prediction for a zone (Before flood phase)
// This simulates what your AI/ML model would return
router.get("/risk/:zoneId", (req, res) => {
  const { zoneId } = req.params;
  const alerts = store.getAlerts();
  const alert = alerts.find((a) => a.zoneId === zoneId);

  if (!alert) {
    return res.json({
      success: true,
      zoneId,
      riskLevel: "low",
      riskScore: 0.1,
      predicted_rainfall_mm: 20,
      recommendation: "Normal conditions. No special precautions needed.",
    });
  }

  // Simulate ML model output based on rainfall data
  // In production: replace with actual ML model prediction
  const riskMap = {
    red:    { riskScore: 0.92, recommendation: "Do NOT travel. Evacuate if in low-lying areas." },
    orange: { riskScore: 0.65, recommendation: "Avoid non-essential travel. Stay updated." },
    yellow: { riskScore: 0.35, recommendation: "Travel with caution. Keep emergency contacts ready." },
  };

  const riskInfo = riskMap[alert.level] || { riskScore: 0.1, recommendation: "Low risk." };

  res.json({
    success: true,
    zoneId,
    zoneName: alert.zoneName,
    riskLevel: alert.level,
    riskScore: riskInfo.riskScore,
    predicted_rainfall_mm: alert.rainfall_mm,
    recommendation: riskInfo.recommendation,
    timestamp: alert.timestamp,
  });
});

module.exports = router;
