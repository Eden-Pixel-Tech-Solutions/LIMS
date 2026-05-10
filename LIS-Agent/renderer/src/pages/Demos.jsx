import React from 'react';
import { useNavigate } from 'react-router-dom';

const Demos = () => {
  const navigate = useNavigate();

  const demoCards = [
    {
      id: '3part',
      title: '3-Part Hematology',
      subtitle: '3-Part Differential Demo',
      desc: 'Interactive guide for basic blood cell counting and analysis.',
      icon: '🔬',
      color: '#0ea5e9',
      path: '/demos/3part'
    },
    {
      id: '5part',
      title: '5-Part Hematology',
      subtitle: 'Advanced 5-Part Demo',
      desc: 'Detailed walkthrough for complex white blood cell differentiation.',
      icon: '🧬',
      color: '#8b5cf6',
      path: '/demos/5part'
    },
    {
      id: 'micro',
      title: 'Merilyzer Micro',
      subtitle: 'Chemistry Analyzer Demo',
      desc: 'Complete setup and analysis guide for the Micro series.',
      icon: '🧪',
      color: '#1b5cb4',
      path: '/demos/micro'
    }
  ];

  return (
    <div className="demos-container">
      <style>{`
        .demos-container {
          padding: 40px;
          background-color: #f8fafc;
          min-height: 100%;
          font-family: 'Inter', sans-serif;
        }
        .demos-header {
          margin-bottom: 40px;
        }
        .demos-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .demos-header p {
          color: #64748b;
          margin: 8px 0 0 0;
          font-size: 16px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1200px;
        }
        .demo-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .demo-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: transparent;
        }
        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          background: #f1f5f9;
          transition: all 0.3s;
        }
        .demo-card:hover .card-icon {
          background: var(--card-color);
          color: white;
        }
        .card-content h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        .card-content h3 {
          font-size: 13px;
          font-weight: 600;
          color: var(--card-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }
        .card-content p {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        .card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s;
        }
        .demo-card:hover .card-footer {
          opacity: 1;
          transform: translateX(0);
        }
        .card-bg-glow {
          position: absolute;
          top: -50px;
          right: -50px;
          width: 150px;
          height: 150px;
          background: var(--card-color);
          filter: blur(80px);
          opacity: 0.05;
          transition: opacity 0.3s;
        }
        .demo-card:hover .card-bg-glow {
          opacity: 0.15;
        }
      `}</style>

      <div className="demos-header">
        <h1>Product Demos</h1>
        <p>Select a device to start the interactive walkthrough</p>
      </div>

      <div className="cards-grid">
        {demoCards.map((card) => (
          <div 
            key={card.id} 
            className="demo-card"
            style={{ '--card-color': card.color }}
            onClick={() => navigate(card.path)}
          >
            <div className="card-bg-glow"></div>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h3>{card.subtitle}</h3>
              <h2>{card.title}</h2>
              <p>{card.desc}</p>
            </div>
            <div className="card-footer">
              Explore Demo <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Demos;
