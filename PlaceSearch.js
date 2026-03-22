import React, { useState, useRef, useEffect } from "react";
 
export default function PlaceSearch({ label, value, onChange, placeholder }) {
  const [query, setQuery]       = useState(value?.name || "");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);
 
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
 
  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    setShowDrop(true);
 
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
 
    if (val.length < 3) { setResults([]); return; }
 
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Nominatim — free OSM geocoding, no API key needed
        // Biased to Tamil Nadu / India for better local results
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6&countrycodes=in&viewbox=76.0,8.0,80.5,13.5&bounded=0`;
        const res  = await fetch(url, {
          headers: { "Accept-Language": "en" }
        });
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400); // wait 400ms after user stops typing
  }
 
  function handleSelect(place) {
    const selected = {
      name: place.display_name.split(",").slice(0, 2).join(", "), // short name
      fullName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    };
    setQuery(selected.name);
    setResults([]);
    setShowDrop(false);
    onChange(selected);
  }
 
  function getIcon(type) {
    const icons = {
      city: "🏙", town: "🏘", village: "🏡", road: "🛣",
      residential: "🏠", hospital: "🏥", school: "🏫",
      place: "📍", suburb: "📍", neighbourhood: "📍",
    };
    return icons[type] || "📍";
  }
 
  return (
    <div className="form-group" ref={wrapperRef} style={{ position: "relative" }}>
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 3 && setShowDrop(true)}
          placeholder={placeholder || "Search for a place..."}
          autoComplete="off"
        />
        {loading && (
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontSize: 12, color: "var(--muted)"
          }}>Searching...</span>
        )}
      </div>
 
      {/* Dropdown results */}
      {showDrop && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000,
          background: "#fff", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          maxHeight: 260, overflowY: "auto", marginTop: 4,
        }}>
          {results.map((place, i) => {
            const shortName = place.display_name.split(",").slice(0, 2).join(", ");
            const rest      = place.display_name.split(",").slice(2, 4).join(", ");
            return (
              <div
                key={i}
                onClick={() => handleSelect(place)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex", gap: 10, alignItems: "flex-start",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5f8ff"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {getIcon(place.type)}
                </span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{shortName}</p>
                  {rest && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{rest}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {/* Show selected coordinates */}
      {value?.lat && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          📍 {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}