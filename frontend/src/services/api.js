import axios from "axios";

const API = axios.create({ baseURL: "/api" });

// ---------- REPORTS ----------
export const getReports       = ()       => API.get("/reports");
export const getAllReports     = ()       => API.get("/reports?all=true");
export const submitReport     = (data)   => API.post("/reports", data);
export const getReportStats   = ()       => API.get("/reports/stats");
export const getNearbyReports = (lat, lng) => API.get(`/reports/nearby?lat=${lat}&lng=${lng}`);

// ---------- ALERTS ----------
export const getAlerts      = ()          => API.get("/alerts");
export const getZoneRisk    = (zoneId)    => API.get(`/alerts/risk/${zoneId}`);

// ---------- ROUTING ----------
export const getSafeRoute   = (from, to)  =>
  API.post("/routes/safe-route", {
    fromLat: from.lat, fromLng: from.lng,
    toLat: to.lat,     toLng: to.lng,
  });
export const getWaterLevel  = (lat, lng)  => API.get(`/routes/water-level?lat=${lat}&lng=${lng}`);

// ---------- PREDICTION ----------
export const getFloodRisk     = (params)  => API.get("/predict/flood-risk", { params });
export const getRainfallTrend = ()        => API.get("/predict/rainfall-trend");

// ---------- RESCUE ----------
export const getRescueTeams    = ()       => API.get("/rescue/teams");
export const getPriorityZones  = ()       => API.get("/rescue/priority-zones");
export const assignRescueTeam  = (data)   => API.post("/rescue/assign", data);
export const completeRescue    = (teamId) => API.post("/rescue/complete", { teamId });
