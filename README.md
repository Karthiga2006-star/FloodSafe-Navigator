# 🌊 FloodNav — Tamil Nadu Flood Navigation System

A full-stack web app for flood-aware navigation, crowd reporting, and rescue coordination.
Covers all 3 phases: Before Flood (prediction), During Flood (live routing), After Flood (recovery).

---

## 📁 Folder Structure

```
floodapp/
│
├── backend/                        # Node.js + Express API
│   ├── server.js                   # Entry point — starts Express server
│   ├── .env                        # Environment variables (PORT, API keys)
│   ├── package.json
│   │
│   ├── data/
│   │   └── store.js                # In-memory data store (replace with PostgreSQL)
│   │
│   └── routes/
│       ├── reports.js              # POST/GET flood crowd reports
│       ├── alerts.js               # GET zone alerts + risk scores
│       ├── routing.js              # POST safe route, GET water level
│       ├── predict.js              # GET flood risk prediction (AI simulation)
│       └── rescue.js               # Rescue team management + priority zones
│
└── frontend/                       # React app
    ├── package.json
    ├── public/
    │   └── index.html
    │
    └── src/
        ├── index.js                # React entry point
        ├── App.js                  # Main app — routing between phases
        ├── App.css                 # All styles
        │
        ├── context/
        │   └── AppContext.js       # Global state (reports, alerts, phase, mode)
        │
        ├── services/
        │   └── api.js              # All API calls in one file
        │
        ├── components/
        │   └── Notification.js     # Toast notifications
        │
        └── pages/
            ├── MapView.js          # Live Leaflet map + route planner
            ├── BeforeFlood.js      # AI prediction + rainfall chart
            ├── DuringFlood.js      # Submit reports + safe route + water level
            ├── AfterFlood.js       # Recovery tracking + satellite info
            └── RescueDashboard.js  # Rescue teams + SOS priority zones
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js
Download from https://nodejs.org (use LTS version)

---

### Step 2 — Set up the Backend

```bash
# Go into backend folder
cd floodapp/backend

# Install dependencies
npm install

# Start the server
npm run dev       # uses nodemon (auto-restarts on changes)
# OR
npm start         # plain node
```

Server runs at: **http://localhost:5000**

Test it:
```bash
curl http://localhost:5000/
# → { "message": "FloodNav API running" }

curl http://localhost:5000/api/reports
# → list of flood reports

curl http://localhost:5000/api/alerts
# → zone alerts
```

---

### Step 3 — Set up the Frontend

Open a NEW terminal window:

```bash
# Go into frontend folder
cd floodapp/frontend

# Install dependencies
npm install

# Start the React app
npm start
```

App opens at: **http://localhost:3000**

The `"proxy": "http://localhost:5000"` in frontend/package.json
routes all /api calls to the backend automatically.

---

## 🧪 Testing the App

### Test crowd report submission
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"lat":10.7905,"lng":78.7047,"type":"road_flooded","description":"Main road flooded","phase":"during","zoneId":"Z1"}'
```

### Test flood risk prediction
```bash
curl "http://localhost:5000/api/predict/flood-risk?zoneId=Z1&rainfall_mm=180"
```

### Test safe route
```bash
curl -X POST http://localhost:5000/api/routes/safe-route \
  -H "Content-Type: application/json" \
  -d '{"fromLat":10.7905,"fromLng":78.7047,"toLat":10.8100,"toLng":78.6800}'
```

### Test water level
```bash
curl "http://localhost:5000/api/routes/water-level?lat=10.7905&lng=78.7047"
```

---

## 🔗 All API Endpoints

### Reports
| Method | URL                        | What it does                        |
|--------|----------------------------|-------------------------------------|
| GET    | /api/reports               | Get all verified flood reports      |
| GET    | /api/reports?all=true      | Get all reports including pending   |
| POST   | /api/reports               | Submit a new crowd report           |
| GET    | /api/reports/nearby        | Get reports near lat/lng            |
| GET    | /api/reports/stats         | Report counts by type/phase         |

### Alerts
| Method | URL                        | What it does                        |
|--------|----------------------------|-------------------------------------|
| GET    | /api/alerts                | Get all zone alerts                 |
| GET    | /api/alerts/level/:level   | Filter by red/orange/yellow         |
| GET    | /api/alerts/risk/:zoneId   | Get AI risk score for a zone        |

### Routing
| Method | URL                        | What it does                        |
|--------|----------------------------|-------------------------------------|
| POST   | /api/routes/safe-route     | Get flood-avoiding route            |
| GET    | /api/routes/water-level    | Get predicted water depth at point  |

### Prediction (Before Flood)
| Method | URL                             | What it does                   |
|--------|---------------------------------|--------------------------------|
| GET    | /api/predict/flood-risk         | AI flood risk from rainfall mm |
| GET    | /api/predict/rainfall-trend     | 7-day rainfall forecast        |

### Rescue
| Method | URL                        | What it does                        |
|--------|----------------------------|-------------------------------------|
| GET    | /api/rescue/teams          | All rescue teams + status           |
| GET    | /api/rescue/priority-zones | SOS zones sorted by urgency         |
| POST   | /api/rescue/assign         | Assign team to zone                 |
| POST   | /api/rescue/complete       | Mark rescue as complete             |

---

## 🚀 Upgrading to Production

### Replace in-memory store → PostgreSQL + PostGIS
```bash
npm install pg
```
PostGIS lets you run spatial queries like:
```sql
SELECT * FROM reports
WHERE ST_DWithin(location, ST_MakePoint(78.70, 10.79)::geography, 500);
```

### Replace mock ML prediction → Real Python model
```bash
# In a separate Python service:
pip install xgboost scikit-learn flask pandas
# Train on IMD historical rainfall + NDMA flood occurrence data
# Expose as POST /predict endpoint
# Call from Node.js backend
```

### Replace mock routing → OpenRouteService
```bash
npm install openrouteservice-js
# Free API key at openrouteservice.org
# Use avoid_polygons built from verified flood report coordinates
```

### Connect live rainfall data → OpenWeatherMap
```bash
# Add to .env:
OPENWEATHER_API_KEY=your_key_here
# GET https://api.openweathermap.org/data/2.5/rain?lat=10.79&lon=78.70&appid=KEY
```

### Connect IMD alerts → NDMA API
```
https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails
# Free, returns active district-level alerts for all of India
```

---

## 📱 How the App Works (Quick Summary)

| Feature              | How it works                                                   |
|----------------------|----------------------------------------------------------------|
| Flood reports        | User submits → verified if 2+ reports within 500m/30min       |
| Safe routing         | Route avoids roads within 400m of verified flood reports       |
| Water level AI       | Combines crowd photos + gauge data to estimate road depth      |
| Risk prediction      | Rainfall input → risk score (red/orange/yellow/green)          |
| Rescue mode          | SOS reports clustered by zone → ranked by count → team assigned|
| Recovery tracking    | % based on cleared vs flooded reports; satellite cross-check   |
| Auto-refresh         | Dashboard refreshes every 30 seconds automatically             |

---

## ⚡ Common Issues

**"Cannot connect to backend"**
→ Make sure `npm run dev` is running in the backend folder first

**Map not loading**
→ Leaflet CSS must be imported — already done in MapView.js

**CORS error**
→ The cors middleware in server.js handles this — both must run on localhost

**Port conflict**
→ Change PORT in backend/.env; change proxy in frontend/package.json to match
