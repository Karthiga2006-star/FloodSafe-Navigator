const express = require("express");
const router = express.Router();
const store = require("../data/store");

// POST get safe route between two points
// Body: { fromLat, fromLng, toLat, toLng }
// In production: use OpenRouteService API with flood zone avoidance polygons
router.post("/safe-route", (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.body;

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ success: false, message: "fromLat, fromLng, toLat, toLng required" });
  }

  const floodedReports = store.getVerifiedReports().filter(
    (r) => r.type === "road_flooded" || r.type === "bridge_damaged"
  );

  // Simulate route calculation
  // In production: call OpenRouteService /v2/directions with avoidance polygons
  // built from floodedReports coordinates
  const hasFloodOnDirectRoute = floodedReports.some((r) => {
    const midLat = (parseFloat(fromLat) + parseFloat(toLat)) / 2;
    const midLng = (parseFloat(fromLng) + parseFloat(toLng)) / 2;
    return (
      Math.abs(r.lat - midLat) < 0.02 &&
      Math.abs(r.lng - midLng) < 0.02
    );
  });

  const alerts = store.getAlerts();
  const highAlertZones = alerts.filter((a) => a.level === "red" || a.level === "orange");

  // Build simulated route waypoints
  const directRoute = [
    { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
    { lat: (parseFloat(fromLat) + parseFloat(toLat)) / 2, lng: (parseFloat(fromLng) + parseFloat(toLng)) / 2 },
    { lat: parseFloat(toLat), lng: parseFloat(toLng) },
  ];

  // Alternate route shifts path slightly to avoid flood zone
  const alternateRoute = [
    { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
    {
      lat: (parseFloat(fromLat) + parseFloat(toLat)) / 2 + 0.01,
      lng: (parseFloat(fromLng) + parseFloat(toLng)) / 2 + 0.01,
    },
    { lat: parseFloat(toLat), lng: parseFloat(toLng) },
  ];

  res.json({
    success: true,
    from: { lat: parseFloat(fromLat), lng: parseFloat(fromLng) },
    to:   { lat: parseFloat(toLat),   lng: parseFloat(toLng) },
    floodedAreasOnRoute: floodedReports.length,
    recommendedRoute: {
      type: hasFloodOnDirectRoute ? "alternate" : "direct",
      waypoints: hasFloodOnDirectRoute ? alternateRoute : directRoute,
      estimatedTimeMin: hasFloodOnDirectRoute ? 22 : 15,
      distanceKm: hasFloodOnDirectRoute ? 8.4 : 5.2,
      safetyScore: hasFloodOnDirectRoute ? 0.88 : 0.95,
      warnings: hasFloodOnDirectRoute
        ? ["Alternate route taken to avoid flood zone", "Road conditions may change — recheck every 15 min"]
        : ["Route looks clear based on current reports"],
    },
    floodZonesNearby: floodedReports.map((r) => ({
      lat: r.lat,
      lng: r.lng,
      type: r.type,
      description: r.description,
    })),
    highAlertZones: highAlertZones.map((a) => a.zoneName),
  });
});

// GET water level prediction for a road segment (During flood phase)
// Simulates AI model predicting road passability
router.get("/water-level", (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng required" });

  const reports = store.getVerifiedReports().filter((r) => r.type === "road_flooded");
  const nearbyFlooded = reports.filter(
    (r) => Math.abs(r.lat - parseFloat(lat)) < 0.01 && Math.abs(r.lng - parseFloat(lng)) < 0.01
  );

  // Simulate water depth prediction
  // In production: use ML model (Random Forest / YOLOv4 on crowdsourced photos)
  const depthCm = nearbyFlooded.length > 0 ? Math.floor(Math.random() * 80) + 30 : Math.floor(Math.random() * 10);
  const passable = depthCm < 30;

  res.json({
    success: true,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    predictedWaterDepthCm: depthCm,
    passable,
    vehicleTypes: {
      motorbike: depthCm < 20,
      car:       depthCm < 30,
      suv:       depthCm < 50,
      truck:     depthCm < 70,
    },
    confidence: nearbyFlooded.length > 0 ? 0.78 : 0.45,
    note:
      nearbyFlooded.length > 0
        ? "Based on nearby crowd reports"
        : "Low confidence — no nearby reports",
  });
});

module.exports = router;
