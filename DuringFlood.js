import React, { useState } from "react";
import { submitReport, getSafeRoute, getWaterLevel } from "../services/api";
import { useApp } from "../context/AppContext";
import PlaceSearch from "../components/PlaceSearch";
 
const REPORT_TYPES = [
  { value: "road_flooded",    label: "🌊 Road Flooded",       color: "var(--red)" },
  { value: "road_clear",      label: "✅ Road Now Clear",      color: "var(--green)" },
  { value: "need_rescue",     label: "🆘 Need Rescue",        color: "var(--orange)" },
  { value: "water_receding",  label: "📉 Water Receding",     color: "var(--teal)" },
  { value: "bridge_damaged",  label: "🌉 Bridge Damaged",     color: "var(--red)" },
];
 
export default function DuringFlood() {
  const { reports, refresh, showNotification, stats } = useApp();
  const [activeTab, setActiveTab] = useState("report");
 
  // Report form state
  const [form, setForm] = useState({
    type: "road_flooded", description: "", zoneId: "Z1",
  });
  const [reportPlace, setReportPlace] = useState(null);
  const [submitting, setSubmitting] = useState(false);
 
  // Route form state
  const [from, setFrom] = useState(null);
  const [to, setTo]     = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
 
  // Water level state
  const [wlPlace, setWlPlace] = useState(null);
  const [wlData, setWlData] = useState(null);
  const [wlLoading, setWlLoading] = useState(false);
 
  async function handleSubmitReport(e) {
    e.preventDefault();
    if (!reportPlace) { showNotification("Please search and select a location", "error"); return; }
    setSubmitting(true);
    try {
      const res = await submitReport({
        ...form,
        lat: reportPlace.lat,
        lng: reportPlace.lng,
        locationName: reportPlace.name,
      });
      showNotification(res.data.message, res.data.report.verified ? "success" : "info");
      setForm({ ...form, description: "" });
      setReportPlace(null);
      refresh();
    } catch {
      showNotification("Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  }
 
  async function handleGetRoute() {
    if (!from || !to) { showNotification("Please select both From and To locations", "error"); return; }
    setRouteLoading(true);
    try {
      const res = await getSafeRoute(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat,   lng: to.lng }
      );
      setRoute(res.data);
    } catch { showNotification("Route calculation failed", "error"); }
    finally { setRouteLoading(false); }
  }
 
  async function handleWaterLevel() {
    setWlLoading(true);
    try {
      const res = await getWaterLevel(wlPlace?.lat, wlPlace?.lng);
      setWlData(res.data);
    } catch { showNotification("Water level check failed", "error"); }
    finally { setWlLoading(false); }
  }
 
  const recentReports = [...reports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
 
  return (
    <div>
      <h1 className="page-title">🌊 During Flood — Live Reports &amp; Navigation</h1>
      <p className="page-subtitle">Submit flood reports, check safe routes, and estimate road water levels.</p>
 
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card red">
          <span className="stat-label">Active Reports</span>
          <span className="stat-value" style={{ color: "var(--red)" }}>{stats?.total || 0}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Verified</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>{stats?.verified || 0}</span>
        </div>
        <div className="stat-card orange">
          <span className="stat-label">Pending Verification</span>
          <span className="stat-value" style={{ color: "var(--orange)" }}>{stats?.pending || 0}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-label">Need Rescue</span>
          <span className="stat-value" style={{ color: "var(--blue)" }}>
            {stats?.byType?.need_rescue || 0}
          </span>
        </div>
      </div>
 
      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "report", label: "📢 Submit Report" },
          { id: "route",  label: "🧭 Safe Route" },
          { id: "water",  label: "💧 Water Level" },
          { id: "live",   label: "📋 Live Reports" },
        ].map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
 
      {/* Tab: Submit Report */}
      {activeTab === "report" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">📢 Submit Crowd Report</div>
 
            {/* SOS */}
            <div style={{ textAlign: "center", marginBottom: 24, padding: 20, background: "#fff5f5", borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Emergency? Press SOS immediately</p>
              <button className="sos-btn" onClick={async () => {
                if (!reportPlace) { showNotification("Search your location first before sending SOS", "error"); return; }
                setSubmitting(true);
                try {
                  await submitReport({
                    lat: reportPlace.lat, lng: reportPlace.lng,
                    type: "need_rescue", description: "SOS — urgent rescue needed",
                    phase: "during", source: "app", zoneId: form.zoneId,
                    locationName: reportPlace.name,
                  });
                  showNotification("🆘 SOS sent! Rescue teams notified.", "error");
                  refresh();
                } finally { setSubmitting(false); }
              }}>
                SOS <span>Emergency</span>
              </button>
            </div>
 
            <form onSubmit={handleSubmitReport}>
              <div className="form-group">
                <label>Report Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <PlaceSearch
                label="Your Location"
                value={reportPlace}
                onChange={setReportPlace}
                placeholder="e.g. Thanjavur Bus Stand"
              />
              <div className="form-group">
                <label>Zone</label>
                <select value={form.zoneId} onChange={e => setForm({...form, zoneId: e.target.value})}>
                  <option value="Z1">Z1 — Thanjavur North</option>
                  <option value="Z2">Z2 — Thanjavur Central</option>
                  <option value="Z3">Z3 — Thanjavur South</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  rows={2} value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="e.g. Water level knee-high near bus stand"
                />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "📤 Submit Report"}
              </button>
            </form>
          </div>
 
          {/* How verification works */}
          <div className="card">
            <div className="card-title">🔍 How Cross-Verification Works</div>
            {[
              { icon: "1️⃣", title: "You submit a report", desc: "Your report enters the pending queue with 0.5 trust score." },
              { icon: "2️⃣", title: "System checks nearby reports", desc: "If 2+ reports exist within 500m and 30 minutes with same type — auto-verified." },
              { icon: "3️⃣", title: "Volunteer confirmation", desc: "A trusted volunteer in the field can manually verify a report." },
              { icon: "4️⃣", title: "Map updates live", desc: "Verified reports show on the map instantly for all users." },
              { icon: "⏱", title: "Auto-expiry", desc: "Reports older than 3 hours without re-confirmation drop to 'monitor' status." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Tab: Safe Route */}
      {activeTab === "route" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">🧭 Get Flood-Safe Route</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Enter origin and destination. The system avoids verified flood zones automatically.
            </p>
            <PlaceSearch
              label="From"
              value={from}
              onChange={setFrom}
              placeholder="e.g. Thanjavur Bus Stand"
            />
            <PlaceSearch
              label="To"
              value={to}
              onChange={setTo}
              placeholder="e.g. Kumbakonam"
            />
            <button className="btn btn-primary btn-full" onClick={handleGetRoute} disabled={routeLoading}>
              {routeLoading ? "Calculating route..." : "🧭 Find Safe Route"}
            </button>
 
            {route && (
              <div className="route-result" style={{ marginTop: 20 }}>
                <h4>{route.recommendedRoute.type === "alternate" ? "⚠ Alternate route" : "✅ Direct route safe"}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Distance</p>
                    <p style={{ fontWeight: 700 }}>{route.recommendedRoute.distanceKm} km</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Est. Time</p>
                    <p style={{ fontWeight: 700 }}>{route.recommendedRoute.estimatedTimeMin} min</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Safety</p>
                    <p style={{ fontWeight: 700, color: "var(--green)" }}>
                      {Math.round(route.recommendedRoute.safetyScore * 100)}%
                    </p>
                  </div>
                </div>
                <div className="route-warnings" style={{ marginTop: 10 }}>
                  {route.recommendedRoute.warnings.map((w, i) => (
                    <div key={i} className="route-warning">⚠ {w}</div>
                  ))}
                </div>
                {route.highAlertZones.length > 0 && (
                  <p style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>
                    High alert zones nearby: {route.highAlertZones.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
 
          <div className="card">
            <div className="card-title">ℹ Route Engine</div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              The routing engine works by building avoidance polygons around verified flood reports
              and passing them to <b>OpenRouteService API</b>. Roads within 400m of a verified
              "road_flooded" report are weighted as impassable.
            </p>
            <div style={{ marginTop: 16 }}>
              {[
                { label: "Direct route", desc: "No verified flood zones on path" },
                { label: "Alternate route", desc: "Flood detected — rerouted automatically" },
                { label: "Recheck interval", desc: "Every 15 minutes during active flood" },
              ].map((r, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{r.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: "#e3f2fd", borderRadius: 8, fontSize: 13 }}>
              <b>Production note:</b> Replace mock routing with
              <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, margin: "0 4px" }}>
                OpenRouteService /v2/directions
              </code>
              using avoid_polygons built from flood coordinates.
            </div>
          </div>
        </div>
      )}
 
      {/* Tab: Water Level */}
      {activeTab === "water" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">💧 Road Water Level Check</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              AI estimates water depth on a road based on nearby crowd reports.
            </p>
            <PlaceSearch
              label="Road / Area to check"
              value={wlPlace}
              onChange={setWlPlace}
              placeholder="e.g. Thanjavur Market Road"
            />
            <button className="btn btn-primary btn-full" onClick={handleWaterLevel} disabled={wlLoading || !wlPlace}>
              {wlLoading ? "Estimating..." : "💧 Check Water Level"}
            </button>
 
            {wlData && (
              <div className="water-level-card" style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Estimated depth</p>
                <p className={`water-depth ${wlData.predictedWaterDepthCm < 20 ? "safe" : wlData.predictedWaterDepthCm < 50 ? "caution" : "danger"}`}>
                  {wlData.predictedWaterDepthCm} cm
                </p>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  {wlData.passable ? "✅ Road passable" : "🚫 Road not passable"} · 
                  Confidence: {Math.round(wlData.confidence * 100)}%
                </p>
 
                <div className="vehicle-grid">
                  {Object.entries(wlData.vehicleTypes).map(([v, ok]) => (
                    <div key={v} className={`vehicle-item ${ok ? "ok" : "blocked"}`}>
                      {ok ? "✅" : "🚫"} {v.charAt(0).toUpperCase() + v.slice(1)}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>{wlData.note}</p>
              </div>
            )}
          </div>
 
          <div className="card">
            <div className="card-title">📡 Water Level AI</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
              The water depth model combines crowd photo analysis (YOLOv4) with flood gauge data.
              In the prototype it simulates predictions — connect a real model for production.
            </p>
            {[
              { icon: "📸", label: "Crowd photos", desc: "Users upload flooded road photos" },
              { icon: "🤖", label: "YOLOv4 detection", desc: "Detects water surface from image" },
              { icon: "📏", label: "Reference objects", desc: "Uses vehicles/poles to calibrate depth" },
              { icon: "🗺", label: "Map update", desc: "Depth per road segment, updated live" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Tab: Live Reports */}
      {activeTab === "live" && (
        <div className="grid-2">
          <div className="card">
            <div className="section-header">
              <div className="card-title" style={{ marginBottom: 0 }}>📋 Live Reports</div>
              <button className="btn btn-secondary" onClick={refresh} style={{ padding: "6px 12px", fontSize: 12 }}>
                🔄 Refresh
              </button>
            </div>
            {recentReports.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No reports yet.</p>}
            {recentReports.map(r => (
              <div key={r.id} className={`report-item ${r.verified ? "verified" : "unverified"}`}>
                <div className="report-meta">
                  <span className="badge" style={{
                    background: r.type === "road_flooded" ? "#ffebee" : r.type === "road_clear" ? "#e8f5e9" : "#fff3e0",
                    color: r.type === "road_flooded" ? "var(--red)" : r.type === "road_clear" ? "var(--green)" : "var(--orange)",
                  }}>
                    {r.type.replace(/_/g, " ")}
                  </span>
                  <span className={`badge ${r.verified ? "green" : "yellow"}`}>
                    {r.verified ? "✅ Verified" : "⏳ Pending"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone {r.zoneId}</span>
                </div>
                {r.description && <p className="report-desc">{r.description}</p>}
                <p className="report-time">
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)} · {new Date(r.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
 
          <div className="card">
            <div className="card-title">📊 Report Breakdown</div>
            {REPORT_TYPES.map(t => {
              const count = reports.filter(r => r.type === t.value).length;
              const pct = reports.length ? (count / reports.length) * 100 : 0;
              return (
                <div key={t.value} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{t.label}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div className="risk-bar-track">
                    <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: 10, transition: "width 0.6s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}