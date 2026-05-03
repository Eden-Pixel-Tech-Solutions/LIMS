import React from 'react';
import { JHARKHAND_DATA, getRiskLevel } from '../../data/disasterMockData';

const DistrictList = () => {
  const sortedDistricts = [...JHARKHAND_DATA].sort((a, b) => b.cases - a.cases);

  return (
    <div className="district-card">
      <div className="district-header">
        <h3>District Risk Monitor</h3>
        <span>Live Feeds</span>
      </div>
      <div className="district-list custom-scrollbar">
        {sortedDistricts.map((d, index) => {
          const risk = getRiskLevel(d.cases);
          return (
            <div key={d.district} className="district-item">
              <div className="district-info">
                <span className="district-rank">{index + 1}.</span>
                <div className="district-details">
                  <p>{d.district}</p>
                  <span>
                    {d.disease} 
                    <span className={d.trend.includes('+') ? 'trend-badge up' : 'trend-badge stable'}>{d.trend}</span>
                  </span>
                </div>
              </div>
              <div className="district-stats">
                <p className="cases">{d.cases}</p>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: `${risk.color}20`, color: risk.color, border: `1px solid ${risk.color}40` }}
                >
                  {risk.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DistrictList;
