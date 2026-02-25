/* ================================================================
   CNO Tribal Reclamation & Land Intelligence Tool — Map Application
   ================================================================
   Leaflet.js interactive map with all 11 data layers.

   Layer colour sources (brand standards Great Seal palette, p.11):
     CNO Boundary    PMS 4625 Brown  #421400
     BIA Trust       PMS 116  Gold   #C9A904
     USFS            PMS 356  Green  #00853E
     USACE Reservoirs PMS 2925 Blue  #009ADA
     State WMAs      Green tint      #4A9E6B
     Federal NWRs    Blue tint       #5BB5E0
     Brownfields     PMS 116 Gold    #C9A904
     Superfund       PMS 1795 Red    #EF373E
     VCP             PMS 4625 Brown  #421400
     EPA CIMC        PMS 875 Bronze  #87674F
   ================================================================ */

"use strict";

/* ── Brand constants ───────────────────────────────────────────── */
const B = {
  brown:      "#421400",
  brownDark:  "#2a0d00",
  green:      "#00853E",
  greenTint:  "#4A9E6B",
  gold:       "#C9A904",
  blue:       "#009ADA",
  blueTint:   "#5BB5E0",
  red:        "#EF373E",
  bronze:     "#87674F",
};

/* ── Layer configuration ────────────────────────────────────────── */
const LAYERS = {
  cno_boundary: {
    name: "CNO Reservation Boundary",
    group: "tribal",
    kind: "polygon",
    style: { color: B.brown, weight: 3, dashArray: "8 4",
             fillColor: B.brown, fillOpacity: 0.04 },
    nameFields: ["BASENAME", "NAME", "GEOID"],
    defaultOn: true,
    badgeColor: B.brown,
    description: "Official OTSA boundary per US Census TIGERweb",
  },
  bia_trust: {
    name: "BIA Trust / Restricted Land",
    group: "tribal",
    kind: "polygon",
    style: { color: "#9A7E00", weight: 1.5,
             fillColor: B.gold, fillOpacity: 0.55 },
    nameFields: ["LARNAME", "AIANHHCE", "OBJECTID"],
    defaultOn: true,
    badgeColor: B.gold,
    description: "Current trust parcels — AIAN-LAR (BIA)",
  },
  usfs: {
    name: "USFS Ouachita National Forest",
    group: "federal",
    kind: "polygon",
    style: { color: "#005A2A", weight: 2,
             fillColor: B.green, fillOpacity: 0.28 },
    nameFields: ["FORESTNAME", "DISTRICTNA"],
    defaultOn: false,
    badgeColor: B.green,
    description: "Ouachita NF proclaimed boundary — USFS EDW",
  },
  usace_reservoirs: {
    name: "USACE Corps Reservoirs",
    group: "federal",
    kind: "polygon",
    style: { color: "#006A99", weight: 2,
             fillColor: B.blue, fillOpacity: 0.38 },
    nameFields: ["NAME", "DAM_NAME", "LAKE_NAME", "Project_Name"],
    defaultOn: false,
    badgeColor: B.blue,
    description: "Tulsa District (SWT) Corps-managed reservoirs",
  },
  federal_nwr: {
    name: "Federal NWRs (USFWS)",
    group: "federal",
    kind: "polygon",
    style: { color: "#3A95C0", weight: 2,
             fillColor: B.blueTint, fillOpacity: 0.32 },
    nameFields: ["ORGNAME", "UNITNAME", "AREANAME"],
    defaultOn: false,
    badgeColor: B.blueTint,
    description: "National Wildlife Refuges — USFWS Region 2",
  },
  state_wma: {
    name: "State WMAs (ODWC)",
    group: "state",
    kind: "polygon",
    style: { color: "#2A7E4B", weight: 2,
             fillColor: B.greenTint, fillOpacity: 0.38 },
    nameFields: ["NAME", "WMA_NAME", "AREANAME"],
    defaultOn: false,
    badgeColor: B.greenTint,
    description: "Oklahoma Wildlife Management Areas — ODWC",
  },
  deq_brownfields: {
    name: "DEQ Brownfields",
    group: "contam",
    kind: "point",
    markerColor: B.gold,
    markerBorder: "#421400",
    nameFields: ["PROJECT_NA", "SITE_NAME", "FacilityName", "Facility_N"],
    defaultOn: false,
    badgeColor: B.gold,
    description: "OK DEQ Brownfields Program — 128(a) grant candidates",
  },
  deq_superfund: {
    name: "DEQ Superfund / NPL",
    group: "contam",
    kind: "point",
    markerColor: B.red,
    markerBorder: "#C0002A",
    nameFields: ["NPL_SITE", "SITE_NAME", "FacilityName", "Facility_N"],
    defaultOn: false,
    badgeColor: B.red,
    description: "Federal NPL Superfund sites — OK DEQ",
  },
  deq_vcp: {
    name: "DEQ Voluntary Cleanup (VCP)",
    group: "contam",
    kind: "point",
    markerColor: B.brown,
    markerBorder: "#210A00",
    nameFields: ["Facility_N", "SITE_NAME", "FacilityName"],
    defaultOn: false,
    badgeColor: B.brown,
    description: "Voluntary Cleanup Program — hazardous & petroleum sites",
  },
  epa_cimc: {
    name: "EPA CIMC Cleanups",
    group: "contam",
    kind: "point",
    markerColor: B.bronze,
    markerBorder: "#5A3D27",
    nameFields: ["IND_NAME", "PRIMARY_NAME", "SITE_NAME", "Name"],
    defaultOn: false,
    badgeColor: B.bronze,
    description: "EPA Cleanups in My Community — RCRA / brownfield / Superfund",
  },
  shoreline_zones: {
    name: "USACE Shoreline Management",
    group: "shore",
    kind: "polygon",
    /* style is dynamic — see getShoreStyle() */
    style: { color: "#006A99", weight: 1.5,
             fillColor: B.blue, fillOpacity: 0.35 },
    nameFields: ["ZONE_TYPE", "ZONE_NAME", "MGMT_TYPE", "Zone_Type", "LAKE_NAME"],
    defaultOn: false,
    badgeColor: B.blue,
    description: "USACE shoreline zone classification (project master plan)",
    dynamicStyle: true,
  },
};

/* Shoreline zone colour map */
const SHORE_COLORS = {
  restricted:          "#C00000",
  prohibited:          "#C00000",
  "recreation high":   "#FF6600",
  "high density":      "#FF6600",
  "recreation low":    "#FFCC00",
  "low density":       "#FFCC00",
  natural:             "#00853E",
  environmental:       "#00853E",
  primitive:           "#C9A904",
  "multiple resource": "#4A9E6B",
  "multiple use":      "#4A9E6B",
};

/* ── Module state ───────────────────────────────────────────────── */
let map;
let leafletLayers = {};   /* layerId → Leaflet layer object */
const loadQueue   = [];   /* layers waiting for on-demand load */

/* ── DOM helpers ────────────────────────────────────────────────── */
const $  = (id)  => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ================================================================
   MAP INITIALISATION
   ================================================================ */
function initMap() {
  map = L.map("map", {
    center: [34.55, -95.4],
    zoom: 8,
    zoomControl: false,
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  /* Basemaps */
  const BM = {
    osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }),
    satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri, Maxar", maxZoom: 19 }
    ),
    topo: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri", maxZoom: 19 }
    ),
  };
  BM.osm.addTo(map);
  let currentBm = "osm";

  $$(".bm-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const bm = btn.dataset.bm;
      if (bm === currentBm) return;
      map.removeLayer(BM[currentBm]);
      BM[bm].addTo(map);
      currentBm = bm;
      $$(".bm-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* Coordinate readout */
  map.on("mousemove", e => {
    const { lat, lng } = e.latlng;
    $("coords-box").innerHTML =
      `<i class="fa fa-crosshairs"></i> ${lat.toFixed(5)}°N,  ${Math.abs(lng).toFixed(5)}°W`;
  });

  /* Layer toggle checkboxes */
  $$("[id^='chk-']").forEach(chk => {
    chk.addEventListener("change", e => {
      const id = e.target.id.replace("chk-", "");
      e.target.checked ? showLayer(id) : hideLayer(id);
    });
  });

  /* Sidebar collapse */
  $("sidebar-toggle").addEventListener("click", () => {
    const sb = $("sidebar");
    const ic = $("toggle-icon");
    sb.classList.toggle("collapsed");
    ic.className = sb.classList.contains("collapsed")
      ? "fa fa-chevron-right"
      : "fa fa-chevron-left";
    setTimeout(() => map.invalidateSize(), 320);
  });

  /* Header buttons */
  $("btn-print").addEventListener("click", () => window.print());
  $("btn-help").addEventListener("click",  showHelp);

  /* Layer groups are opened by default in HTML for the key groups;
     JS toggleGroup is still available for clicks */

  loadBootLayers();
}

/* ================================================================
   LAYER LOADING
   ================================================================ */

/** Load layers that are on by default at startup */
async function loadBootLayers() {
  const bootIds = Object.entries(LAYERS)
    .filter(([, cfg]) => cfg.defaultOn)
    .map(([id]) => id);

  setLoadDetail("Loading reservation boundary…");
  setLoadProgress(5);

  // Hard timeout: always dismiss overlay after 20s regardless of data
  const overlayTimeout = setTimeout(dismissOverlay, 20000);

  try {
    for (let i = 0; i < bootIds.length; i++) {
      await fetchLayer(bootIds[i]);
      setLoadProgress(5 + ((i + 1) / bootIds.length) * 90);
    }
  } catch (_) {}

  clearTimeout(overlayTimeout);
  setLoadProgress(100);
  setTimeout(dismissOverlay, 500);
}

function dismissOverlay() {
  const lo = $("load-overlay");
  if (!lo) return;
  lo.classList.add("hidden");
  setTimeout(() => { lo.style.display = "none"; }, 500);
  setStatus("Map ready — toggle layers to explore reclamation opportunities.");
  // Zoom to CNO boundary if loaded
  if (leafletLayers.cno_boundary) {
    try { map.fitBounds(leafletLayers.cno_boundary.getBounds(), { padding: [24, 24] }); }
    catch (_) {}
  }
}

/** Fetch GeoJSON from Flask API and register the layer */
async function fetchLayer(layerId) {
  const cfg = LAYERS[layerId];
  if (!cfg) return;

  setLayerStat(layerId, "loading", "Loading…");
  setLoadDetail(`Loading ${cfg.name}…`);

  try {
    const resp = await fetch(`/api/layer/${layerId}`,
      { signal: AbortSignal.timeout ? AbortSignal.timeout(50000) : undefined });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const count = data.features?.length ?? 0;

    if (count === 0) {
      const warn = data.warning || "No features returned";
      setLayerStat(layerId, "error", warn.length > 36 ? "No data (service unavailable)" : warn);
      return;
    }

    setLayerStat(layerId, "loaded", `${count.toLocaleString()} features`);
    buildLeafletLayer(layerId, data, cfg);
    updateStats(layerId, data);

  } catch (err) {
    setLayerStat(layerId, "error", "Failed to load");
    console.warn(`[TRTool] Layer ${layerId} error:`, err.message);
  }
}

/** Build and (optionally) add a Leaflet layer to the map */
function buildLeafletLayer(layerId, geojson, cfg) {
  let layer;

  if (cfg.kind === "point") {
    /* Clustered circle markers */
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      iconCreateFunction: c => clusterIcon(c, cfg.markerColor),
      chunkedLoading: true,
    });

    const gl = L.geoJSON(geojson, {
      pointToLayer: (feat, latlng) =>
        L.circleMarker(latlng, {
          radius: 7,
          fillColor: cfg.markerColor,
          color: cfg.markerBorder || "#fff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.88,
        }),
      onEachFeature: (feat, l) => bindLayer(feat, l, layerId, cfg),
    });

    cluster.addLayer(gl);
    layer = cluster;

  } else {
    /* Polygon / polyline layer */
    layer = L.geoJSON(geojson, {
      style: feat => cfg.dynamicStyle
        ? getShoreStyle(feat)
        : (cfg.style || {}),
      onEachFeature: (feat, l) => bindLayer(feat, l, layerId, cfg),
    });
  }

  leafletLayers[layerId] = layer;

  /* Add to map if checkbox is checked */
  const chk = $(`chk-${layerId}`);
  if (chk?.checked) layer.addTo(map);

  /* Show shoreline sub-legend when layer loads */
  if (layerId === "shoreline_zones") {
    const sl = $("shore-legend");
    if (sl) sl.style.display = "block";
  }
}

/* ── Bind tooltip & click for feature info ─────────────────────── */
function bindLayer(feat, layer, layerId, cfg) {
  const name = featureName(feat, cfg.nameFields);
  layer.bindTooltip(name, { sticky: true, className: "brand-tip" });
  layer.on("click", () => showInfo(feat, layerId, cfg));
}

/* ================================================================
   LAYER SHOW / HIDE (on-demand load)
   ================================================================ */
function showLayer(id) {
  if (leafletLayers[id]) {
    leafletLayers[id].addTo(map);
  } else {
    fetchLayer(id);            /* first enable = fetch */
  }
  if (id === "shoreline_zones") {
    const sl = $("shore-legend");
    if (sl && leafletLayers[id]) sl.style.display = "block";
  }
}

function hideLayer(id) {
  const l = leafletLayers[id];
  if (l && map.hasLayer(l)) map.removeLayer(l);
  if (id === "shoreline_zones") {
    const sl = $("shore-legend");
    if (sl) sl.style.display = "none";
  }
}

/* ================================================================
   STYLES
   ================================================================ */

/** Dynamic shoreline zone colour by zone type attribute */
function getShoreStyle(feat) {
  const p = feat.properties || {};
  const raw = (
    p.ZONE_TYPE || p.ZONE_NAME || p.MGMT_TYPE || p.Zone_Type ||
    p.SMP_ZONE  || p.CATEGORY  || ""
  ).toLowerCase();

  let fill = B.blue;
  for (const [key, color] of Object.entries(SHORE_COLORS)) {
    if (raw.includes(key)) { fill = color; break; }
  }

  return { color: "#006A99", weight: 1.5, fillColor: fill, fillOpacity: 0.42 };
}

/** Custom cluster icon using brand colours */
function clusterIcon(cluster, color) {
  const n    = cluster.getChildCount();
  const size = n < 10 ? 28 : n < 100 ? 34 : 40;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-family:'Trebuchet MS',Arial,sans-serif;
      font-weight:700;font-size:${n < 100 ? 12 : 10}px;
      border:2px solid rgba(255,255,255,0.7);
      box-shadow:0 2px 6px rgba(0,0,0,0.45);
    ">${n}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ================================================================
   FEATURE INFO PANEL
   ================================================================ */
function showInfo(feat, layerId, cfg) {
  const name = featureName(feat, cfg.nameFields);
  $("ip-title").textContent = name;

  const badgeColor = cfg.kind === "point"
    ? cfg.markerColor
    : (cfg.style?.fillColor || B.brown);

  let html = `<div class="ip-badge" style="background:${badgeColor}">${cfg.name}</div>`;
  if (cfg.description) {
    html += `<p style="font-size:10.5px;color:var(--text-mid);margin-bottom:10px;">${cfg.description}</p>`;
  }
  html += '<table class="attr-table">';

  const skip = new Set(["OBJECTID","objectid","FID","fid","Shape__Area",
                        "Shape__Length","GlobalID","SHAPE_Area","SHAPE_Length"]);

  for (const [k, v] of Object.entries(feat.properties || {})) {
    if (skip.has(k) || v === null || v === undefined || String(v).trim() === "") continue;
    const disp = typeof v === "number" ? v.toLocaleString() : String(v);
    html += `<tr><td>${k}</td><td>${disp}</td></tr>`;
  }

  html += "</table>";
  $("ip-body").innerHTML = html;
  $("info-panel").classList.add("open");
  setTimeout(() => map.invalidateSize(), 310);
}

function closeInfoPanel() {
  $("info-panel").classList.remove("open");
  setTimeout(() => map.invalidateSize(), 310);
}
window.closeInfoPanel = closeInfoPanel;

/* ================================================================
   LAYER GROUP ACCORDION
   ================================================================ */
function toggleGroup(group) {
  const body  = $(`lgb-${group}`);
  const chev  = $(`chev-${group}`);
  if (!body) return;
  const open = body.classList.contains("open");
  body.classList.toggle("open", !open);
  if (chev) chev.classList.toggle("open", !open);
}
window.toggleGroup = toggleGroup;

/* ================================================================
   STATISTICS
   ================================================================ */
function updateStats(layerId, data) {
  const feats = data.features || [];
  if (layerId === "bia_trust") {
    let acres = 0;
    feats.forEach(f => {
      const a = f.properties?.GISACRES || f.properties?.GIS_ACRES || 0;
      acres += +a || 0;
    });
    $("sv-trust").textContent = acres > 0
      ? `${Math.round(acres).toLocaleString()} ac`
      : `${feats.length} parcels`;
  }
  if (layerId === "deq_brownfields") $("sv-brown").textContent = feats.length.toLocaleString();
  if (layerId === "deq_superfund")   $("sv-super").textContent = feats.length.toLocaleString();
  if (layerId === "usace_reservoirs") $("sv-res").textContent  = feats.length.toLocaleString();
}

/* ================================================================
   UTILITIES
   ================================================================ */
function featureName(feat, nameFields) {
  const p = feat.properties || {};
  for (const f of (nameFields || [])) {
    if (p[f]) return String(p[f]);
  }
  for (const v of Object.values(p)) {
    if (v && typeof v === "string" && v.length > 2 && v.length < 120) return v;
  }
  return "Unknown Feature";
}

function setLayerStat(id, cls, text) {
  const el = $(`stat-${id}`);
  if (!el) return;
  el.textContent = text;
  el.className = `li-stat ${cls}`;
}

function setLoadProgress(pct) {
  const el = $("load-bar");
  if (el) el.style.width = `${pct}%`;
}

function setLoadDetail(text) {
  const el = $("load-detail");
  if (el) el.textContent = text;
}

function setStatus(html) {
  const el = $("status-msg");
  if (el) el.innerHTML = html;
}

/* ================================================================
   HELP DIALOG
   ================================================================ */
function showHelp() {
  alert(
`CNO Tribal Reclamation & Land Intelligence Tool
================================================

LAYER GROUPS:
  Tribal Lands      — CNO boundary, BIA trust parcels
  Federal Lands     — USFS Ouachita NF, USACE reservoirs, NWRs
  State Lands       — Oklahoma WMAs (ODWC)
  Contaminated Sites— Brownfields, Superfund/NPL, VCP, EPA CIMC
  Shoreline Zones   — USACE shoreline management classifications

HOW TO USE:
  • Toggle layers on/off with the switches in the sidebar
  • Click any map feature to view all attributes
  • Use the basemap buttons (Streets / Satellite / Topo)
  • Collapse the sidebar for a larger map view
  • Click Print to get a printable layout

DATA SOURCES:
  US Census TIGERweb · BIA AIAN-LAR · USFS EDW
  USACE · USFWS · ODWC · OK DEQ · EPA CIMC

REGULATORY REFERENCE:
  25 CFR Part 151 (Fee-to-Trust, updated Jan 2024)
  CNO 128(a) Tribal Response Program
  EPA Brownfields Grant $1.57M (2023)

Environmental Protective Services
Division of Legal & Compliance
Choctaw Nation of Oklahoma`
  );
}

/* ================================================================
   ENTRY POINT
   ================================================================ */
document.addEventListener("DOMContentLoaded", initMap);
