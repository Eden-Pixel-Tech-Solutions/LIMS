import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import { JHARKHAND_DATA, getRiskLevel } from "../../data/disasterMockData";

// GeoJSON URL for Jharkhand districts
const geoUrl = "https://raw.githubusercontent.com/shuklaneerajdev/IndiaStateTopojsonFiles/master/Jharkhand.geojson";

const MapChart = ({ onDistrictClick }) => {
  const [tooltip, setTooltip] = useState(null);

  const handleMouseEnter = (geo) => {
    const districtName = geo.properties.district || geo.properties.NAME_2 || geo.properties.dist_name;
    const districtData = JHARKHAND_DATA.find(d => 
      d.district.toLowerCase() === (districtName || "").toLowerCase() ||
      (d.districtKey && d.districtKey.toLowerCase() === (districtName || "").toLowerCase())
    );

    if (districtData) {
      setTooltip({
        name: districtData.district,
        disease: districtData.disease,
        cases: districtData.cases,
        risk: getRiskLevel(districtData.cases)
      });
    } else {
      setTooltip({
        name: districtName || "Unknown District",
        cases: "No Data",
        risk: { label: "N/A", color: "#334155" }
      });
    }
  };

  const handleGeographyClick = (geo) => {
    const districtName = geo.properties.district || geo.properties.NAME_2 || geo.properties.dist_name;
    const districtData = JHARKHAND_DATA.find(d => 
      d.district.toLowerCase() === (districtName || "").toLowerCase() ||
      (d.districtKey && d.districtKey.toLowerCase() === (districtName || "").toLowerCase())
    );
    if (districtData && onDistrictClick) {
      onDistrictClick(districtData);
    }
  };

  return (
    <div style={{ height: "100%", position: "relative", cursor: "crosshair", overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 9000,
            center: [85.3, 23.8]
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} minZoom={1} maxZoom={4}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const districtName = geo.properties.district || geo.properties.NAME_2 || geo.properties.dist_name;
                  const d = JHARKHAND_DATA.find(item => 
                    item.district.toLowerCase() === (districtName || "").toLowerCase() ||
                    (item.districtKey && item.districtKey.toLowerCase() === (districtName || "").toLowerCase())
                  );
                  const risk = d ? getRiskLevel(d.cases) : { color: "#f1f5f9" }; // slate-100

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => handleMouseEnter(geo)}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => handleGeographyClick(geo)}
                      style={{
                        default: {
                          fill: risk.color,
                          stroke: "#cbd5e1", // slate-300
                          strokeWidth: 1,
                          outline: "none",
                        },
                        hover: {
                          fill: "#cbd5e1", // slate-300
                          stroke: "#fff",
                          strokeWidth: 1,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#e2e8f0", // slate-200
                          stroke: "#fff",
                          strokeWidth: 1,
                          outline: "none",
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip Overlay */}
        {tooltip && (
          <div className="map-tooltip">
            <h4 className="tooltip-title">{tooltip.name}</h4>
            <div>
              <div className="tooltip-row">
                <span>Disease:</span>
                <span className="tooltip-disease">{tooltip.disease || '—'}</span>
              </div>
              <div className="tooltip-row">
                <span>Total Cases:</span>
                <span>{tooltip.cases}</span>
              </div>
              <div className="tooltip-row" style={{ borderTop: "1px solid var(--border-light)", paddingTop: "8px", marginTop: "8px" }}>
                <span>Risk Status:</span>
                <span 
                  style={{ backgroundColor: `${tooltip.risk.color}20`, color: tooltip.risk.color, padding: "2px 8px", borderRadius: "12px", border: `1px solid ${tooltip.risk.color}50` }}
                >
                  {tooltip.risk.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <p style={{ fontSize: "10px", color: "var(--text-soft)", position: "absolute", bottom: "8px", width: "100%", textAlign: "center", fontStyle: "italic" }}>
        Use mouse wheel to zoom. Click and drag to pan.
      </p>
    </div>
  );
};

export default MapChart;
