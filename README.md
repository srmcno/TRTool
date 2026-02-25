# TRTool — CNO Tribal Reclamation & Land Intelligence Tool

**Division of Legal & Compliance › Department of Natural Resources › Environmental Protective Services**  
**Choctaw Nation of Oklahoma**

An interactive GIS dashboard for the Choctaw Nation Tribal Reclamation Officer — mapping all land categories relevant to tribal reclamation, land-back efforts, fee-to-trust acquisition, brownfields remediation, and environmental compliance within the Choctaw Nation reservation.

---

## Features

- **11 live data layers** pulled from public ArcGIS REST endpoints (Census, BIA, USFS, USACE, USFWS, ODWC, OK DEQ, EPA)
- **Brand-aligned UI** — PMS 4625 Brown (#421400), PMS 356 Green (#00853E), PMS 116 Gold (#C9A904), Trebuchet MS typography
- **CNO Great Seal** SVG (unstrung bow, three arrows, pipe-hatchet) per brand standards
- **Interactive map** with Leaflet.js — click any feature to view all attributes
- **Shoreline zone classifications** — USACE project master plan zones (Restricted, Recreation HD/LD, Natural, Multiple Resource)
- **Marker clustering** for contaminated site layers
- **Reclamation statistics** panel (trust acres, brownfield/superfund counts)
- **Fee-to-Trust process** reference (25 CFR Part 151, updated Jan 2024)
- **Layer groups** — Tribal Lands, Federal Lands, State Lands, Contaminated Sites, Shoreline Zones
- Basemap switcher: Streets / Satellite / Topographic
- Print-optimised layout

## Layers

| # | Layer | Source | Brand Color |
|---|-------|--------|-------------|
| 1 | CNO Reservation Boundary | Census TIGERweb OTSA | PMS 4625 Brown `#421400` |
| 2 | BIA Trust/Restricted Land | BIA AIAN-LAR | PMS 116 Gold `#C9A904` |
| 3 | USFS Ouachita National Forest | USFS EDW | PMS 356 Green `#00853E` |
| 4 | USACE Corps Reservoirs | USACE (Tulsa District) | PMS 2925 Blue `#009ADA` |
| 5 | State WMAs (ODWC) | Oklahoma ODWC | Green tint `#4A9E6B` |
| 6 | Federal NWRs (USFWS) | USFWS Region 2 | Blue tint `#5BB5E0` |
| 7 | DEQ Brownfields | OK DEQ LandWeb | PMS 116 Gold `#C9A904` |
| 8 | DEQ Superfund/NPL | OK DEQ LandWeb | PMS 1795 Red `#EF373E` |
| 9 | DEQ Voluntary Cleanup (VCP) | OK DEQ LandWeb | PMS 4625 Brown `#421400` |
| 10 | EPA CIMC Cleanups | EPA CIMC | PMS 875 Bronze `#87674F` |
| 11 | USACE Shoreline Zones | USACE | Dynamic by zone type |

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Then open http://localhost:5000 in your browser.

## Deployment

```bash
gunicorn app:app --bind 0.0.0.0:8000
```

## Data Sources

All data is fetched live from public ArcGIS REST endpoints:
- US Census TIGERweb AIANNHA
- BIA Geospatial (geoplatform.gov)
- USFS Enterprise Data Warehouse (EDW)
- USACE (services2.arcgis.com)
- USFWS (services.arcgis.com)
- Oklahoma ODWC (services6.arcgis.com)
- Oklahoma DEQ GIS (gis.deq.ok.gov)
- EPA CIMC (services.arcgis.com)

*Data current as of February 2026. All data is public federal/state ArcGIS REST services.*
