import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, X, CheckCircle, Delete, ChevronLeft } from 'lucide-react';
import '../assets/CSS/LabTVMode.css';
import merilLogo from '../assets/meril.png';

// Place jharkhand-logo.png in TV-Kiosk/renderer/public/ before packaging.
// The onError handler silently hides it if missing.
const JHARKHAND_LOGO = './jharkhand-logo.png';

const API_BASE = import.meta.env.VITE_API_URL || 'https://lims.poxiatechnologies.com';

// Kiosk auto-close after 60 s of inactivity
const KIOSK_TIMEOUT = 60000;

// ─── Utilities ───────────────────────────────────────────────────────────────
const getLast7Days = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
};

// ─── Clock Hook ──────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3v7.5L4.5 17A3 3 0 0 0 7.24 21h9.52a3 3 0 0 0 2.74-4L15 10.5V3H9zm2 0h2v7.91l4.1 6.83A1 1 0 0 1 16.76 19H7.24a1 1 0 0 1-.91-1.42L10.9 10.91 11 10.72V3z" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function LabTVMode({ labId, labName }) {
  const [worklist, setWorklist] = useState([]);
  const [loading, setLoading]   = useState(true);
  const now                     = useClock();

  // Kiosk modal state
  const [showModal, setShowModal]     = useState(false);
  const [kioskInput, setKioskInput]   = useState('');
  const [kioskStep, setKioskStep]     = useState('input');   // 'input' | 'results'
  const [patient, setPatient]         = useState(null);
  const [reports, setReports]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [searchErr, setSearchErr]     = useState('');
  const [sendingId, setSendingId]     = useState(null);
  const [sentId, setSentId]           = useState(null);
  const inactivityTimer               = useRef(null);

  const datesList = useRef(getLast7Days()).current;

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchWorklist = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/lab/worklist?department=all${labId ? `&branch_id=${labId}` : ''}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setWorklist(data.worklist.filter(item => item.status === 'Pending'));
      }
    } catch (error) {
      console.error('TV worklist fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    fetchWorklist();
    const interval = setInterval(fetchWorklist, 5000);
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  // ── Inactivity timer ─────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(closeAndResetModal, KIOSK_TIMEOUT);
  }, []);

  const closeAndResetModal = () => {
    clearTimeout(inactivityTimer.current);
    setShowModal(false);
    setKioskInput('');
    setKioskStep('input');
    setPatient(null);
    setReports([]);
    setSearchErr('');
    setSendingId(null);
    setSentId(null);
  };

  const openModal = () => { setShowModal(true); resetTimer(); };

  // ── Numeric keypad ────────────────────────────────────────────────────────
  const handleKey = (key) => {
    resetTimer();
    if (key === 'BACKSPACE') {
      setKioskInput(prev => prev.slice(0, -1));
      setSearchErr('');
    } else if (key === 'CLEAR') {
      setKioskInput('');
      setSearchErr('');
    } else if (key === 'SEARCH') {
      handleSearch();
    } else {
      setKioskInput(prev => (prev.length < 14 ? prev + key : prev));
      setSearchErr('');
    }
  };

  // ── Lookup reports ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (kioskInput.length < 4) { setSearchErr('Enter at least 4 digits'); return; }
    setSearching(true); setSearchErr('');
    try {
      const res  = await fetch(`${API_BASE}/api/lab/kiosk-reports?query=${encodeURIComponent(kioskInput)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (!data.patient) { setSearchErr('No patient found with this number'); return; }
      setPatient(data.patient);
      setReports(data.reports || []);
      setKioskStep('results');
      resetTimer();
    } catch (e) {
      setSearchErr(e.message || 'Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  };

  // ── Send report via WhatsApp ──────────────────────────────────────────────
  const handleSendWhatsApp = async (report) => {
    resetTimer();
    if (!patient?.phone) { alert('No phone number registered for this patient.'); return; }
    setSendingId(report.sample_id);
    try {
      let phone = patient.phone.replace(/[\s\-\+]/g, '');
      if (phone.length === 10) phone = '91' + phone;
      const res  = await fetch(`${API_BASE}/api/lab/whatsapp-send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId: report.sample_id, phone, patientName: patient.name, testName: report.test_name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSentId(report.sample_id);
      setTimeout(() => setSentId(null), 4000);
    } catch (e) {
      alert('Failed to send: ' + e.message);
    } finally {
      setSendingId(null);
    }
  };

  // ── Hidden reset: tap clock area 5× within 4 s ───────────────────────────
  const clockTaps  = useRef(0);
  const clockTimer = useRef(null);
  const handleClockTap = () => {
    clockTaps.current++;
    clearTimeout(clockTimer.current);
    clockTimer.current = setTimeout(() => { clockTaps.current = 0; }, 4000);
    if (clockTaps.current >= 5) {
      clockTaps.current = 0;
      window.kioskAPI.resetConfig();
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const nowServing = worklist.length > 0 ? worklist[0]          : null;
  const nextInLine = worklist.length > 1 ? worklist.slice(1, 5) : [];

  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  // ── Numpad ────────────────────────────────────────────────────────────────
  const renderNumpad = () => (
    <div className="kiosk-keyboard">
      {[['1','2','3'],['4','5','6'],['7','8','9'],['CLEAR','0','BACKSPACE']].map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map(k => (
            <button
              key={k}
              className={`key-btn ${k === 'BACKSPACE' ? 'backspace-btn' : ''} ${k === 'CLEAR' ? 'clear-btn' : ''}`}
              onClick={() => handleKey(k)}
            >
              {k === 'BACKSPACE' ? <Delete size={22} /> : k}
            </button>
          ))}
        </div>
      ))}
      <div className="keyboard-row">
        <button
          className="key-btn enter-btn"
          onClick={() => handleKey('SEARCH')}
          disabled={kioskInput.length < 4 || searching}
          style={{ width: '100%' }}
        >
          {searching ? 'Searching…' : '🔍 Search'}
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tv-mode-container">

      {/* Header */}
      <header className="tv-header">
        <div className="tv-logo-area">
          <img src={JHARKHAND_LOGO} alt="Jharkhand State" className="tv-jharkhand-logo"
            onError={e => { e.target.style.display = 'none'; }} />
          <div className="tv-logo-text">
            <h1>Jharkhand State Diagnostic Services</h1>
            <p>{labName ? labName.toUpperCase() : 'PATIENT QUEUE DISPLAY'}</p>
          </div>
        </div>
        {/* Tap clock 5× to go back to setup screen */}
        <div className="tv-header-right" onClick={handleClockTap} style={{ cursor:'default' }}>
          <div className="tv-clock">{timeString}</div>
          <div className="tv-date">{dateString}</div>
          <img src={merilLogo} alt="Meril" className="tv-meril-logo" />
        </div>
      </header>

      {/* Queue board */}
      <div className="tv-main-content">
        <div className="tv-now-serving-section">
          <div className="tv-section-label live">
            <span className="live-dot" /> Now Serving
          </div>
          {nowServing ? (
            <div className="tv-now-serving-card">
              <div className="tv-token-label">Token Number</div>
              <div className="tv-token-number">#{nowServing.lab_queue_number ?? 1}</div>
              <div className="tv-patient-name">{nowServing.patient_name}</div>
              <div className="tv-department-name">
                Please proceed to the <strong>{nowServing.department || 'Laboratory'}</strong> Collection Desk
              </div>
            </div>
          ) : (
            <div className="tv-empty-state">
              <div className="tv-empty-icon"><EmptyIcon /></div>
              <h3>Queue is Empty</h3>
              <p>No patients are currently waiting.</p>
            </div>
          )}
        </div>

        <div className="tv-next-in-line-section">
          <div className="tv-section-label upcoming">Next in Queue</div>
          <div className="tv-next-list">
            {nextInLine.length > 0 ? (
              nextInLine.map((item, index) => (
                <div key={item.lab_queue_number ?? index} className="tv-next-card">
                  <span className="tv-next-rank">{index + 2}</span>
                  <span className="tv-next-token">#{item.lab_queue_number ?? index + 2}</span>
                  <div className="tv-next-info">
                    <div className="tv-next-name">{item.patient_name}</div>
                    {item.department && <div className="tv-next-dept">{item.department}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="tv-empty-list">
                {nowServing ? 'No further patients in queue' : 'Queue is currently empty'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="kiosk-fab" onClick={openModal}>
        <FileText size={24} />
        <span>Get My Reports</span>
      </button>

      {/* Kiosk modal */}
      {showModal && (
        <div className="kiosk-modal-overlay" onClick={closeAndResetModal}>
          <div className="kiosk-modal large-modal" onClick={e => e.stopPropagation()}>

            <button className="kiosk-modal-close" onClick={closeAndResetModal}>
              <X size={24} />
            </button>

            <div className="kiosk-logo-row">
              <img src={JHARKHAND_LOGO} alt="Jharkhand" className="kiosk-jharkhand-logo"
                onError={e => { e.target.style.display = 'none'; }} />
              <img src={merilLogo} alt="Meril" className="kiosk-meril-logo" />
            </div>

            {kioskStep === 'input' && (
              <>
                <div className="kiosk-service-header">
                  <h2>Get Your Reports</h2>
                  <p>Enter your registered mobile number or ABHA number</p>
                </div>
                <div className="token-input-display">
                  <div className="token-placeholder">
                    {kioskInput
                      ? kioskInput.replace(/(\d{4})(\d{3})(\d{3,})/, '$1 $2 $3')
                      : 'Phone / ABHA No.'}
                  </div>
                  {kioskInput && <span className="cursor-blink">|</span>}
                </div>
                {searchErr && (
                  <div style={{ textAlign:'center', color:'#ef4444', marginBottom:'8px', fontSize:'15px' }}>
                    {searchErr}
                  </div>
                )}
                {renderNumpad()}
              </>
            )}

            {kioskStep === 'results' && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                  <button className="key-btn backspace-btn"
                    style={{ width:'44px', height:'44px', flexShrink:0 }}
                    onClick={() => { setKioskStep('input'); resetTimer(); }}>
                    <ChevronLeft size={22} />
                  </button>
                  <div>
                    <div style={{ fontSize:'20px', fontWeight:'700', color:'#0a2a6e' }}>{patient?.name}</div>
                    <div style={{ fontSize:'13px', color:'#475569' }}>Reports from the last 7 days</div>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 0', color:'#64748b' }}>
                    <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                    <div style={{ fontSize:'16px' }}>No approved reports in the last 7 days</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxHeight:'420px', overflowY:'auto' }}>
                    {reports.map(r => {
                      const isSending = sendingId === r.sample_id;
                      const isSent    = sentId    === r.sample_id;
                      return (
                        <div key={r.id} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          background:'#f8faff', border:'1px solid #dbeafe',
                          borderRadius:'14px', padding:'14px 18px',
                        }}>
                          <div>
                            <div style={{ fontWeight:'700', fontSize:'16px', color:'#0a2a6e' }}>{r.test_name}</div>
                            <div style={{ fontSize:'12px', color:'#64748b', marginTop:'3px' }}>
                              {new Date(r.verified_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                              {' · '}
                              <span style={{ fontFamily:'monospace', color:'#3b82f6' }}>{r.sample_id}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendWhatsApp(r)}
                            disabled={isSending || isSent}
                            style={{
                              display:'flex', alignItems:'center', gap:'8px',
                              background: isSent ? '#16a34a' : '#25D366',
                              color:'#fff', border:'none', borderRadius:'10px',
                              padding:'10px 18px', fontSize:'14px', fontWeight:'700',
                              cursor: isSending || isSent ? 'not-allowed' : 'pointer',
                              flexShrink:0, minWidth:'150px', justifyContent:'center',
                            }}
                          >
                            {isSent ? <><CheckCircle size={18}/> Sent!</>
                              : isSending ? <>⏳ Sending…</>
                              : <>📲 Send to WhatsApp</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default LabTVMode;
