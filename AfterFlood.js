import React, { useState, useEffect } from "react";
import { getReports, getWaterLevel, submitReport } from "../services/api";
import { useApp } from "../context/AppContext";

export default function AfterFlood() {
  const { reports, refresh, showNotification, stats } = useApp();
  const [activeTab, setActiveTab] = useState("status");
  const [wlLat, setWlLat]   = useState("10.7905");
  const [wlLng, setWlLng]   = useState("78.7047");
  const [wlData, setWlData] = useState(null);
  const [wlLoading, setWlLoading] = useState(false);
  const [form, setForm]     = useState({ lat: "10.7905", lng: "78.7047", type: "road_clear", description: "", zoneId: "Z1" });
  const [submitting, setSubmitting] = useState(false);

  const afterReports  = reports.filter(r => r.phase === "after");
  const clearReports  = reports.filter(r => r.type === "road_clear");
  const floodedStill  = reports.filter(r => r.type === "road_flooded" && r.verified);
  const receding      = reports.filter(r => r.type === "water_receding");

  async function handleWaterCheck() {
    setWlLoading(true);
    try {
      const res = await getWaterLevel(wlLat, wlLng);
      setWlData(res.data);
    } catch { showNotification("Check failed", "error"); }
    finally { setWlLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitReport({
        ...form, phase: "after",
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        source: "crowd",
      });
      showNotification(res.data.message, "success");
      setForm({ ...form, description: "" });
      refresh();
    } catch { showNotification("Submission failed", "error"); }
    finally { setSubmitting(false); }
  }

  const recoveryPct = reports.length
    ? Math.round((clearReports.length / Math.max(reports.length, 1)) * 100)
    : 0;

  return (
    <div>
      <h1 className="page-title">🔄 After Flood — Recovery Tracking</h1>
      <p className="page-subtitle">Monitor road recovery, report cleared areas, and support rescue operations.</p>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <span className="stat-label">Roads Cleared</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>{clearReports.length}</span>
        </div>
        <div className="stat-card red">
          <span className="stat-label">Still Flooded</span>
          <span className="stat-value" style={{ color: "var(--red)" }}>{floodedStill.length}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-label">Water Receding</span>
          <span className="stat-value" style={{ color: "var(--blue)" }}>{receding.length}</span>
        </div>
        <div className="stat-card orange">
          <span className="stat-label">Recovery %</span>
          <span className="stat-value" style={{ color: recoveryPct > 60 ? "var(--green)" : "var(--orange)" }}>
            {recoveryPct}%
          </span>
        </div>
      </div>

      {/* Recovery progress bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Road Recovery</span>
          <span style={{ fontWeight: 700, color: recoveryPct > 60 ? "var(--green)" : "var(--orange)" }}>{recoveryPct}%</span>
        </div>
        <div className="risk-bar-track" style={{ height: 14 }}>
          <div
            style={{
              height: "100%", width: `${recoveryPct}%`, borderRadius: 10,
              background: recoveryPct > 60 ? "var(--green)" : recoveryPct > 30 ? "var(--orange)" : "var(--red)",
              transition: "width 1s ease",
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          Based on {clearReports.length} clear reports vs {floodedStill.length} still flooded
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "status",  label: "🗺 Road Status" },
          { id: "report",  label: "📢 Submit Update" },
          { id: "water",   label: "💧 Water Check" },
          { id: "sat",     label: "🛰 Satellite Data" },
        ].map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Road Status */}
      {activeTab === "status" && (
        <div className="grid-2">
          <div className="card">
            <div className="section-header">
              <div className="card-title" style={{ marginBottom: 0 }}>✅ Cleared Roads</div>
              <span className="badge green">{clearReports.length} reports</span>
            </div>
            {clearReports.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No cleared roads reported yet.</p>
            )}
            {clearReports.map(r => (
              <div key={r.id} className="report-item verified">
                <div className="report-meta">
                  <span className="badge green">Clear</span>
                  <span className={`badge ${r.verified ? "green" : "yellow"}`}>{r.verified ? "Verified" : "Pending"}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone {r.zoneId}</span>
                </div>
                {r.description && <p className="report-desc">{r.description}</p>}
                <p className="report-time">{new Date(r.timestamp).toLocaleTimeString()} · {r.source}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-header">
              <div className="card-title" style={{ marginBottom: 0 }}>⚠ Still Flooded</div>
              <span className="badge red">{floodedStill.length} zones</span>
            </div>
            {floodedStill.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No verified flood zones active.</p>
            )}
            {floodedStill.map(r => (
              <div key={r.id} className="report-item unverified">
                <div className="report-meta">
                  <span className="badge red">Flooded</span>
                  <span className="badge green">Verified</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone {r.zoneId}</span>
                </div>
                {r.description && <p className="report-desc">{r.description}</p>}
                <p className="report-time">
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)} · {new Date(r.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Submit Update */}
      {activeTab === "report" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">📢 Report Road Status Update</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              After the flood, keep updating road status so everyone knows which routes are safe.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Status Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="road_clear">✅ Road is now clear</option>
                  <option value="road_flooded">🌊 Road still flooded</option>
                  <option value="water_receding">📉 Water level receding</option>
                  <option value="bridge_damaged">🌉 Bridge damaged</option>
                </select>
              </div>
              <div className="form-group">
                <label>Location (lat, lng)</label>
                <div className="form-row">
                  <input value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} placeholder="Lat" />
                  <input value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} placeholder="Lng" />
                </div>
              </div>
              <div className="form-group">
                <label>Zone</label>
                <select value={form.zoneId} onChange={e => setForm({...form, zoneId: e.target.value})}>
                  <option value="Z1">Z1 — Thanjavur North</option>
                  <option value="Z2">Z2 — Thanjavur Central</option>
                  <option value="Z3">Z3 — Thanjavur South</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="e.g. NH67 bypass fully clear, traffic moving normally"
                />
              </div>
              <button className="btn btn-success btn-full" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "📤 Submit Update"}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-title">📋 After-Flood Crowd System</div>
            {[
              { icon: "👥", title: "Same crowd system", desc: "The same SMS/app reporting used during the flood continues to work for recovery updates." },
              { icon: "🔄", title: "Status flipping", desc: "Any 'road_flooded' report can be overridden by a verified 'road_clear' report from the same zone." },
              { icon: "🛰", title: "Satellite cross-check", desc: "Sentinel-1 SAR satellite images (free, 6-day revisit) validate crowd reports for large flood extents." },
              { icon: "📊", title: "Recovery dashboard", desc: "Recovery % is computed live from cleared vs total reports, giving authorities a real-time view." },
              { icon: "⏱", title: "Auto-archive", desc: "Reports older than 24 hours post-flood are archived and removed from the active map layer." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
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

      {/* Tab: Water Check */}
      {activeTab === "water" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">💧 Post-Flood Water Level Check</div>
            <div className="form-group">
              <label>Location (lat, lng)</label>
              <div className="form-row">
                <input value={wlLat} onChange={e => setWlLat(e.target.value)} placeholder="Lat" />
                <input value={wlLng} onChange={e => setWlLng(e.target.value)} placeholder="Lng" />
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleWaterCheck} disabled={wlLoading}>
              {wlLoading ? "Checking..." : "💧 Check Residual Water"}
            </button>

            {wlData && (
              <div className="water-level-card" style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Residual water depth</p>
                <p className={`water-depth ${wlData.predictedWaterDepthCm < 10 ? "safe" : wlData.predictedWaterDepthCm < 30 ? "caution" : "danger"}`}>
                  {wlData.predictedWaterDepthCm} cm
                </p>
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  {wlData.predictedWaterDepthCm < 10
                    ? "✅ Road safe to use"
                    : wlData.predictedWaterDepthCm < 30
                    ? "⚠ Use caution — surface may be slippery"
                    : "🚫 Still unsafe for most vehicles"}
                </p>
                <div className="vehicle-grid">
                  {Object.entries(wlData.vehicleTypes).map(([v, ok]) => (
                    <div key={v} className={`vehicle-item ${ok ? "ok" : "blocked"}`}>
                      {ok ? "✅" : "🚫"} {v.charAt(0).toUpperCase() + v.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">📏 Water Depth Methods</div>
            {[
              { icon: "📸", label: "Crowdsourced photos", desc: "YOLOv4 detects depth from user photos using reference objects (vehicles, poles)" },
              { icon: "📡", label: "SAR remote sensing", desc: "Sentinel-1 satellite estimates flood extent; DEM subtraction gives approximate depth" },
              { icon: "🌡", label: "Gauge data", desc: "Street-level gauges provide ground truth where installed" },
              { icon: "🤖", label: "ML ensemble", desc: "Random Forest model combines all inputs for final depth estimate (RMSE ~0.2m)" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Satellite Data */}
      {activeTab === "sat" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">🛰 Satellite Integration (Sentinel-1 SAR)</div>
            <div style={{ background: "#e3f2fd", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Why SAR over optical?</p>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Optical satellites (like Landsat) can't see through clouds. During monsoon floods,
                the sky is almost always cloudy. SAR (Synthetic Aperture Radar) works
                day and night through any weather — perfect for flood monitoring.
              </p>
            </div>
            {[
              { icon: "🌍", label: "Sentinel-1 (ESA)",   desc: "Free SAR data, 6-day revisit, 10m resolution. Best for flood extent mapping." },
              { icon: "📐", label: "Flood extent mapping", desc: "Water surface appears dark in SAR. Subtract DEM elevation to get approximate depth." },
              { icon: "🔗", label: "API access",          desc: "Use Copernicus Open Access Hub (scihub.copernicus.eu) for free Sentinel-1 downloads." },
              { icon: "🐍", label: "Python processing",   desc: "Use snappy (SNAP Python API) or sentinelsat library to process SAR images." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">🔧 Integration Steps</div>
            {[
              "Register at scihub.copernicus.eu (free)",
              "Use sentinelsat Python library to query and download Sentinel-1 GRD images for your AOI",
              "Process with SNAP / snappy: apply orbit file → calibrate → terrain correction",
              "Threshold SAR backscatter to separate water from land",
              "Overlay with DEM (SRTM 30m, free) to estimate flood depth",
              "Export as GeoJSON flood polygons",
              "Load polygons into PostGIS and expose via /api/satellite endpoint",
              "Frontend renders polygons as Leaflet GeoJSON layers on the map",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < 7 ? "1px solid var(--border)" : "none" }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "var(--blue)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
