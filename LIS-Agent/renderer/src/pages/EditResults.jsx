import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditResults = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [editedResults, setEditedResults] = useState([]);

  const API_BASE = 'http://localhost:7005';

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/lab/pending-verifications?status=all`);
      if (res.data.success) {
        setTests(res.data.tests.filter(t => t.status === 'Test Done' || t.status === 'Verified' || t.status === 'Completed'));
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (test) => {
    setSelectedTest(test);
    // clone the results array so we can edit it safely
    setEditedResults(JSON.parse(JSON.stringify(test.results)));
  };

  const handleResultChange = (index, value) => {
    const newResults = [...editedResults];
    newResults[index].result_value = value;
    setEditedResults(newResults);
  };

  const handleSaveEdits = async () => {
    if (!selectedTest) return;
    try {
      // Fetch the bill_item_id using sample_id if needed, but our save API might need bill_item_id or just sample_id.
      // The save API works with just sample_id if it can look up bill_item_id.
      const payload = {
        sample_id: selectedTest.sample_id,
        machine_no: selectedTest.machine_no,
        test_name: selectedTest.test_name,
        results: editedResults
      };
      
      const res = await axios.post(`${API_BASE}/api/lab/save-test-results`, payload);
      if (res.data.success) {
        alert("Results updated successfully!");
        setSelectedTest(null);
        fetchTests();
      }
    } catch (err) {
      console.error("Error saving edited results:", err);
      alert("Failed to save edits.");
    }
  };

  const filteredTests = tests.filter(t => 
    t.sample_id.toLowerCase().includes(search.toLowerCase()) || 
    t.patient_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Edit Results</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Modify recorded test results before final approval</p>
        </div>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#64748b', marginRight: '8px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search sample ID or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '14px', width: '250px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTest ? '1fr 1fr' : '1fr', gap: '24px' }}>
        
        {/* Left Column: List of Tests */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Sample ID</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Patient</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Test</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
              ) : filteredTests.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No editable results found.</td></tr>
              ) : filteredTests.map(test => (
                <tr key={test.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedTest?.id === test.id ? '#eff6ff' : 'transparent' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '800' }}>{test.sample_id}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '700' }}>{test.patient_name}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '600' }}>{test.test_name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                      {test.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button 
                      onClick={() => handleEditClick(test)}
                      style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Editor */}
        {selectedTest && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800' }}>Editing Results</h2>
                <div style={{ color: '#64748b', fontSize: '14px' }}>{selectedTest.patient_name} ({selectedTest.sample_id}) - {selectedTest.test_name}</div>
              </div>
              <button onClick={() => setSelectedTest(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {editedResults.map((res, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>
                    {res.parameter_name || res.test_name} 
                    {res.flag && res.flag !== 'N' && <span style={{ marginLeft: '8px', color: res.flag === 'H' ? '#ef4444' : '#3b82f6' }}>({res.flag})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="text"
                      value={res.result_value}
                      onChange={(e) => handleResultChange(i, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '15px',
                        width: '100px',
                        textAlign: 'right',
                        outline: 'none'
                      }}
                    />
                    <span style={{ color: '#64748b', width: '60px', fontSize: '14px' }}>{res.unit}</span>
                  </div>
                </div>
              ))}
              {editedResults.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No parameters recorded for this test.</div>
              )}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleSaveEdits}
                style={{ flex: 1, padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '16px' }}
              >
                Save Changes
              </button>
              <button 
                onClick={() => setSelectedTest(null)}
                style={{ padding: '16px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EditResults;
