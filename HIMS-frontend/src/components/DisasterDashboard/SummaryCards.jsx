import React from 'react';
import { Activity, AlertTriangle, Thermometer, ShieldCheck } from 'lucide-react';
import { JHARKHAND_DATA, getRiskLevel } from '../../data/disasterMockData';

const SummaryCards = () => {
  const totalCases = JHARKHAND_DATA.reduce((sum, item) => sum + item.cases, 0);
  const highRiskCount = JHARKHAND_DATA.filter(d => getRiskLevel(d.cases).label === "HIGH").length;
  
  const diseaseCounts = JHARKHAND_DATA.reduce((acc, curr) => {
    acc[curr.disease] = (acc[curr.disease] || 0) + curr.cases;
    return acc;
  }, {});
  
  const mostAffectedDisease = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0][0];
  const activeDistricts = JHARKHAND_DATA.length;

  const cards = [
    { label: 'Total Cases', value: totalCases, icon: Activity, trend: '+12.5%', up: true },
    { label: 'High Risk Zones', value: highRiskCount, icon: AlertTriangle, trend: '+2 districts', up: true },
    { label: 'Primary Pathogen', value: mostAffectedDisease, icon: Thermometer, trend: 'Increasing', up: true },
    { label: 'Monitored Districts', value: activeDistricts, icon: ShieldCheck, trend: 'Stable', up: false },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.label} className="summary-card">
          <div className="summary-header">
            <card.icon className="summary-icon" size={20} strokeWidth={1.5} />
            <div className={`trend-badge ${card.up ? 'up' : 'stable'}`}>
              {card.up ? '↑' : ''} {card.trend}
            </div>
          </div>
          <div className="summary-body">
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
