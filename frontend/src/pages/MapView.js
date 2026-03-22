import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import PlaceSearch from "../components/PlaceSearch";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../context/AppContext";
import { getSafeRoute } from "../services/api";
 
// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
 
const floodIcon = new L.DivIcon({
  html: '<div style="background:#e53935;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(229,57,53,0.6)"></div>',
  className: "", iconSize: [14, 14], iconAnchor: [7, 7],
});
const clearIcon = new L.DivIcon({
  html: '<div style="background:#2e7d32;width:14px;height:14px;border-radius:50%;border:2px solid #fff"></div>',
  className: "", iconSize: [14, 14], iconAnchor: [7, 7],
});
const sosIcon = new L.DivIcon({
  html: '<div style="background:#f57c00;width:18px;height:18px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px">🆘</div>',
  className: "", iconSize: [18, 18], iconAnchor: [9, 9],
});
 
// Thanjavur center
const CENTER = [10.7905, 78.7047];
 
function ReportMarker({ report }) {
  let icon = floodIcon;
  if (report.type === "road_clear")    icon = clearIcon;
  if (report.type === "need_rescue")   icon = sosIcon;
 
  return (
    <Marker position={[report.lat, report.lng]} icon={icon}>
      <Popup>
        <div style={{ minWidth: 180 }}>
          <b style={{ textTransform: "capitalize" }}>{report.type.replace(/_/g, " ")}</b><br />
          {report.description && <span>{report.description}<br /></span>}
          <span style={{ fontSize: 12, color: "#666" }}>
            {report.verified ? "✅ Verified" : "⏳ Pending"} · Zone {report.zoneId}
          </span><br />
          <span style={{ fontSize: 11, color: "#999" }}>
            {new Date(report.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
 
export default function MapView() {
  const { reports, alerts } = useApp();
  const [from, setFrom] = useState({ lat: "10.7905", lng: "78.7047" });
  const [to,   setTo]   = useState({ lat: "10.8100", lng: "78.6800" });
  const [routeResult, setRouteResult] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
 
  async function handleGetRoute() {
    setLoadingRoute(true);
    try {
      const res = await getSafeRoute(
        { lat: parseFloat(from.lat), lng: parseFloat(from.lng) },
        { lat: parseFloat(to.lat),   lng: parseFloat(to.lng) }
      );
      setRouteResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoute(false);
    }
  }
 
  const alertColors = { red: "#e53935", orange: "#f57c00", yellow: "#fbc02d" };
  // Simulated zone circles around known flood report locations
  const floodZoneCircles = reports.filter(r => r.type === "road_flooded" && r.verified);
 
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      {/* Map */}
      <div>
        <div className="map-container">
          <MapContainer center={CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {/* Flood zone circles */}
            {floodZoneCircles.map((r) => (
              <Circle
                key={r.id + "-circle"}
                center={[r.lat, r.lng]}
                radius={400}
                pathOptions={{ color: "#e53935", fillColor: "#e53935", fillOpacity: 0.2, weight: 1 }}
              />
            ))}
            {/* Report markers */}
            {reports.map((r) => <ReportMarker key={r.id} report={r} />)}
          </MapContainer>
        </div>
        {/* Map legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { color: "#e53935", label: "Flooded road" },
            { color: "#2e7d32", label: "Road clear" },
            { color: "#f57c00", label: "SOS / rescue needed" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
 
      {/* Sidebar: Route Planner */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="card-title">🗺 Route Planner</div>
          <div className="form-group">
            <label>From (lat, lng)</label>
            <div className="form-row">
              <input value={from.lat} onChange={e => setFrom({...from, lat: e.target.value})} placeholder="Latitude" />
              <input value={from.lng} onChange={e => setFrom({...from, lng: e.target.value})} placeholder="Longitude" />
            </div>
          </div>
          <div className="form-group">
            <label>To (lat, lng)</label>
            <div className="form-row">
              <input value={to.lat} onChange={e => setTo({...to, lat: e.target.value})} placeholder="Latitude" />
              <input value={to.lng} onChange={e => setTo({...to, lng: e.target.value})} placeholder="Longitude" />
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleGetRoute} disabled={loadingRoute}>
            {loadingRoute ? "Calculating..." : "🧭 Get Safe Route"}
          </button>
 
          {routeResult && (
            <div className="route-result">
              <h4>
                {routeResult.recommendedRoute.type === "alternate"
                  ? "⚠ Alternate route taken"
                  : "✅ Direct route is safe"}
              </h4>
              <p style={{ fontSize: 13 }}>
                <b>{routeResult.recommendedRoute.distanceKm} km</b> · ~{routeResult.recommendedRoute.estimatedTimeMin} min
                · Safety: {Math.round(routeResult.recommendedRoute.safetyScore * 100)}%
              </p>
              <div className="route-warnings">
                {routeResult.recommendedRoute.warnings.map((w, i) => (
                  <div key={i} className="route-warning">⚠ {w}</div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Active alerts summary */}
        <div className="card">
          <div className="card-title">⚠ Active Alerts</div>
          {alerts.map((a) => (
            <div key={a.id} className={`alert-item ${a.level}`}>
              <span className="alert-icon">
                {a.level === "red" ? "🔴" : a.level === "orange" ? "🟠" : "🟡"}
              </span>
              <div className="alert-info">
                <h4>{a.zoneName}</h4>
                <p>{a.message}</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Rainfall: {a.rainfall_mm}mm</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}