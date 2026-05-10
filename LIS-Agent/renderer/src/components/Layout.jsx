import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      const removeStatus = window.electronAPI.onDeviceStatus((status) => {
        setToast(status);
        setTimeout(() => setToast(null), 5000);
      });

      const removeComplete = window.electronAPI.onPanelComplete((data) => {
        setAlert(data);
      });

      return () => {
        removeStatus();
        removeComplete();
      };
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f8fafc' }}>
        {children}
      </main>

      {/* Test Completion Alert (Modal) */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🧪</div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Test Completed!</h2>
            <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '32px' }}>
              Results for <strong>{alert.patientName || alert.sampleId}</strong> have been synchronized to cloud.
            </p>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Analyzer</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{alert.machine}</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Parameters Captured</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{alert.count} tests</div>
            </div>

            <button 
              onClick={() => setAlert(null)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Connection Toast */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          padding: '16px 24px',
          backgroundColor: toast.status === 'Connected' ? '#10b981' : '#ef4444',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ fontSize: '20px' }}>{toast.status === 'Connected' ? '✅' : '❌'}</div>
          <div>
            <div style={{ fontWeight: 'bold' }}>Device {toast.status}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{toast.model} on {toast.port}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
