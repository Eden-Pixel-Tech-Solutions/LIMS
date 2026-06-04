import { useState, useEffect } from 'react';
import merilLogo from '../assets/meril.png';

const JHARKHAND_LOGO = './jharkhand-logo.png';

export default function SetupScreen({ onConfigSaved }) {
  const [labs,     setLabs]     = useState([]);
  const [labId,    setLabId]    = useState('');
  const [labName,  setLabName]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    window.kioskAPI.fetchLabs().then(res => {
      if (res?.success && res.labs?.length) {
        setLabs(res.labs);
      } else {
        setError('Could not load labs. Check your internet connection and try again.');
      }
      setLoading(false);
    });
  }, []);

  const handleSelect = (e) => {
    const selected = labs.find(l => String(l.id) === e.target.value);
    if (selected) { setLabId(String(selected.id)); setLabName(selected.name); }
    else { setLabId(''); setLabName(''); }
    setError('');
  };

  const handleStart = async () => {
    if (!labId) { setError('Please select a laboratory first.'); return; }
    setSaving(true);
    const config = { labId, labName };
    await window.kioskAPI.saveConfig(config);
    onConfigSaved(config);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(145deg, #0a2a6e 0%, #1648c2 60%, #0ea5e9 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Roboto', sans-serif",
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background circle accents */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%',
        background:'rgba(255,255,255,.04)', top:-200, right:-200, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
        background:'rgba(255,255,255,.04)', bottom:-100, left:-100, pointerEvents:'none' }} />

      {/* Logo row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        width:'100%', maxWidth:640, marginBottom:48 }}>
        <img src={JHARKHAND_LOGO} alt="Jharkhand"
          style={{ height:70, objectFit:'contain', filter:'brightness(0) invert(1)' }}
          onError={e => { e.target.style.display='none'; }} />
        <img src={merilLogo} alt="Meril"
          style={{ height:40, objectFit:'contain', filter:'brightness(0) invert(1)' }} />
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,.97)',
        borderRadius: 24,
        padding: '48px 56px',
        width: '100%',
        maxWidth: 640,
        boxShadow: '0 32px 80px rgba(0,0,0,.35)',
      }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:4, color:'#3b82f6',
            textTransform:'uppercase', marginBottom:10 }}>
            FIRST TIME SETUP
          </div>
          <h1 style={{ fontSize:32, fontWeight:900, color:'#0a2a6e', margin:0, lineHeight:1.1 }}>
            Select Your Laboratory
          </h1>
          <p style={{ marginTop:10, fontSize:16, color:'#64748b' }}>
            This screen will be saved and never shown again
          </p>
        </div>

        {/* Lab selector */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ display:'inline-block', width:36, height:36, borderRadius:'50%',
              border:'4px solid #dbeafe', borderTopColor:'#1648c2',
              animation:'spin .8s linear infinite' }} />
            <div style={{ marginTop:12, color:'#64748b', fontSize:14 }}>Loading laboratories…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            <label style={{ display:'block', fontSize:13, fontWeight:700,
              color:'#374151', marginBottom:10, letterSpacing:'0.5px' }}>
              LABORATORY NAME
            </label>
            <select
              value={labId}
              onChange={handleSelect}
              style={{
                width: '100%',
                padding: '18px 20px',
                fontSize: 18,
                fontWeight: 600,
                color: labId ? '#0a2a6e' : '#94a3b8',
                border: `2px solid ${error ? '#ef4444' : labId ? '#1648c2' : '#e2e8f0'}`,
                borderRadius: 12,
                background: '#f8fafc',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%231648c2' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: 48,
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color .2s',
              }}
            >
              <option value="">— Choose a laboratory —</option>
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            {labId && (
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6,
                color:'#16a34a', fontSize:13, fontWeight:600 }}>
                <span>✓</span> {labName} selected
              </div>
            )}

            {error && (
              <div style={{ marginTop:10, color:'#ef4444', fontSize:13, fontWeight:600 }}>
                ⚠ {error}
              </div>
            )}

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!labId || saving}
              style={{
                marginTop: 32,
                width: '100%',
                padding: '20px',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                background: !labId || saving
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #1648c2, #0ea5e9)',
                border: 'none',
                borderRadius: 14,
                cursor: !labId || saving ? 'not-allowed' : 'pointer',
                boxShadow: labId && !saving ? '0 8px 24px rgba(22,72,194,.4)' : 'none',
                transition: 'all .2s',
                letterSpacing: '0.5px',
              }}
            >
              {saving ? '⏳ Saving…' : '🚀 Start Queue Display'}
            </button>
          </>
        )}
      </div>

      {/* Footer note */}
      <p style={{ marginTop:28, color:'rgba(255,255,255,.5)', fontSize:13, textAlign:'center' }}>
        Press <strong style={{ color:'rgba(255,255,255,.8)' }}>ESC × 5</strong> at any time to exit the kiosk
      </p>
    </div>
  );
}
