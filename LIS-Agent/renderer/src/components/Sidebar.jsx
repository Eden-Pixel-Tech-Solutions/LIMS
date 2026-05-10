import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfigured, setIsConfigured] = React.useState(false);

  React.useEffect(() => {
    window.electronAPI.getConfig().then(config => {
      if (config && config.lab_id) {
        setIsConfigured(true);
      }
    }).catch(err => console.error("Sidebar config check error:", err));
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Worklist', path: '/worklist', icon: '📋' },
    { name: 'Sample List', path: '/sample-list', icon: '🧪' },
    { name: 'Activity Logs', path: '/logs', icon: '📝' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Machine Setup', path: '/setup', icon: '🛠️' },
    { name: 'Demos', path: '/demos', icon: '📺' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      background: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #1e293b'
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#38bdf8' }}>MERIL LIS</h2>
        <p style={{ fontSize: '10px', margin: '4px 0 0', opacity: 0.6, letterSpacing: '1px' }}>SERIAL AGENT v1.0</p>
      </div>

      <nav style={{ flex: 1, padding: '16px' }}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '4px',
              transition: 'all 0.2s',
              background: location.pathname === item.path ? '#1e293b' : 'transparent',
              color: location.pathname === item.path ? '#38bdf8' : '#94a3b8'
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.name}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
