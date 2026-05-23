import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Verification = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const API_BASE = 'http://localhost:7005';

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lab/pending-verifications`);
      if (res.data.success) {
        setTests(res.data.tests || []);
      }
    } catch (err) {
      console.error("Error fetching pending verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!selectedTest) return;
    try {
      const doctorId = JSON.parse(localStorage.getItem('user'))?.id || 1;
      const res = await axios.post(`${API_BASE}/api/lab/verify-test`, {
        test_result_id: selectedTest.id,
        sample_id: selectedTest.sample_id,
        verified_by: doctorId,
        status: status,
        notes: "Verified via LIS Agent"
      });
      if (res.data.success) {
        alert(`Test ${status} successfully!`);
        setSelectedTest(null);
        fetchPending();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Verifications...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Test Verification</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Verify and approve laboratory results before final reporting</p>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTest ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* List */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>PATIENT / SAMPLE</th>
                <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>TEST</th>
                <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>STATUS</th>
                <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700' }}>{test.sample_id}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{test.patient_name}</div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{test.test_name}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', background: '#fef3c7', color: '#92400e' }}>
                      {test.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => setSelectedTest(test)}
                      style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details */}
        {selectedTest && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Reviewing: {selectedTest.sample_id}</h3>
              <button onClick={() => setSelectedTest(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {selectedTest.results?.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{r.parameter_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Ref: {r.reference_range}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>{r.result_value} <small style={{ fontSize: '10px', fontWeight: '400' }}>{r.unit}</small></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleAction('Verified')}
                style={{ flex: 1, padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Verify Test
              </button>
              <button
                onClick={() => handleAction('Approved')}
                style={{ flex: 1, padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Final Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;
