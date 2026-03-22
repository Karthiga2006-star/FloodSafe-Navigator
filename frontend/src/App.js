import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import MapView from "./pages/MapView";
import BeforeFlood from "./pages/BeforeFlood";
import DuringFlood from "./pages/DuringFlood";
import AfterFlood from "./pages/AfterFlood";
import RescueDashboard from "./pages/RescueDashboard";
import Notification from "./components/Notification";
import "./App.css";

function AppInner() {
  const { activePhase, setActivePhase, userMode, setUserMode, stats, loading } = useApp();
  const [showMap, setShowMap] = useState(false);

  const phases = [
    { id: "before", label: "Before Flood", icon: "🌧" },
    { id: "during", label: "During Flood", icon: "🌊" },
    { id: "after",  label: "After Flood",  icon: "🔄" },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">🌊 FloodNav</span>
          <span className="tagline">Tamil Nadu Flood Navigation System</span>
        </div>
        <div className="header-right">
          {stats && (
            <div className="live-stats">
              <span className="stat-pill red">{stats.verified} Active Alerts</span>
              <span className="stat-pill blue">{stats.total} Reports</span>
            </div>
          )}
          <button
            className={`mode-toggle ${userMode === "rescue" ? "rescue-active" : ""}`}
            onClick={() => setUserMode(userMode === "public" ? "rescue" : "public")}
          >
            {userMode === "public" ? "🚨 Switch to Rescue Mode" : "👤 Switch to Public Mode"}
          </button>
          <button className="map-btn" onClick={() => setShowMap(!showMap)}>
            {showMap ? "📋 Dashboard" : "🗺 Live Map"}
          </button>
          {loading && <span className="loading-dot">●</span>}
        </div>
      </header>

      {/* Phase Tabs */}
      {!showMap && userMode === "public" && (
        <nav className="phase-nav">
          {phases.map((p) => (
            <button
              key={p.id}
              className={`phase-tab ${activePhase === p.id ? "active" : ""}`}
              onClick={() => setActivePhase(p.id)}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        {showMap ? (
          <MapView />
        ) : userMode === "rescue" ? (
          <RescueDashboard />
        ) : activePhase === "before" ? (
          <BeforeFlood />
        ) : activePhase === "during" ? (
          <DuringFlood />
        ) : (
          <AfterFlood />
        )}
      </main>

      <Notification />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
