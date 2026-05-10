import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      const removeStatus = window.electronAPI.onDeviceStatus((status) => {
        setToast(status);
        setTimeout(() => setToast(null), 5000);
      });

        return () => {
          removeStatus();
        };
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f8fafc' }}>
        {children}
      </main>



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
