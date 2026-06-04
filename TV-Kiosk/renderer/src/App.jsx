import { useState, useEffect } from 'react';
import SetupScreen from './pages/SetupScreen';
import LabTVMode   from './pages/LabTVMode';

export default function App() {
  const [config,  setConfig]  = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.kioskAPI.getConfig().then(cfg => {
      setConfig(cfg);   // null if not configured, object if configured
      setLoading(false);
    });
  }, []);

  const handleConfigSaved = (cfg) => setConfig(cfg);

  if (loading) return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a2a6e', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '5px solid rgba(255,255,255,.2)',
        borderTopColor: '#fff',
        animation: 'spin .8s linear infinite',
      }} />
      <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, fontWeight: 600 }}>
        Loading…
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!config) return <SetupScreen onConfigSaved={handleConfigSaved} />;

  return <LabTVMode labId={config.labId} labName={config.labName} />;
}
