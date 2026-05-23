import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = 'http://localhost:7005';

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lab/approved-reports`);
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (sampleId) => {
    window.open(`${API_BASE}/api/lab/generate-report-pdf/${sampleId}`, '_blank');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Reports...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Approved Lab Reports</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>View and download finalized laboratory reports</p>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>SAMPLE ID</th>
              <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>PATIENT NAME</th>
              <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>TEST NAME</th>
              <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>VERIFIED AT</th>
              <th style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px', fontWeight: '700' }}>{report.sample_id}</td>
                <td style={{ padding: '16px', fontWeight: '600' }}>{report.patient_name}</td>
                <td style={{ padding: '16px' }}>{report.test_name}</td>
                <td style={{ padding: '16px', color: '#64748b' }}>{new Date(report.verified_at).toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleDownload(report.sample_id)}
                      style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      📥 PDF
                    </button>
                    <button
                      onClick={() => handleResend(report)}
                      style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      💬 Resend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const handleResend = async (report) => {
  try {
    const API_BASE = 'http://localhost:7005';
    const doctorId = JSON.parse(localStorage.getItem('user'))?.id || 1;
    await axios.post(`${API_BASE}/api/lab/verify-test`, {
      test_result_id: report.id,
      sample_id: report.sample_id,
      verified_by: doctorId,
      status: 'Approved',
      notes: "Manual Resend via LIS Agent"
    });
    alert("Resend triggered successfully!");
  } catch (err) {
    console.error("Resend error:", err);
    alert("Failed to trigger resend");
  }
};

export default Reports;
