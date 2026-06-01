import { useState, useEffect } from 'react';
import '../../assets/CSS/LabVerification.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const LabVerification = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest]   = useState(null);
  const [approveTest, setApproveTest]     = useState(null); // separate state for approve modal
  const [verificationNote, setVerificationNote] = useState('');
  const [approveNote, setApproveNote]     = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');

  useEffect(() => {
    fetchPendingVerifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE}/api/lab/pending-verifications${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTests(data.tests || []);
      } else {
        setError(data.message || 'Failed to load tests');
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Connection error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (testId, sampleId) => {
    try {
      const doctorId = JSON.parse(localStorage.getItem('user'))?.id || 1;

      const res = await fetch(`${API_BASE}/api/lab/verify-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_result_id: testId,
          sample_id: sampleId,
          verified_by: doctorId,
          notes: verificationNote,
          status: 'Verified'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Test verified successfully!');
        setSelectedTest(null);
        setVerificationNote('');
        fetchPendingVerifications();
      } else {
        alert('Failed to verify test');
      }
    } catch (error) {
      console.error('Error verifying test:', error);
      alert('Error verifying test');
    }
  };

  const handleApprove = async () => {
    if (!approveTest) return;
    const doctorId = localStorage.getItem('user_id') || JSON.parse(localStorage.getItem('user') || '{}')?.id || 1;
    try {
      const res = await fetch(`${API_BASE}/api/lab/verify-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_result_id: approveTest.id,
          sample_id: approveTest.sample_id,
          verified_by: doctorId,
          status: 'Approved',
          notes: approveNote
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Test approved successfully!');
        setApproveTest(null);
        setApproveNote('');
        fetchPendingVerifications();
      } else {
        alert('Approval failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving test:', error);
      alert('Network error while approving. Please try again.');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Test Done': '#06b6d4',
      'Completed': '#22c55e',
      'Verified': '#8b5cf6',
      'Approved': '#22c55e'
    };
    return (
      <span className="status-badge" style={{ background: colors[status] || '#6b7280' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="lab-verification-page">
      <div className="verification-header">
        <h1>Lab Head Doctor - Test Verification</h1>
        <div className="filter-section">
          <label>Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Pending</option>
            <option value="Test Done">Test Done (Pending Verification)</option>
            <option value="Verified">Verified (Pending Approval)</option>
            <option value="Approved">Approved</option>
          </select>
          <button className="refresh-btn" onClick={fetchPendingVerifications}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tests...</div>
      ) : error ? (
        <div className="error-message" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
      ) : (
        <div className="tests-table-container">
          <table className="tests-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Patient Name</th>
                <th>Test Name</th>
                <th>Machine No</th>
                <th>Tested At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No tests pending verification</td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className={`status-${test.status?.toLowerCase().replace(' ', '-')}`}>
                    <td className="sample-id">{test.sample_id}</td>
                    <td>{test.patient_name}</td>
                    <td>{test.test_name}</td>
                    <td>{test.machine_no || 'N/A'}</td>
                    <td>{formatDateTime(test.tested_at)}</td>
                    <td>{getStatusBadge(test.status)}</td>
                    <td>
                      {(test.status === 'Test Done' || test.status === 'Completed') && (
                        <button
                          className="verify-btn"
                          onClick={() => setSelectedTest(test)}
                        >
                          ✓ Verify
                        </button>
                      )}
                      {test.status === 'Verified' && (
                        <button
                          className="approve-btn"
                          onClick={() => { setApproveTest(test); setApproveNote(''); }}
                        >
                          ✓ Approve
                        </button>
                      )}
                      {test.status === 'Approved' && (
                        <span className="approved-text">Approved ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Modal */}
      {approveTest && (
        <div className="modal-overlay" onClick={() => setApproveTest(null)}>
          <div className="verification-modal" onClick={e => e.stopPropagation()}>
            <h2>Approve Test Results</h2>

            <div className="test-details">
              <p><strong>Sample ID:</strong> {approveTest.sample_id}</p>
              <p><strong>Patient:</strong> {approveTest.patient_name}</p>
              <p><strong>Test:</strong> {approveTest.test_name}</p>
              <p><strong>Machine:</strong> {approveTest.machine_no || 'N/A'}</p>
              <p><strong>Verified At:</strong> {formatDateTime(approveTest.verified_at)}</p>
            </div>

            <div className="results-section">
              <h3>Test Results</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {approveTest.results?.map((result, idx) => (
                    <tr key={idx} className={`flag-${result.result_flag}`}>
                      <td>{result.parameter_name}</td>
                      <td className="result-value">{result.result_value}</td>
                      <td>{result.unit}</td>
                      <td>{result.reference_range}</td>
                      <td>
                        <span className={`flag-badge ${result.result_flag}`}>
                          {result.result_flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="verification-notes">
              <label>Approval Notes (Optional):</label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setApproveTest(null)}>
                Cancel
              </button>
              <button
                className="approve-btn"
                style={{ padding: '10px 24px', fontSize: '15px' }}
                onClick={handleApprove}
              >
                ✓ Approve & Release Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedTest && (
        <div className="modal-overlay" onClick={() => setSelectedTest(null)}>
          <div className="verification-modal" onClick={e => e.stopPropagation()}>
            <h2>Verify Test Results</h2>

            <div className="test-details">
              <p><strong>Sample ID:</strong> {selectedTest.sample_id}</p>
              <p><strong>Patient:</strong> {selectedTest.patient_name}</p>
              <p><strong>Test:</strong> {selectedTest.test_name}</p>
              <p><strong>Machine:</strong> {selectedTest.machine_no || 'N/A'}</p>
              <p><strong>Tested At:</strong> {formatDateTime(selectedTest.tested_at)}</p>
            </div>

            <div className="results-section">
              <h3>Test Results</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTest.results?.map((result, idx) => (
                    <tr key={idx} className={`flag-${result.result_flag}`}>
                      <td>{result.parameter_name}</td>
                      <td className="result-value">{result.result_value}</td>
                      <td>{result.unit}</td>
                      <td>{result.reference_range}</td>
                      <td>
                        <span className={`flag-badge ${result.result_flag}`}>
                          {result.result_flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="verification-notes">
              <label>Verification Notes (Optional):</label>
              <textarea
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="Add any notes about this verification..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setSelectedTest(null)}>
                Cancel
              </button>
              <button className="verify-submit-btn" onClick={() => handleVerify(selectedTest.id, selectedTest.sample_id)}>
                ✓ Mark as Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabVerification;
