import React, { useState, useEffect } from "react";
import { getFloodRisk, getRainfallTrend, getAlerts } from "../services/api";
import { useApp } from "../context/AppContext";

const ZONES = [
  { id: "Z1", name: "Thanjavur North" },
  { id: "Z2", name: "Thanjavur Central" },
  { id: "Z3", name: "Thanjavur South" },
];

export default function BeforeFlood() {
  const { alerts } = useApp();
  const [rainfall, setRainfall]         = useState(120);
  const [selectedZone, setSelectedZone] = useState("Z1");
  const [prediction, setPrediction]     = useState(null);
  const [trend, setTrend]               = useState(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    getRainfallTrend().then(r => setTrend(r.data)).catch(() => {});
  }, []);

  async function handlePredict() {
    setLoading(true);
    try {
      const res = await getFloodRisk({ zoneId: selectedZone, rainfall_mm: rainfall });
      setPrediction(res.data.prediction);
    } finally {
      setLoading(false);
    }
  }

  const maxRain = trend ? Math.max(...trend.trend.map(t => t.rainfall_mm)) : 180;

  const levelColor = {
    red: "var(--red)", orange: "var(--orange)", yellow: "#c6a700", green: "var(--green)"
  };

  return (
    <div>
      <h1 className="page-title">🌧 Before Flood — Prediction &amp; Risk</h1>
      <p className="page-subtitle">Use IMD rainfall data and AI prediction to prepare before floods hit.</p>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card red">
          <span className="stat-label">Red Alert Zones</span>
          <span className="stat-value" style={{ color: "var(--red)" }}>
            {alerts.filter(a => a.level === "red").length}
          </span>
        </div>
        <div className="stat-card orange">
          <span className="stat-label">Orange Alert Zones</span>
          <span className="stat-value" style={{ color: "var(--orange)" }}>
            {alerts.filter(a => a.level === "orange").length}
          </span>
        </div>
        <div className="stat-card blue">
          <span className="stat-label">Avg Rainfall (mm)</span>
          <span className="stat-value" style={{ color: "var(--blue)" }}>
            {alerts.length ? Math.round(alerts.reduce((s, a) => s + a.rainfall_mm, 0) / alerts.length) : 0}
          </span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Safe Zones</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>
            {alerts.filter(a => a.level === "yellow" || a.level === "green").length}
          </span>
        </div>
      </div>

      <div className="grid-2">
        {/* AI Risk Predictor */}
        <div className="card">
          <div className="card-title">🤖 AI Flood Risk Predictor</div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            Enter rainfall data → AI model predicts flood risk level for the zone.
          </p>

          <div className="form-group">
            <label>Select Zone</label>
            <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
              {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Rainfall Input (mm) — <b>{rainfall} mm</b></label>
            <input
              type="range" min={0} max={300} value={rainfall}
              onChange={e => setRainfall(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
              <span>0mm (dry)</span><span>150mm (heavy)</span><span>300mm (extreme)</span>
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting..." : "🔮 Predict Flood Risk"}
          </button>

          {prediction && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 600 }}>Prediction Result</span>
                <span className={`badge ${prediction.riskLevel}`}>
                  {prediction.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              <div className="risk-meter">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>Risk Score</span>
                  <span style={{ fontWeight: 700, color: levelColor[prediction.riskLevel] }}>
                    {Math.round(prediction.riskScore * 100)}%
                  </span>
                </div>
                <div className="risk-bar-track">
                  <div
                    className={`risk-bar-fill ${prediction.riskLevel}`}
                    style={{ width: `${prediction.riskScore * 100}%` }}
                  />
                </div>
              </div>

              <div style={{
                padding: 12, borderRadius: 8, marginTop: 12,
                background: prediction.riskLevel === "red" ? "#fff5f5" : prediction.riskLevel === "orange" ? "#fff8f0" : "#f1f8e9",
                border: `1px solid ${levelColor[prediction.riskLevel]}33`,
              }}>
                <p style={{ fontSize: 13, color: levelColor[prediction.riskLevel], fontWeight: 500 }}>
                  📋 {prediction.recommendation}
                </p>
              </div>

              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                Model: Simulated XGBoost · Features: rainfall, soil saturation, elevation, historical freq
              </p>
            </div>
          )}
        </div>

        {/* Rainfall Trend Chart */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">📊 7-Day Rainfall Forecast</div>
            {trend ? (
              <>
                <div className="rainfall-bars">
                  {trend.trend.map((d, i) => {
                    const heightPct = (d.rainfall_mm / maxRain) * 100;
                    return (
                      <div className="rain-bar-wrap" key={i}>
                        <span className="rain-value" style={{ color: d.aboveThreshold ? "var(--red)" : "var(--blue)" }}>
                          {d.rainfall_mm}
                        </span>
                        <div
                          className={`rain-bar ${d.aboveThreshold ? "danger" : "safe"}`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="rain-label">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  🔴 Red bars = above flood threshold (100mm). Source: {trend.source}
                </p>
                {trend.floodRiskDays.length > 0 && (
                  <div style={{ marginTop: 10, padding: 10, background: "#fff5f5", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
                    ⚠ High risk days: <b>{trend.floodRiskDays.join(", ")}</b>
                  </div>
                )}
              </>
            ) : <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading forecast...</p>}
          </div>

          {/* Zone Alerts */}
          <div className="card">
            <div className="card-title">🗺 Zone Alerts</div>
            {alerts.map(a => (
              <div key={a.id} className={`alert-item ${a.level}`}>
                <span className="alert-icon">
                  {a.level === "red" ? "🔴" : a.level === "orange" ? "🟠" : "🟡"}
                </span>
                <div className="alert-info">
                  <h4>{a.zoneName} <span className={`badge ${a.level}`}>{a.level.toUpperCase()}</span></h4>
                  <p>{a.message}</p>
                  <p style={{ fontSize: 12 }}>Rainfall: {a.rainfall_mm}mm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
