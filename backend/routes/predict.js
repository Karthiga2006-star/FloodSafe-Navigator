const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET flood risk prediction (Before flood phase)
// Simulates your AI/ML model — replace with actual model in production
// Production: train XGBoost on historical IMD rainfall + flood occurrence data
router.get("/flood-risk", (req, res) => {
  const { zoneId, rainfall_mm, area } = req.query;

  // Simulate ML model prediction
  // Features: rainfall_mm, historical_flood_frequency, soil_saturation, elevation
  // In production: POST to your Python ML microservice
  const rainfall = parseFloat(rainfall_mm) || 50;

  let riskScore, riskLevel, recommendation;

  if (rainfall > 150) {
    riskScore = 0.88 + Math.random() * 0.1;
    riskLevel = "red";
    recommendation = "Extremely high flood risk. Do not travel. Alert authorities immediately.";
  } else if (rainfall > 100) {
    riskScore = 0.6 + Math.random() * 0.2;
    riskLevel = "orange";
    recommendation = "High flood risk. Avoid low-lying roads. Keep emergency kit ready.";
  } else if (rainfall > 60) {
    riskScore = 0.35 + Math.random() * 0.2;
    riskLevel = "yellow";
    recommendation = "Moderate risk. Monitor IMD alerts. Avoid known flood-prone areas.";
  } else {
    riskScore = Math.random() * 0.25;
    riskLevel = "green";
    recommendation = "Low risk. Normal travel. Stay updated.";
  }

  res.json({
    success: true,
    zoneId: zoneId || "UNKNOWN",
    area: area || "Query area",
    input: { rainfall_mm: rainfall },
    prediction: {
      riskScore: parseFloat(riskScore.toFixed(2)),
      riskLevel,
      recommendation,
      floodProbabilityPercent: Math.round(riskScore * 100),
    },
    modelInfo: {
      type: "Simulated XGBoost",
      note: "Replace with trained model using IMD + NDMA historical data",
      features: ["rainfall_mm", "soil_saturation", "elevation_m", "historical_flood_freq"],
    },
  });
});

// GET rainfall trend simulation (Before flood phase dashboard)
router.get("/rainfall-trend", (req, res) => {
  // Simulated 7-day rainfall forecast
  // In production: fetch from IMD API or OpenWeatherMap
  const days = ["Day -3", "Day -2", "Yesterday", "Today", "Tomorrow", "Day +2", "Day +3"];
  const rainfall = [45, 60, 95, 180, 140, 80, 30];
  const threshold = 100; // mm — flood risk threshold

  res.json({
    success: true,
    location: "Thanjavur, Tamil Nadu",
    trend: days.map((day, i) => ({
      label: day,
      rainfall_mm: rainfall[i],
      aboveThreshold: rainfall[i] > threshold,
    })),
    floodRiskDays: days.filter((_, i) => rainfall[i] > threshold),
    source: "Simulated — connect to IMD / OpenWeatherMap API",
  });
});

module.exports = router;
