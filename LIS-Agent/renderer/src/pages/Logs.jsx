import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://172.16.11.160:7005';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/lab/activity-logs`, {
        params: { search, limit: 100 }
      });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, [search]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Test Done': return { bg: '#f0fdfa', color: '#115e59', border: '#99f6e4' };
      case 'Verified': return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
      case 'Approved': return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Activity Logs</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Complete Audit Trail of Captured Results</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 12px', alignItems: 'center', width: '300px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', marginRight: '8px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search sample, patient or test..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '14px', padding: '8px 0', width: '100%' }}
            />
          </div>
          <button onClick={fetchLogs} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Sample & Patient</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Billed</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Acknowledged</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Run (Result)</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Verified</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>No logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.bill_item_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '800', color: '#2563eb', fontSize: '14px' }}>{log.sample_id || 'NO SAMPLE ID'}</div>
                    <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{log.patient_first_name} {log.patient_last_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Test: {log.test_name}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{new Date(log.billed_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(log.billed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginTop: '4px' }}>By: {log.billed_by_name || 'System'}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {log.current_status !== 'Pending' ? (
                      <>
                        <div style={{ fontWeight: '600', color: '#059669' }}>{new Date(log.status_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>By: {log.acknowledged_by_name || '-'}</div>
                      </>
                    ) : <span style={{ color: '#94a3b8' }}>-</span>}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {log.tested_at ? (
                      <>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{new Date(log.tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>By: {log.technician_name || 'System'}</div>
                      </>
                    ) : <span style={{ color: '#94a3b8' }}>Pending</span>}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {log.verified_at && (log.current_status === 'Verified' || log.current_status === 'Completed') ? (
                      <>
                        <div style={{ fontWeight: '700', color: '#1e40af' }}>{new Date(log.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Dr: {log.verifier_name}</div>
                      </>
                    ) : <span style={{ color: '#94a3b8' }}>-</span>}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
                      background: getStatusStyle(log.current_status).bg, color: getStatusStyle(log.current_status).color,
                      border: `1px solid ${getStatusStyle(log.current_status).border}`
                    }}>
                      {log.current_status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;
