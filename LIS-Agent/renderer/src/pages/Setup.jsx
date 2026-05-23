import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = 'http://localhost:7005';

export default function Setup() {
    const [labs, setLabs] = useState([]);
    const [savedMachines, setSavedMachines] = useState([]);
    const [ports, setPorts] = useState([]);
    const [activePorts, setActivePorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [searchSerial, setSearchSerial] = useState('');

    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        serialNumber: '',
        uniqueId: '',
        labId: '',
        labName: '',
        manufacturer: '',
        model: '',
        portType: 'USB',
        port: '',
        baudRate: '9600'
    });

    const manufacturers = {
        'Meril': ['CliniQuant Micro', 'CelQuant Edge', 'CelQuant Micro', 'AutoQuant 200i', 'Quantirase'],
        'Sysmex': ['XP-100', 'XN-350', 'XN-550', 'KX-21'],
        'Agape': ['Mispa Viva', 'Mispa i2', 'Mispa i3', 'Mispa CC'],
        'HDC India': ['HDC-Lyte Plus'],
        'Erba Mannheim': ['LAURA Smart']
    };

    const baudRates = ["1200", "2400", "4800", "9600", "19200", "38400", "57600", "115200"];

    useEffect(() => {
        fetchInitialData();

        // Listen for real-time status changes
        if (window.electronAPI && window.electronAPI.onDeviceStatus) {
            const cleanup = window.electronAPI.onDeviceStatus(() => {
                refreshStatus();
            });
            return cleanup;
        }
    }, []);

    const refreshStatus = async () => {
        if (window.electronAPI && window.electronAPI.getActivePorts) {
            const active = await window.electronAPI.getActivePorts();
            setActivePorts(active);
        }
    };

    const fetchInitialData = async () => {
        try {
            const configs = await window.electronAPI.getConfig();
            setSavedMachines(Array.isArray(configs) ? configs : []);

            const branch_id = localStorage.getItem('branch_id') || '1';
            const resLabs = await axios.get(`${API_BASE}/api/infra?type=Lab&branch_id=${branch_id}`);
            setLabs(resLabs.data.items || []);

            const availablePorts = await window.electronAPI.listPorts();
            setPorts(availablePorts);

            await refreshStatus();
        } catch (err) {
            console.error("Setup initialization error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchBySerial = async () => {
        if (!searchSerial) return;
        setIsFetching(true);
        try {
            const res = await axios.get(`${API_BASE}/api/lab/machine-by-serial/${searchSerial}`);

            // Always sync the form's serial with the searched one
            setFormData(prev => ({ ...prev, serialNumber: searchSerial }));

            if (res.data.success && res.data.machine) {
                const m = res.data.machine;
                setFormData(prev => ({
                    ...prev,
                    uniqueId: m.machine_id,
                    manufacturer: m.manufacturer,
                    model: m.model,
                    portType: m.interface_type || 'USB',
                    port: m.port_ip || '',
                    baudRate: m.baud_rate ? m.baud_rate.toString() : '9600'
                }));
                alert("Found existing configuration on Cloud! Details auto-filled.");
            } else {
                // If not found, clear other fields but KEEP the serial number in the form
                setFormData(prev => ({
                    ...prev,
                    uniqueId: '',
                    manufacturer: '',
                    model: '',
                    port: '',
                }));
                generateUniqueId();
                alert("No record found. A new Unique Machine ID has been generated for this analyzer.");
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setIsFetching(false);
        }
    };

    const generateUniqueId = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : { id: 1 };
            const res = await axios.get(`${API_BASE}/api/lab/hospital-code/${user.id}`);
            if (res.data.success) {
                const prefix = res.data.hospital_code || 'LAB';
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                setFormData(prev => ({ ...prev, uniqueId: `${prefix}-MAC-${randomNum}` }));
            }
        } catch (err) {
            console.error("Error generating ID:", err);
            setFormData(prev => ({ ...prev, uniqueId: `LAB-MAC-${Math.floor(1000 + Math.random() * 9000)}` }));
        }
    };

    const handleSave = async () => {
        if (!formData.labId || !formData.manufacturer || !formData.model || !formData.port || !formData.serialNumber) {
            alert("Please complete all required fields");
            return;
        }

        // 🚨 Prevent USB Port Conflict
        const conflict = savedMachines.find(m =>
            m.port === formData.port &&
            m.unique_id !== formData.uniqueId
        );

        if (conflict) {
            alert(`⚠️ Port Conflict: Port ${formData.port} is already assigned to ${conflict.model} (${conflict.unique_id}).\n\nPlease select a different port or disconnect the other device.`);
            return;
        }

        try {
            const lab = labs.find(l => l.id == formData.labId);
            const config = {
                uniqueId: formData.uniqueId,
                name: formData.uniqueId,
                model: formData.model,
                port: formData.port,
                baud: parseInt(formData.baudRate),
                labId: lab.id,
                labName: lab.name,
                manufacturer: formData.manufacturer,
                serialNumber: formData.serialNumber
            };

            await window.electronAPI.saveConfig(config);

            await axios.post(`${API_BASE}/api/lab/machines/sync`, {
                lab_id: lab.id,
                machine_id: formData.uniqueId,
                name: formData.uniqueId,
                model: formData.model,
                manufacturer: formData.manufacturer,
                serial_number: formData.serialNumber,
                interface_type: formData.portType,
                port_ip: formData.port,
                baud_rate: parseInt(formData.baudRate)
            });

            alert("Machine Synchronized!");
            fetchInitialData();
            setShowAddForm(false);
            setSearchSerial('');
        } catch (err) {
            console.error("Error saving config:", err);
            alert("Failed to synchronize with Cloud");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this machine?")) {
            await window.electronAPI.deleteConfig(id);
            fetchInitialData();
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Initializing...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Analyzer Hub</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Cloud-synchronized laboratory connectivity</p>
                </div>
                {!showAddForm && (
                    <button
                        onClick={() => {
                            setIsEdit(false);
                            setShowAddForm(true);
                            setSearchSerial('');
                            setFormData({ serialNumber: '', uniqueId: '', labId: '', labName: '', manufacturer: '', model: '', portType: 'USB', port: '', baudRate: '9600' });
                        }}
                        style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        + Link Analyzer
                    </button>
                )}
            </header>

            {!showAddForm ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {savedMachines.map((m) => (
                        <div key={m.id} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '10px', fontWeight: '900', border: '1px solid #dbeafe' }}>CLOUD SYNCED</span>
                                    {activePorts.includes(m.port) ? (
                                        <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: '6px', fontSize: '10px', fontWeight: '900', border: '1px solid #d1fae5' }}>ONLINE</span>
                                    ) : (
                                        <span style={{ padding: '4px 10px', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontSize: '10px', fontWeight: '900', border: '1px solid #fee2e2' }}>OFFLINE</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                serialNumber: m.serial_number,
                                                uniqueId: m.unique_id,
                                                labId: m.lab_id,
                                                labName: m.lab_name,
                                                manufacturer: m.manufacturer,
                                                model: m.model,
                                                portType: m.interface_type || 'USB',
                                                port: m.port,
                                                baudRate: m.baud.toString()
                                            });
                                            setIsEdit(true);
                                            setSearchSerial(m.serial_number);
                                            setShowAddForm(true);
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '18px' }}
                                    >
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                                </div>
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{m.unique_id}</h3>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>S/N: {m.serial_number}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}><strong>Brand:</strong> {m.manufacturer}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}><strong>Model:</strong> {m.model}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}><strong>Lab:</strong> {m.lab_name}</div>
                            <div style={{ marginTop: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                {m.port} @ {m.baud} bps
                            </div>
                        </div>
                    ))}
                    {savedMachines.length === 0 && (
                        <div style={{ gridColumn: '1/-1', padding: '80px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌐</div>
                            <h3 style={{ color: '#64748b' }}>Connect your Analyzers</h3>
                            <p style={{ color: '#94a3b8' }}>Link a machine using its Serial Number to sync with Cloud</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>

                    {/* STEP 1: Search by Serial */}
                    <div style={{ marginBottom: '32px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#0f172a' }}>Search Analyzer by Serial Number</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Enter Serial Number (e.g. SN-12345)"
                                value={searchSerial}
                                onChange={(e) => setSearchSerial(e.target.value)}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '16px', fontWeight: '600' }}
                            />
                            <button
                                onClick={handleFetchBySerial}
                                disabled={isFetching || !searchSerial}
                                style={{ padding: '0 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {isFetching ? 'Fetching...' : 'Fetch Settings'}
                            </button>
                        </div>
                    </div>

                    {/* STEP 2: Detailed Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Confirmed Serial Number</label>
                            <input type="text" value={formData.serialNumber} readOnly style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#64748b', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Unique Machine ID</label>
                            <input type="text" value={formData.uniqueId} readOnly style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: '900', color: '#2563eb', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Target Laboratory</label>
                            <select disabled={isEdit} value={formData.labId} onChange={(e) => setFormData({ ...formData, labId: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: isEdit ? '#f8fafc' : 'white' }}>
                                <option value="">Select Lab</option>
                                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Select Brand</label>
                            <select disabled={isEdit} value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value, model: '' })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: isEdit ? '#f8fafc' : 'white' }}>
                                <option value="">Choose Brand</option>
                                {Object.keys(manufacturers).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Analyzer Model</label>
                            <select disabled={isEdit || !formData.manufacturer} value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: isEdit ? '#f8fafc' : 'white' }}>
                                <option value="">Select Model</option>
                                {formData.manufacturer && manufacturers[formData.manufacturer].map(mod => <option key={mod} value={mod}>{mod}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Interface</label>
                            <select value={formData.portType} onChange={(e) => setFormData({ ...formData, portType: e.target.value, port: '' })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                                <option value="USB">USB / Serial Port</option>
                                <option value="TCP">TCP / IP (Network)</option>
                            </select>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '700', color: '#1e293b' }}>Port / IP</label>
                                {formData.portType === 'USB' && (
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            const availablePorts = await window.electronAPI.listPorts();
                                            setPorts(availablePorts);
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        🔄 Refresh Ports
                                    </button>
                                )}
                            </div>
                            {formData.portType === 'USB' ? (
                                <select value={formData.port} onChange={(e) => setFormData({ ...formData, port: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                                    <option value="">Choose Port</option>
                                    {ports.map(p => (
                                        <option key={p.path} value={p.path}>
                                            {p.path} {p.manufacturer ? `(${p.manufacturer})` : ''} {p.friendlyName ? `- ${p.friendlyName}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" placeholder="192.168.1.100:5000" value={formData.port} onChange={(e) => setFormData({ ...formData, port: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1e293b' }}>Baud Rate</label>
                            <select disabled={formData.portType === 'TCP'} value={formData.baudRate} onChange={(e) => setFormData({ ...formData, baudRate: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                                {baudRates.map(rate => <option key={rate} value={rate}>{rate}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                        <button onClick={handleSave} style={{ flex: 1, padding: '18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '17px', cursor: 'pointer' }}>Save & Sync to Cloud</button>
                        <button onClick={() => setShowAddForm(false)} style={{ padding: '18px 32px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}