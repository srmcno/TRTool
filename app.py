"""
CNO Tribal Reclamation & Land Intelligence Tool
================================================
Flask application backend — proxies ArcGIS REST services
and serves the interactive mapping dashboard.

Division of Legal & Compliance
  Department of Natural Resources
    Environmental Protective Services
Choctaw Nation of Oklahoma
"""

from flask import Flask, render_template, jsonify
import requests
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__)

# ---------------------------------------------------------------------------
# ArcGIS layer endpoint registry
# ---------------------------------------------------------------------------
LAYER_DEFS = {
    # 1. CNO Reservation Boundary (Census TIGERweb OTSA)
    "cno_boundary": dict(
        url="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/7/query",
        where="BASENAME = 'Choctaw'",
        label="CNO Reservation Boundary",
    ),
    # 2. BIA Trust / Restricted Land (AIAN-LAR)
    "bia_trust": dict(
        url="https://biamaps.geoplatform.gov/server/rest/services/DivLTR/BIA_AIAN_National_LAR/MapServer/0/query",
        where="LARNAME LIKE '%Choctaw%'",
        label="BIA Trust / Restricted Land",
    ),
    # 3. USFS Ouachita National Forest
    "usfs": dict(
        url="https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0/query",
        where="FORESTNAME LIKE '%Ouachita%'",
        label="USFS Ouachita National Forest",
    ),
    # 4. USACE Corps Reservoirs (Tulsa District = SWT)
    "usace_reservoirs": dict(
        url="https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/USACE_Reservoirs/FeatureServer/0/query",
        where="DIST_SYM = 'SWT'",
        label="USACE Corps Reservoirs",
    ),
    # 5. Oklahoma Wildlife Management Areas (ODWC)
    "state_wma": dict(
        url="https://services6.arcgis.com/RBtoEUQ2lmN0K3GY/arcgis/rest/services/OklahomaRecreationalAreas/FeatureServer/0/query",
        where="1=1",
        label="State Wildlife Management Areas",
    ),
    # 6. USFWS National Wildlife Refuges — Region 2
    "federal_nwr": dict(
        url="https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/FWSInterest_Simplified_Authoritative/FeatureServer/0/query",
        where="FWSREGION = '2'",
        label="Federal National Wildlife Refuges",
    ),
    # 7. OK DEQ Brownfields (point features — use JSON mode)
    "deq_brownfields": dict(
        url="https://gis.deq.ok.gov/server/rest/services/LandWeb/MapServer/2/query",
        where="1=1",
        label="DEQ Brownfields Sites",
        use_json=True,
        lat_fields=["LAT", "Lat", "LATDD3"],
        lon_fields=["LONG", "Long", "LONDD3"],
    ),
    # 8. OK DEQ Superfund / NPL (point features)
    "deq_superfund": dict(
        url="https://gis.deq.ok.gov/server/rest/services/LandWeb/MapServer/1/query",
        where="1=1",
        label="DEQ Superfund / NPL Sites",
        use_json=True,
        lat_fields=["LATDD3", "LAT", "Lat"],
        lon_fields=["LONDD3", "LONG", "Long"],
    ),
    # 9. OK DEQ Voluntary Cleanup Program (point features)
    "deq_vcp": dict(
        url="https://gis.deq.ok.gov/server/rest/services/LandWeb/MapServer/0/query",
        where="1=1",
        label="DEQ Voluntary Cleanup Program",
        use_json=True,
        lat_fields=["Lat", "LAT", "LATDD3"],
        lon_fields=["Long", "LONG", "LONDD3"],
    ),
    # 10. EPA Cleanups in My Community (Oklahoma)
    "epa_cimc": dict(
        url="https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Cleanups_in_my_Community_Sites/FeatureServer/0/query",
        where="STATE_CODE = 'OK'",
        label="EPA Cleanups in My Community",
    ),
    # 11. USACE Shoreline Management Zones
    "shoreline_zones": dict(
        url="https://services7.arcgis.com/n1YM8pTrFmm7L4hs/arcgis/rest/services/USACEShoreline/FeatureServer/0/query",
        where="1=1",
        label="USACE Shoreline Management",
    ),
}


# ---------------------------------------------------------------------------
# ArcGIS fetch helpers
# ---------------------------------------------------------------------------

def _fetch_geojson(url, where, max_records=2000):
    """Paginated GeoJSON fetch from ArcGIS REST endpoint."""
    features = []
    offset = 0
    warning = None

    while True:
        params = {
            "where": where,
            "outFields": "*",
            "outSR": 4326,
            "f": "geojson",
            "resultOffset": offset,
            "resultRecordCount": max_records,
            "returnGeometry": "true",
        }
        try:
            r = requests.get(url, params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
        except Exception as exc:
            warning = str(exc)
            break

        if "error" in data:
            warning = data["error"].get("message", "ArcGIS service error")
            break

        page = data.get("features", [])
        features.extend(page)
        if len(page) < max_records:
            break
        offset += len(page)

    result = {"type": "FeatureCollection", "features": features}
    if warning:
        result["warning"] = warning
    return result


def _fetch_json_as_geojson(url, where, lat_fields, lon_fields, max_records=2000):
    """Fetch JSON from ArcGIS and build GeoJSON points from geometry/attribute coords."""
    params = {
        "where": where,
        "outFields": "*",
        "outSR": 4326,
        "f": "json",
        "resultRecordCount": max_records,
        "returnGeometry": "true",
    }
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        return {"type": "FeatureCollection", "features": [], "warning": str(exc)}

    if "error" in data:
        return {
            "type": "FeatureCollection",
            "features": [],
            "warning": data["error"].get("message", "ArcGIS service error"),
        }

    features = []
    for feat in data.get("features", []):
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {}) or {}
        lat = geom.get("y")
        lon = geom.get("x")
        if lat is None:
            for f in lat_fields:
                lat = attrs.get(f)
                if lat is not None:
                    break
        if lon is None:
            for f in lon_fields:
                lon = attrs.get(f)
                if lon is not None:
                    break
        if lat is None or lon is None:
            continue
        try:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                "properties": {k: v for k, v in attrs.items() if v is not None},
            })
        except (TypeError, ValueError):
            pass

    return {"type": "FeatureCollection", "features": features}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/layer/<layer_id>")
def get_layer(layer_id):
    defn = LAYER_DEFS.get(layer_id)
    if not defn:
        return jsonify({"error": "Layer not found"}), 404

    if defn.get("use_json"):
        data = _fetch_json_as_geojson(
            defn["url"],
            defn.get("where", "1=1"),
            defn.get("lat_fields", ["LAT"]),
            defn.get("lon_fields", ["LONG"]),
        )
    else:
        data = _fetch_geojson(defn["url"], defn.get("where", "1=1"))

    data["count"] = len(data.get("features", []))
    data["label"] = defn["label"]
    return jsonify(data)


@app.route("/api/layers")
def list_layers():
    return jsonify({k: {"label": v["label"]} for k, v in LAYER_DEFS.items()})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
