import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MERILIYZERMICRO = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [machineName, setMachineName] = useState('Merilyzer Micro');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('3part')) setMachineName('3-Part Hematology');
    else if (path.includes('5part')) setMachineName('5-Part Hematology');
    else setMachineName('Merilyzer Micro');
  }, [location.pathname]);
  const [currentIdx, setCurrentIdx] = useState(0); // Default to Step 1 (Index 0)
  
  const STEPS = [
    { 
      title: 'Connect the device', 
      label: 'Connect',
      detailsTitle: 'Physical Connection',
      desc: 'Use the provided USB or Serial cable to connect the Merilyzer Micro to your workstation. Ensure the connection is secure at both ends.',
      checklist: ['Identify the correct port on the device', 'Plug in the cable firmly', 'Check if the PC recognizes the device'],
      tip: 'Tip: Use the original cable provided with the device for the most stable connection.',
      image: '../assets/m1.png'
    },
    { 
      title: 'Power on the analyzer', 
      label: 'Power on',
      detailsTitle: 'Initial Startup',
      desc: 'Switch on the power button located at the back of the device. Wait for the status indicator to turn solid green.',
      checklist: ['Locate power switch at rear', 'Wait for internal initialization', 'Verify green status light'],
      tip: 'Tip: Ensure the device is connected to a stable power source or UPS to prevent data loss.',
      image: '../assets/m2.png'
    },
    { 
      title: 'Pair with the software', 
      label: 'Pair',
      detailsTitle: 'Software Sync',
      desc: 'Open the Merilyzer software on your computer and go to Device Management. Click on Scan to find and pair with your analyzer.',
      checklist: ['Open LIS Agent software', 'Navigate to Machine Setup', 'Click Pair and wait for confirmation'],
      tip: 'Tip: If the device isn\'t found, check the COM port settings in the system device manager.',
      image: '../assets/m3.png'
    },
    { 
      title: 'Calibrate the sensors', 
      label: 'Calibrate',
      detailsTitle: 'Sensor Calibration',
      desc: 'Place the device on a flat, stable surface away from direct sunlight. Tap Calibrate in the app and remain still until the progress bar completes.',
      checklist: ['Place device on a flat stable surface', 'Tap Calibrate in the Merilyzer app', 'Stay still for the 30-second sequence'],
      tip: 'Tip: Avoid moving the device during calibration — this ensures accurate baseline readings.',
      image: '../assets/calibration.png'
    },
    { 
      title: 'Analyse the samples', 
      label: 'Analyse',
      detailsTitle: 'Running Tests',
      desc: 'Load the sample tubes into the tray and select the test profile. Press the Start button to begin the automated analysis sequence.',
      checklist: ['Load samples correctly', 'Select the appropriate test menu', 'Monitor real-time progress on screen'],
      tip: 'Tip: Always use fresh samples for the most accurate results.',
      image: '../assets/meril.png'
    }
  ];

  const totalSteps = STEPS.length;
  const progressPct = ((currentIdx + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentIdx < totalSteps - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      navigate('/demos');
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          font-family: 'Inter', sans-serif;
          background-color: #ffffff;
          color: #1e293b;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .app-header {
          background-color: #1b5cb4;
          padding: 20px 40px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
          color: #ffffff;
        }
        .setup-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        .main-title {
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 700px;
          margin: 0 auto;
          width: 100%;
          position: relative;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 2;
          flex: 1;
          cursor: pointer;
        }
        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          transition: all 0.3s ease;
        }
        .step-circle.active {
          background: #1b5cb4;
          border: 2px solid #fff;
        }
        .step-circle.completed {
          background: #fff;
          color: #1b5cb4;
        }
        .step-label-text {
          font-size: 11px;
          font-weight: 500;
          opacity: 0.9;
        }
        .step-line-container {
          position: absolute;
          top: 16px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: rgba(255,255,255,0.2);
          z-index: 1;
        }
        .step-line-fill {
          height: 100%;
          background: #fff;
          transition: width 0.4s ease;
        }
        .content-body {
          backgroundColor: #f8fafc;
          flex: 1;
          padding: 30px 40px;
          display: flex;
          gap: 40px;
          align-items: center;
          overflow-y: auto;
          min-height: 0;
        }
        .image-column {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }
        .image-card {
          background-color: #ffffff;
          width: 100%;
          border-radius: 15px;
          padding: 20px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          max-height: 300px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .step-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background-color: #1b5cb4;
          color: #fff;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .main-img {
          max-width: 100%;
          max-height: 220px;
          object-fit: contain;
        }
        .image-subtext {
          text-align: center;
        }
        .details-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
          min-width: 0;
        }
        .details-title-text {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }
        .details-desc-text {
          font-size: 14px;
          line-height: 1.5;
          color: #64748b;
          margin: 0;
        }
        .checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #334155;
        }
        .check-circle-checked {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1b5cb4;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .tip-box {
          background-color: #f0f7ff;
          color: #1b5cb4;
          padding: 15px;
          border-radius: 10px;
          display: flex;
          gap: 12px;
          font-size: 13px;
          line-height: 1.4;
          border: 1px solid #dbeafe;
        }
        .footer-section {
          background-color: #ffffff;
          padding: 15px 40px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .progress-info {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }
        .nav-buttons {
          display: flex;
          gap: 12px;
        }
        .nav-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          padding: 8px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .btn-next {
          background: #1b5cb4;
          border-color: #1b5cb4;
          color: #ffffff;
        }
        .btn-next:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }
        .bottom-bar {
          height: 3px;
          background: #f1f5f9;
          width: 100%;
          position: relative;
          flex-shrink: 0;
        }
        .bottom-bar-fill {
          height: 100%;
          background-color: #1b5cb4;
          transition: width 0.4s ease;
        }
        .bottom-pct {
          position: absolute;
          right: 20px;
          bottom: 10px;
          font-size: 11px;
          color: #94a3b8;
        }

        /* ── RESPONSIVENESS ── */
        @media (max-height: 700px) {
          .app-header { padding: 15px 30px; }
          .main-title { font-size: 22px; }
          .content-body { padding: 20px 30px; gap: 20px; }
          .image-card { min-height: 150px; }
          .details-title-text { font-size: 18px; }
          .checklist { gap: 6px; }
          .tip-box { padding: 10px; }
        }

        @media (max-width: 1024px) {
          .content-body { padding: 20px 30px; gap: 30px; }
          .main-title { font-size: 24px; }
          .footer-section { padding: 15px 30px; }
        }
        @media (max-width: 768px) {
          .app-container { height: auto; overflow-y: auto; }
          .app-header { padding: 20px; }
          .main-title { font-size: 20px; margin-bottom: 15px; }
          .progress-steps { overflow-x: auto; justify-content: flex-start; gap: 15px; padding-bottom: 5px; }
          .step-item { min-width: 60px; }
          .step-line-container { display: none; }
          .content-body { flex-direction: column; padding: 20px; gap: 20px; align-items: stretch; }
          .image-card { min-height: 200px; max-height: none; }
          .footer-section { flex-direction: column; gap: 15px; padding: 20px; text-align: center; }
          .nav-buttons { width: 100%; justify-content: center; }
          .nav-btn { flex: 1; justify-content: center; }
        }
      `}</style>



      {/* Header Section */}
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="setup-label">Setup Guide for {machineName}</div>
          <button 
            onClick={() => navigate('/demos')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to Demos
          </button>
        </div>
        <h1 className="main-title">{STEPS[currentIdx].title}</h1>
        
        <div className="progress-steps">
          <div className="step-line-container">
            <div className="step-line-fill" style={{width: `${(currentIdx / (totalSteps - 1)) * 100}%`}}></div>
          </div>
          
          {STEPS.map((s, i) => (
            <div key={i} className="step-item" onClick={() => setCurrentIdx(i)}>
              <div className={`step-circle ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'active' : ''}`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <div className="step-label-text">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="content-body">
        <div className="image-column">
          <div className="image-card">
            <div className="step-badge">Step {currentIdx + 1}</div>
            <img src={STEPS[currentIdx].image} className="main-img" alt="Step UI" />
          </div>
          <div className="image-subtext">
            <h3 style={{fontSize: '18px', margin: '0 0 6px 0', fontWeight: '600'}}>{STEPS[currentIdx].title}</h3>
            <p style={{fontSize: '14px', color: '#a0a0a0', margin: '0'}}>Required for accurate results</p>
          </div>
        </div>

        <div className="details-column">
          <h2 className="details-title-text">{STEPS[currentIdx].detailsTitle}</h2>
          <p className="details-desc-text">
            {STEPS[currentIdx].desc}
          </p>

          <ul className="checklist">
            {STEPS[currentIdx].checklist.map((item, i) => (
              <li key={i} className="check-item">
                <div className="check-circle-checked">✓</div> {item}
              </li>
            ))}
          </ul>

          <div className="tip-box">
            <div style={{fontSize: '20px', fontWeight: '700'}}>ⓘ</div>
            <div className="tip-text">
              {STEPS[currentIdx].tip}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="nav-buttons">
          <button className="nav-btn" onClick={handlePrev} disabled={currentIdx === 0}>← Prev</button>
          <button 
            className="nav-btn btn-next" 
            onClick={handleNext}
            style={{
              backgroundColor: currentIdx === totalSteps - 1 ? '#22c55e' : '',
              borderColor: currentIdx === totalSteps - 1 ? '#22c55e' : ''
            }}
          >
            {currentIdx === totalSteps - 1 ? 'Complete ✓' : 'Next →'}
          </button>
        </div>
      </footer>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="bottom-bar-fill" style={{width: `${progressPct}%`}}></div>
      </div>
    </div>
  );
};

export default MERILIYZERMICRO;
