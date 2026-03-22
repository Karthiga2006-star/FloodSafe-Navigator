import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getReports, getAlerts, getReportStats } from "../services/api";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [reports, setReports]       = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [activePhase, setActivePhase] = useState("during"); // before | during | after
  const [userMode, setUserMode]     = useState("public");   // public | rescue
  const [loading, setLoading]       = useState(false);
  const [notification, setNotification] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, s] = await Promise.all([getReports(), getAlerts(), getReportStats()]);
      setReports(r.data.reports);
      setAlerts(a.data.alerts);
      setStats(s.data.stats);
    } catch (e) {
      console.error("Refresh failed:", e);
      showNotification("Could not reach server. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds (simulates live updates)
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  function showNotification(message, type = "info") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  return (
    <AppContext.Provider
      value={{
        reports, setReports,
        alerts,  setAlerts,
        stats,   setStats,
        activePhase, setActivePhase,
        userMode, setUserMode,
        loading,
        notification, showNotification,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
