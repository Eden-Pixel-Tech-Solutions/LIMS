import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JsBarcode from 'jsbarcode';

const Worklist = () => {
  const [worklist, setWorklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [printLabel, setPrintLabel] = useState(null);
  const [machines, setMachines] = useState([]);
  const [showAnalyzerPicker, setShowAnalyzerPicker] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [currentMachine, setCurrentMachine] = useState(null);
  const [incomingResults, setIncomingResults] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isFetchingParams, setIsFetchingParams] = useState(false);
  const barcodeRef = useRef(null);

  const API_BASE = 'http://localhost:7005';

  useEffect(() => {
    fetchWorklist();
    fetchMachines();
    const interval = setInterval(fetchWorklist, 30000);
    return () => clearInterval(interval);
  }, [search, selectedBranch, statusFilter, departmentFilter]);

  useEffect(() => {
    if (printLabel && barcodeRef.current) {
      JsBarcode(barcodeRef.current, printLabel.sampleId, {
        format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 14, margin: 10
      });
    }
  }, [printLabel]);

  useEffect(() => {
    const cleanup = window.electronAPI.onTestCompleted((data) => {
      if (showProcessModal) {
        setIncomingResults(prev => [...prev, data]);
      }
    });
    return cleanup;
  }, [showProcessModal]);

  const fetchWorklist = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lab/worklist`, {
        params: {
          department: departmentFilter,
          branch_id: selectedBranch,
          role_level: 'Branch',
          search: search,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      if (res.data.success) setWorklist(res.data.worklist || []);
    } catch (err) { console.error("Error fetching worklist:", err); }
    finally { setLoading(false); }
  };

  const fetchMachines = async () => {
    const configs = await window.electronAPI.getConfig();
    setMachines(Array.isArray(configs) ? configs : []);
  };

  const handleAcknowledge = async (item) => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const resId = await axios.post(`${API_BASE}/api/lab/generate-sample-id`, { date: dateStr });
      if (resId.data.success) {
        const { sampleId, shortId } = resId.data;
        const resAck = await axios.post(`${API_BASE}/api/lab/acknowledge-test`, {
          bill_item_id: item.bill_item_id,
          sample_id: sampleId,
          short_id: shortId,
          status: 'Collected'
        });
        if (resAck.data.success) {
          setPrintLabel({ sampleId, shortId, patientName: item.patient_name, testName: item.test_name, sampleType: item.sample_type });
          fetchWorklist();
        }
      }
    } catch (err) { console.error("Acknowledge error:", err); }
  };

  const handleRunTestRequest = (item) => {
    if (machines.length === 0) return alert("Please configure an analyzer first.");
    setActiveItem(item);
    if (machines.length === 1) {
      initiateProcessing(item, machines[0]);
    } else {
      setShowAnalyzerPicker(true);
    }
  };

  const initiateProcessing = async (item, machine) => {
    setCurrentMachine(machine);
    setActiveItem(item);
    setShowAnalyzerPicker(false);
    setShowProcessModal(true);
    setIncomingResults([]);
    setIsFetchingParams(true);

    try {
      // 1. FETCH MACHINE PROTOCOL FIRST
      const protocolRes = await axios.get(`${API_BASE}/api/lab/machine-protocol/${machine.model}`);
      const protocol = protocolRes.data.success ? protocolRes.data.protocol : null;

      // 2. FETCH TEST PARAMETERS FROM CLOUD
      const res = await axios.get(`${API_BASE}/api/lab/tests/${item.test_id}`);
      if (res.data.success && res.data.parameters) {

        // 3. INTELLIGENT MAPPING: 
        // Match Cloud Parameter Name against Machine Protocol IDs
        const mappedParams = res.data.parameters.map(p => {
          let machineId = null;

          if (protocol && protocol.frame_structure["2"] && protocol.frame_structure["2"].tests) {
            // Try matching by name (case-insensitive)
            const match = protocol.frame_structure["2"].tests.find(
              mt => mt.name.toLowerCase() === p.parameter_name.toLowerCase() ||
                mt.name.toLowerCase().replace('-', ' ') === p.parameter_name.toLowerCase().replace('-', ' ')
            );
            if (match) machineId = match.id;
          }

          // Fallback to manual code if no name match found
          if (!machineId) machineId = p.machine_parameter_code;

          return {
            id: machineId,
            name: p.parameter_name,
            unit: p.parameter_unit,
            isAutoMapped: !!machineId
          };
        }).filter(p => p.id); // Only include parameters we can actually track

        setSelectedParams(mappedParams);

        // Update status to In Progress
        await axios.post(`${API_BASE}/api/lab/acknowledge-test`, {
          bill_item_id: item.bill_item_id, sample_id: item.sample_id, status: 'In Progress'
        });
        fetchWorklist();

        // 4. START LISTENING
        await window.electronAPI.startListening({
          port: machine.port,
          baud: machine.baud,
          model: machine.model,
          machineId: machine.unique_id,
          sampleId: item.sample_id,
          shortId: item.short_id,
          testId: item.bill_item_id,
          parameters: mappedParams
        });
      } else {
        alert("No parameters found for this test.");
        setShowProcessModal(false);
      }
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to synchronize with Machine Protocol.");
      setShowProcessModal(false);
    } finally {
      setIsFetchingParams(false);
    }
  };

  const handleViewProcess = async (item) => {
    if (machines.length === 0) return alert("No machines configured.");
    initiateProcessing(item, machines[0]);
  };

  const handleCloseProcess = async () => {
    await window.electronAPI.stopListening();
    setShowProcessModal(false);
    setActiveItem(null);
    setCurrentMachine(null);
    setIncomingResults([]);
    fetchWorklist();
  };

  const handlePrint = () => {
    const printContent = document.getElementById('barcode-label');
    const win = window.open('', '', 'width=400,height=400');
    win.document.write('<html><head><title>Print Label</title><style>body{font-family:sans-serif;text-align:center;padding:20px;}</style></head><body>');
    win.document.write(printContent.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); setPrintLabel(null); }, 500);
  };

  const getStatusStyle = (status) => {
    const styles = {
      'Pending': { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
      'Collected': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
      'In Progress': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
      'Test Done': { bg: '#f0fdfa', color: '#115e59', border: '#99f6e4' },
      'Partially Done': { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
      'Completed': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' }
    };
    return styles[status] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Lab Worklist</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Smart Diagnostic Command Center</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#64748b', marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '14px', padding: '8px 0', width: '200px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600' }}
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Collected">Collected</option>
            <option value="In Progress">In Progress</option>
            <option value="Test Done">Partially Done</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600' }}
          >
            <option value="all">All Departments</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Serology">Serology</option>
            <option value="Microbiology">Microbiology</option>
          </select>

          <button onClick={fetchWorklist} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Sample ID</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Patient</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Test Name</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Status</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {worklist
              .filter(item => {
                const baseFilter = ['Pending', 'Collected', 'In Progress', 'Test Done'].includes(item.status);
                if (statusFilter !== 'all') {
                  if (statusFilter === 'Test Done') {
                    return item.status === 'Test Done' && item.pending_params?.length > 0;
                  }
                  return item.status === statusFilter;
                }
                return baseFilter;
              })
              .map((item) => (
                <tr key={item.bill_item_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '800' }}>{item.sample_id || '---'}</div>
                    {item.short_id && <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Short ID: {item.short_id}</div>}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '700' }}>{item.patient_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{item.patient_reg_no}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '600' }}>{item.test_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.sample_type}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', width: 'fit-content',
                        background: getStatusStyle((item.status === 'Test Done' && item.pending_params?.length > 0) ? 'Partially Done' : item.status).bg,
                        color: getStatusStyle((item.status === 'Test Done' && item.pending_params?.length > 0) ? 'Partially Done' : item.status).color,
                        border: `1px solid ${getStatusStyle((item.status === 'Test Done' && item.pending_params?.length > 0) ? 'Partially Done' : item.status).border}`
                      }}>
                        {(item.status === 'Test Done' && item.pending_params?.length > 0) ? 'Partially Done' : (item.status === 'Collected' ? 'Pending' : item.status)}
                      </span>
                      {item.pending_params && item.pending_params.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', maxWidth: '120px' }}>
                          ⏳ Waiting: {item.pending_params.join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {item.status === 'Pending' ? (
                      <button onClick={() => handleAcknowledge(item)} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Acknowledge</button>
                    ) : item.status === 'Collected' ? (
                      <button onClick={() => handleRunTestRequest(item)} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>🚀 Run Test</button>
                    ) : (
                      <button onClick={() => handleViewProcess(item)} style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>👁️ View</button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Analyzer Selection Modal */}
      {showAnalyzerPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '450px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900' }}>Select Machine</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {machines.map(m => (
                <button key={m.id} onClick={() => initiateProcessing(activeItem, m)} style={{ padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontWeight: '800' }}>{m.unique_id}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{m.manufacturer} {m.model}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{activeItem?.test_name}</h2>
                <div style={{ color: '#64748b' }}>Sample: {activeItem?.sample_id} | Analyzer: {currentMachine?.unique_id}</div>
              </div>
              <span style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '20px', fontWeight: '800', fontSize: '10px', letterSpacing: '1px' }}>📡 INTELLIGENT SYNC</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
              {/* Left: Dynamic Parameters mapped from JSON */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Target Parameters (Auto-Mapped)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '350px', overflowY: 'auto', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  {isFetchingParams ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Mapping Protocol...</div>
                  ) : selectedParams.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '10px' }}>ID:{p.id}</span>
                      <div style={{ fontSize: '13px', flex: 1 }}>
                        <div style={{ fontWeight: '700' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.unit}</div>
                      </div>
                      <span style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Live Result Stream */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Live Result Stream</h3>
                <div style={{ background: '#0f172a', borderRadius: '16px', padding: '20px', height: '350px', overflowY: 'auto', color: '#38bdf8', fontFamily: 'monospace' }}>
                  {incomingResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.4 }}>
                      <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛰️</div>
                      Waiting for data from {currentMachine?.unique_id}...
                    </div>
                  ) : (
                    incomingResults.map((res, i) => (
                      <div key={i} style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        background: res.flag === 'H' ? 'rgba(239, 68, 68, 0.05)' : res.flag === 'L' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                      }}>
                        <span style={{ color: res.flag === 'H' ? '#ef4444' : res.flag === 'L' ? '#3b82f6' : '#38bdf8' }}>
                          {res.test_name} {res.flag && res.flag !== 'N' ? `(${res.flag})` : ''}
                        </span>
                        <span style={{
                          color: res.flag === 'H' ? '#ef4444' : res.flag === 'L' ? '#3b82f6' : '#fff',
                          fontWeight: '800'
                        }}>
                          {res.result_value} {res.unit}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button onClick={handleCloseProcess} style={{ width: '100%', marginTop: '20px', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>
                  Complete & Close Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {printLabel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '400px', textAlign: 'center' }}>
            <h3>Sample Label</h3>
            <div id="barcode-label" style={{ padding: '20px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', marginBottom: '4px' }}>{printLabel.patientName}</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb', marginBottom: '8px' }}>
                ID: {printLabel.shortId}
              </div>
              <svg ref={barcodeRef}></svg>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePrint} style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Print</button>
              <button onClick={() => setPrintLabel(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Worklist;
