import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = 'http://localhost:7005';

export default function Setup() {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [baudRate, setBaudRate] = useState("9600");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const baudRates = ["1200", "2400", "4800", "9600", "19200", "38400", "57600", "115200"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const branch_id = localStorage.getItem('branch_id');
      const resLabs = await axios.get(`${API_BASE}/api/infra?type=Lab&branch_id=${branch_id}`);
      const labItems = resLabs.data.items || [];
      setLabs(labItems);
      
      if (labItems.length === 1) {
        handleLabSelection(labItems[0]);
      }

      const availablePorts = await window.electronAPI.listPorts();
      setPorts(availablePorts);
    } catch (err) {
      console.error("Setup initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSelection = async (lab) => {
    setSelectedLab(lab);
    setSelectedMachine(null);
    try {
      const res = await axios.get(`${API_BASE}/api/lab/machines/${lab.id}`);
      setMachines(res.data.machines || []);
    } catch (err) {
      console.error("Error fetching machines:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedLab || !selectedMachine || !selectedPort || !baudRate) {
      alert("Please complete all selections (Lab, Analyzer, Port, and Baud Rate)");
      return;
    }

    try {
      const config = {
        name: selectedMachine.name,
        model: selectedMachine.model,
        port: selectedPort,
        baud: parseInt(baudRate),
        labId: selectedLab.id,
        labName: selectedLab.name
      };

      await window.electronAPI.saveConfig(config);
      alert("Configuration saved successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error saving config:", err);
      alert("Failed to save configuration");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Initializing Agent...</div>;

  return (
    <div className="setup-page" style={{ padding: '40px', maxWidth: '650px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', color: '#1e293b', fontWeight: '800', marginBottom: '8px' }}>Machine Configuration</h2>
        <p style={{ color: '#64748b' }}>Connect an analyzer to the Meril LIS Network</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Lab Selection */}
        <div className="setup-section">
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#334155' }}>Facility Location</label>
          <select 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white' }}
            value={selectedLab ? JSON.stringify(selectedLab) : ""}
            onChange={(e) => handleLabSelection(JSON.parse(e.target.value))}
          >
            <option value="">Choose your Laboratory</option>
            {labs.map((l) => (
              <option key={l.id} value={JSON.stringify(l)}>{l.name} ({l.block})</option>
            ))}
          </select>
        </div>

        {/* Analyzer Selection */}
        {selectedLab && (
          <div className="setup-section">
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#334155' }}>Select Analyzer</label>
            <select 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white' }}
              value={selectedMachine ? selectedMachine.id : ""}
              onChange={(e) => {
                const machine = machines.find((m) => m.id == e.target.value);
                setSelectedMachine(machine);
                if (machine && machine.baud_rate) setBaudRate(machine.baud_rate.toString());
              }}
            >
              <option value="">Select Connected Machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.model})</option>
              ))}
            </select>
          </div>
        )}

        {/* Port & Baud */}
        {selectedMachine && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="setup-section">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#334155' }}>USB / Serial Port</label>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white' }}
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
              >
                <option value="">Choose Port</option>
                {ports.map((p) => (
                  <option key={p.path} value={p.path}>{p.path}</option>
                ))}
              </select>
            </div>

            <div className="setup-section">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#334155' }}>Baud Rate</label>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white' }}
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
              >
                {baudRates.map((rate) => (
                  <option key={rate} value={rate}>{rate}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={!selectedMachine}
          style={{ 
            width: '100%', padding: '16px', 
            background: !selectedMachine ? '#cbd5e1' : 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)', 
            color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '16px',
            cursor: !selectedMachine ? 'not-allowed' : 'pointer'
          }}
        >
          Save & Sync Machine
        </button>
      </div>
    </div>
  );
}