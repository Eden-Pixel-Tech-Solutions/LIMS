import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = 'http://localhost:7005';

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  
  // Incoming data from serialManager
  useEffect(() => {
    fetchMachines();
    const cleanup = window.electronAPI.onTestCompleted((data) => {
      console.log("Test Completed Data:", data);
      setTestResults(prev => [data, ...prev]);
      setLogs(prev => [`[${data.test_name}] Result: ${data.result_value} ${data.unit}`, ...prev]);
    });
    return cleanup;
  }, []);

  const fetchMachines = async () => {
    const configs = await window.electronAPI.getConfig();
    setMachines(Array.isArray(configs) ? configs : []);
    if (configs && configs.length === 1) {
      setSelectedMachine(configs[0]);
    }
  };

  const handleToggleListening = async () => {
    if (isListening) {
      await window.electronAPI.stopListening();
      setIsListening(false);
      setLogs(prev => ["🔴 Stopped listening", ...prev]);
    } else {
      if (!selectedMachine && machines.length > 1) {
        setShowPicker(true);
        return;
      }
      
      const machineToUse = selectedMachine || machines[0];
      if (!machineToUse) {
        alert("Please configure a machine in Setup first.");
        return;
      }

      startEngine(machineToUse);
    }
  };

  const startEngine = async (machine) => {
    setLogs(prev => [`🔵 Starting listener on ${machine.port}...`, ...prev]);
    const success = await window.electronAPI.startListening({
      port: machine.port,
      baud: machine.baud,
      machineId: machine.id
    });

    if (success) {
      setIsListening(true);
      setSelectedMachine(machine);
      setShowPicker(false);
    } else {
      alert("Failed to open port. Check connection.");
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Laboratory Dashboard</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            {selectedMachine ? `Connected to ${selectedMachine.unique_id} (${selectedMachine.model})` : 'No analyzer selected'}
          </p>
        </div>
        
        <button 
          onClick={handleToggleListening}
          style={{
            padding: '12px 28px',
            background: isListening ? '#ef4444' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          {isListening ? '⏹ Stop Capture' : '▶ Start Capture'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Results Live Feed */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '700' }}>Live Test Results</div>
          <div style={{ height: '500px', overflowY: 'auto', padding: '20px' }}>
            {testResults.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '100px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📉</div>
                Waiting for machine data...
              </div>
            ) : (
              testResults.map((res, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', color: '#1e293b' }}>{res.test_name}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb' }}>{res.result_value}</span>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{res.unit}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>Ref: {res.reference_range}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Logs */}
        <div style={{ background: '#0f172a', borderRadius: '16px', color: '#38bdf8', padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ color: 'white', fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>System Logs</div>
          <div style={{ height: '440px', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '6px', borderLeft: '2px solid #1e293b', paddingLeft: '10px' }}>
                <span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Machine Picker Modal */}
      {showPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900' }}>Select Analyzer</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Multiple machines detected. Which one are you running?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {machines.map(m => (
                <button 
                  key={m.id}
                  onClick={() => startEngine(m)}
                  style={{ 
                    padding: '16px', borderRadius: '12px', border: '2.5px solid #f1f5f9', background: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    ':hover': { borderColor: '#2563eb', background: '#eff6ff' }
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = 'white'; }}
                >
                  <div style={{ fontWeight: '800', color: '#1e293b' }}>{m.unique_id}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{m.manufacturer} {m.model} • {m.port}</div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowPicker(false)}
              style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}