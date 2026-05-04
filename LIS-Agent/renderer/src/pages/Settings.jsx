import React, { useState } from 'react';

const Settings = () => {
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const languages = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
    { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>App Settings</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>Manage language, localization, and system preferences</p>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Language Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>System Language</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {languages.map(lang => (
              <div 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: language === lang.code ? '#2563eb' : '#f1f5f9',
                  background: language === lang.code ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>{lang.flag}</span>
                <span style={{ fontWeight: '700', color: language === lang.code ? '#1e3a8a' : '#475569' }}>{lang.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Localization Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Date & Time Localization</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#334155' }}>Date Format</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>How dates are displayed across the app</div>
              </div>
              <select 
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '200px', fontWeight: '600' }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#334155' }}>Default Timezone</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Used for timestamps and logs</div>
              </div>
              <select 
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '200px', fontWeight: '600' }}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (GMT)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="Europe/London">London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
