import React, { useState, useEffect } from "react";
import { getRescueTeams, getPriorityZones, assignRescueTeam, completeRescue } from "../services/api";
import { useApp } from "../context/AppContext";

export default function RescueDashboard() {
  const { reports, refresh, showNotification } = useApp();
  const [teams, setTeams]           = useState([]);
  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [assigning, setAssigning]   = useState(null);

  async function loadRescueData() {
    setLoading(true);
    try {
      const [t, z] = await Promise.all([getRescueTeams(), getPriorityZones()]);
      setTeams(t.data.teams);
      setZones(z.data.priorityZones);
    } catch { showNotification("Failed to load rescue data", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadRescueData(); }, []);

  async function handleAssign(teamId, zone) {
    setAssigning(teamId);
    try {
      const res = await assignRescueTeam({ teamId, zoneId: zone.zoneId, lat: zone.lat, lng: zone.lng });
      showNotification(res.data.message, "success");
      loadRescueData();
    } catch { showNotification("Assignment failed", "error"); }
    finally { setAssigning(null); }
  }

  async function handleComplete(teamId) {
    try {
      const res = await completeRescue(teamId);
      showNotification(res.data.message, "success");
      loadRescueData();
    } catch { showNotification("Failed", "error"); }
  }

  const sosReports     = reports.filter(r => r.type === "need_rescue");
  const availableTeams = teams.filter(t => t.available);
  const busyTeams      = teams.filter(t => !t.available);

  const priorityColor = { critical: "var(--red)", high: "var(--orange)", medium: "var(--yellow)" };
  const priorityBg    = { critical: "#fff5f5",    high: "#fff8f0",       medium: "#fffef5" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>🚨 Rescue Dashboard</h1>
        <span className="badge red">Rescue Mode Active</span>
      </div>
      <p className="page-subtitle">Manage rescue teams, prioritise zones, and coordinate response.</p>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card red">
          <span className="stat-label">SOS Reports</span>
          <span className="stat-value" style={{ color: "var(--red)" }}>{sosReports.length}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Teams Available</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>{availableTeams.length}</span>
        </div>
        <div className="stat-card orange">
          <span className="stat-label">Teams Deployed</span>
          <span className="stat-value" style={{ color: "var(--orange)" }}>{busyTeams.length}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-label">Priority Zones</span>
          <span className="stat-value" style={{ color: "var(--blue)" }}>{zones.length}</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Priority Zones */}
        <div className="card">
          <div className="section-header">
            <div className="card-title" style={{ marginBottom: 0 }}>🗺 Priority Rescue Zones</div>
            <button className="btn btn-secondary" onClick={loadRescueData} style={{ padding: "6px 12px", fontSize: 12 }}>
              🔄 Refresh
            </button>
          </div>

          {zones.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p>No active SOS zones. All clear.</p>
            </div>
          )}

          {zones.map((z, i) => (
            <div key={z.zoneId} className="priority-zone" style={{
              background: priorityBg[z.priority],
              borderColor: `${priorityColor[z.priority]}44`,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: priorityColor[z.priority], color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>P{i + 1}</span>
                  <span style={{ fontWeight: 600 }}>Zone {z.zoneId}</span>
                  <span className={`badge ${z.priority === "critical" ? "red" : z.priority === "high" ? "orange" : "yellow"}`}>
                    {z.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {z.sosCount} SOS report{z.sosCount > 1 ? "s" : ""} · {z.lat?.toFixed(4)}, {z.lng?.toFixed(4)}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {availableTeams.length > 0 ? (
                  availableTeams.map(team => (
                    <button
                      key={team.id}
                      className="btn btn-danger"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                      disabled={assigning === team.id}
                      onClick={() => handleAssign(team.id, z)}
                    >
                      {assigning === team.id ? "..." : `Send ${team.name}`}
                    </button>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>No teams available</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Team Status */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">👥 Rescue Teams</div>

            {teams.map(team => (
              <div key={team.id} style={{
                padding: "14px", borderRadius: 10, marginBottom: 10,
                border: "1px solid var(--border)",
                background: team.available ? "#f1f8e9" : "#fff8f0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</span>
                    <span className={`badge ${team.available ? "green" : "orange"}`}>
                      {team.available ? "✅ Available" : "🚁 Deployed"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>
                    Base: {team.lat}, {team.lng}
                    {team.assignedZone && ` → Zone ${team.assignedZone}`}
                  </p>
                </div>
                {!team.available && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() => handleComplete(team.id)}
                  >
                    ✅ Mark Complete
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* SOS Reports */}
          <div className="card">
            <div className="card-title">🆘 SOS Reports</div>
            {sosReports.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No active SOS reports.</p>
            )}
            {sosReports.map(r => (
              <div key={r.id} style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                background: "#fff5f5", border: "1px solid #ffcdd2",
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span className="badge red">SOS</span>
                  <span className={`badge ${r.verified ? "green" : "yellow"}`}>
                    {r.verified ? "Verified" : "Pending"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Zone {r.zoneId}</span>
                </div>
                {r.description && <p style={{ fontSize: 13 }}>{r.description}</p>}
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)} · {new Date(r.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
