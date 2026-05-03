import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = 'http://localhost:7005';

export default function Dashboard() {
  const [worklist, setWorklist] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [machineStatus, setMachineStatus] = useState("Connected");
  const [executingTest, setExecutingTest] = useState(null); // { ...item, parameters, results: { paramId: value } }
  
  const navigate = useNavigate();

  useEffect(() => {
    loadConfigAndWorklist();

    const cleanup = window.electronAPI.onTestCompleted((data) => {
      console.log("Captured parameter result:", data);
      setExecutingTest(prev => {
        if (!prev) return null;
        const param = prev.parameters.find(p => 
          p.machine_parameter_code === data.testCode?.toString() ||
          p.parameter_name.toUpperCase().includes(data.testName.toUpperCase())
        );
        if (param) {
          return { 
            ...prev, 
            results: { ...prev.results, [param.id]: data.result },
            machineMeta: {
              ...prev.machineMeta,
              [param.id]: { unit: data.unit, range: data.referenceRange }
            }
          };
        }
        return prev;
      });
    });

    const interval = setInterval(fetchWorklist, 30000);
    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
    };
  }, []);

  const loadConfigAndWorklist = async () => {
    try {
      const savedConfig = await window.electronAPI.getConfig();
      if (!savedConfig) { navigate("/setup"); return; }
      setConfig(savedConfig);
      await fetchWorklist(savedConfig.labId);
    } catch (err) {
      console.error("Config load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorklist = async (labId) => {
    const branch_id = localStorage.getItem('branch_id');
    const role_level = localStorage.getItem('role_level') || 'Branch';
    const id = labId || (config && config.labId) || branch_id;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/api/lab/worklist?branch_id=${id}&role_level=${role_level}`);
      if (res.data.success) {
        const filtered = (res.data.worklist || []).filter(item => 
          item.status === 'Pending' || item.status === 'Collected' || item.status === 'In Progress'
        );
        setWorklist(filtered);
      }
    } catch (err) {
      console.error("Worklist fetch error:", err);
    }
  };

  const handleAcknowledge = async (item) => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const resId = await axios.post(`${API_BASE}/api/lab/generate-sample-id`, { date: dateStr });
      if (!resId.data.success) throw new Error("Failed to generate ID");
      const sampleId = resId.data.sampleId;
      const resAck = await axios.post(`${API_BASE}/api/lab/acknowledge-test`, {
        bill_item_id: item.bill_item_id,
        sample_id: sampleId,
        status: 'Collected'
      });
      if (resAck.data.success) fetchWorklist();
    } catch (err) {
      console.error("Acknowledgment error:", err);
      alert("Failed to acknowledge sample");
    }
  };

  const handleExecuteTest = async (item) => {
    try {
      setLoading(true);
      const resParams = await axios.get(`${API_BASE}/api/lab/tests/${item.test_id}`);
      const parameters = resParams.data.parameters || [];
      await axios.post(`${API_BASE}/api/lab/update-test-status`, {
        bill_item_id: item.bill_item_id,
        status: 'In Progress'
      });
      const success = await window.electronAPI.startListening({ ...item, parameters });
      if (success) {
        setMachineStatus("Listening...");
        setExecutingTest({ ...item, parameters, results: {} }); 
        fetchWorklist();
      } else {
        alert("Failed to connect to analyzer. Check COM Port.");
      }
    } catch (err) {
      console.error("Execute error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!executingTest) return;
    try {
      const resultsArray = executingTest.parameters.map(p => ({
        parameter_name: p.parameter_name,
        result_value: executingTest.results[p.id] || "0",
        unit: executingTest.machineMeta?.[p.id]?.unit || p.parameter_unit,
        reference_range: executingTest.machineMeta?.[p.id]?.range || (p.min_value && p.max_value ? `${p.min_value} - ${p.max_value}` : "")
      }));
      await axios.post(`${API_BASE}/api/lab/save-test-results`, {
        bill_item_id: executingTest.bill_item_id,
        sample_id: executingTest.sample_id,
        machine_no: config.port,
        test_id: executingTest.test_id,
        test_name: executingTest.test_name,
        results: resultsArray,
        status: 'Completed'
      });
      await window.electronAPI.stopListening();
      alert("Full report submitted successfully!");
      setExecutingTest(null);
      setMachineStatus("Connected");
      fetchWorklist();
    } catch (err) {
      console.error("Final submit error:", err);
      alert("Failed to submit final report");
    }
  };

  if (loading && !executingTest) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading LIS Agent Dashboard...</div>;

  return (
    <div className="dashboard-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ 
        padding: '16px 24px', background: '#1e293b', color: 'white', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#334155', borderRadius: '8px' }}>🧪</div>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>Meril LIS Agent</h2>
            <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>Facility: {config?.labName}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Machine Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: machineStatus === 'Listening...' ? '#fbbf24' : '#4ade80' }}>
              <span style={{ width: '8px', height: '8px', background: machineStatus === 'Listening...' ? '#fbbf24' : '#4ade80', borderRadius: '50%' }}></span>
              {machineStatus}
            </div>
          </div>
          <button 
            onClick={() => navigate('/setup')}
            style={{ 
              padding: '8px 16px', background: '#334155', border: '1px solid #475569', 
              color: 'white', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' 
            }}
          >
            ⚙️ Configuration
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px', background: '#f8fafc', overflowY: 'auto', position: 'relative' }}>
        
        {/* Execution Modal / Overlay */}
        {executingTest && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(255,255,255,0.9)', zIndex: 10, padding: '40px',
            display: 'flex', justifyContent: 'center'
          }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Executing: {executingTest.test_name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Patient: {executingTest.patient_name} | Sample: {executingTest.sample_id}</p>
                </div>
                <button 
                  onClick={() => { 
                    setExecutingTest(null); 
                    setMachineStatus("Connected"); 
                    window.electronAPI.stopListening();
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                >✕</button>
              </div>

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {executingTest.parameters.map(param => (
                    <div key={param.id} style={{ 
                      padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                      background: executingTest.results[param.id] ? '#f0fdf4' : 'white',
                      borderColor: executingTest.results[param.id] ? '#86efac' : '#e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                          {param.parameter_name} 
                          <small style={{ opacity: 0.5, marginLeft: '6px', fontSize: '10px' }}>ID: {param.machine_parameter_code}</small>
                        </span>
                        {executingTest.results[param.id] && <span style={{ color: '#16a34a', fontSize: '12px' }}>✓ Captured</span>}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: executingTest.results[param.id] ? '#16a34a' : '#cbd5e1' }}>
                        {executingTest.results[param.id] || "—"} 
                        <small style={{ fontSize: '12px', fontWeight: '400', marginLeft: '4px', color: '#94a3b8' }}>
                          {executingTest.machineMeta?.[param.id]?.unit || param.parameter_unit}
                        </small>
                      </div>
                      {executingTest.machineMeta?.[param.id]?.range && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Ref Range: {executingTest.machineMeta[param.id].range}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                  <span className="pulse" style={{ width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%' }}></span>
                  Waiting for machine data...
                </div>
                <button 
                  onClick={handleFinalSubmit}
                  style={{ padding: '12px 24px', background: '#1e88e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Submit Final Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Machine Info Bar */}
        <div style={{ 
          background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', 
          border: '1px solid #e2e8f0', display: 'flex', gap: '40px' 
        }}>
          <div>
            <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Active Analyzer</small>
            <div style={{ fontWeight: '700', color: '#1e293b' }}>{config?.analyzer_name} ({config?.model})</div>
          </div>
          <div>
            <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Connection</small>
            <div style={{ fontWeight: '700', color: '#1e293b' }}>{config?.port} @ {config?.baud} bps</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <button 
              onClick={() => fetchWorklist()}
              style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#1e293b', fontWeight: '600', cursor: 'pointer' }}
            >
              ↻ Sync Worklist
            </button>
          </div>
        </div>

        {/* Worklist Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Analyzer Worklist</h3>
            <span style={{ padding: '4px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '100px', fontSize: '12px', fontWeight: '600' }}>
              {worklist.length} Pending Tests
            </span>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Sample ID</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Patient Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Test Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {worklist.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pending tests for this lab.</td>
                  </tr>
                ) : (
                  worklist.map((item, index) => (
                    <tr key={index} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>{item.sample_id}</code>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1e293b' }}>{item.patient_name}</td>
                      <td style={{ padding: '16px 20px', color: '#334155' }}>{item.test_name}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                          background: item.status === 'Pending' ? '#f59e0b15' : item.status === 'In Progress' ? '#f59e0b20' : '#3b82f620',
                          color: item.status === 'Pending' ? '#b45309' : item.status === 'In Progress' ? '#d97706' : '#2563eb'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {item.status === 'Pending' ? (
                          <button onClick={() => handleAcknowledge(item)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✓ Acknowledge</button>
                        ) : (
                          <button onClick={() => handleExecuteTest(item)} style={{ padding: '6px 12px', background: '#1e88e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Execute Test</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar */}
      <footer style={{ padding: '12px 24px', background: 'white', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
        Active Machine: {config?.analyzer_name} | Protocol: Meril CliniQuant Binary
      </footer>

      <style>{`
        .pulse { animation: pulse-animation 2s infinite; }
        @keyframes pulse-animation { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}