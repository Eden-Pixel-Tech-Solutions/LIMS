import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, X, CheckCircle, Smartphone, Languages, Calendar, Delete } from 'lucide-react';
import '../../assets/CSS/LabTVMode.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const translations = {
  en: {
    getResults: "View Reports",
    modalTitle: "Patient Test Reports",
    modalSub: "Select a date and enter your Token No.",
    enterToken: "Enter Token No",
    sending: "Sending report to WhatsApp...",
    sent: "Report Sent to WhatsApp!",
    error: "Failed to send report. Please try again.",
    back: "Back",
  },
  hi: {
    getResults: "रिपोर्ट देखें",
    modalTitle: "मरीज की रिपोर्ट",
    modalSub: "तारीख चुनें और अपना टोकन नंबर दर्ज करें",
    enterToken: "टोकन नंबर दर्ज करें",
    sending: "WhatsApp पर रिपोर्ट भेजी जा रही है...",
    sent: "रिपोर्ट WhatsApp पर भेज दी गई!",
    error: "रिपोर्ट भेजने में विफल. कृपया पुनः प्रयास करें.",
    back: "वापस",
  }
};

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
function LabTVMode() {
  const [worklist, setWorklist] = useState([]);
  const [loading, setLoading]   = useState(true);
  const now                     = useClock();
  
  // Language State
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  // Kiosk Modal State
  const [showModal, setShowModal] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [whatsappStatus, setWhatsappStatus] = useState('idle'); // idle, sending, success, error
  
  const datesList = useRef(getLast7Days()).current;

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchWorklist = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/lab/worklist?department=all`);
      const data = await res.json();
      if (data.success) {
        const pending = data.worklist.filter(item => item.status === 'Pending');
        setWorklist(pending);
      }
    } catch (error) {
      console.error('Error fetching TV worklist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorklist();
    const interval = setInterval(fetchWorklist, 5000);
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  // ── Auto-Send Logic ───────────────────────────────────────────────────────
  const handleSearchAndSend = async () => {
    if (!searchToken) return;
    setWhatsappStatus('sending');

    try {
      // 1. Fetch approved reports matching the Token No (search query) and Date
      // We format the selected date as YYYY-MM-DD for the API using local time
      const tzoffset = selectedDate.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(selectedDate.getTime() - tzoffset)).toISOString().slice(0, 10);
      
      const params = new URLSearchParams({
        search: searchToken,
        from: localISOTime,
        to: localISOTime
      });

      const searchRes = await fetch(`${API_BASE}/api/lab/approved-reports?${params.toString()}`);
      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.success || !searchData.reports || searchData.reports.length === 0) {
        throw new Error(t.error + ' (Report not found for this date & token)');
      }

      // Take the first matching report
      const report = searchData.reports[0];
      const phoneRaw = report.patient_phone || report.telephone || '';

      if (!phoneRaw) {
        throw new Error(t.error + ' (No phone number registered)');
      }

      // Normalize phone
      let phone = phoneRaw.replace(/[\s\-\+]/g, '');
      if (phone.length === 10) phone = '91' + phone;

      // 2. Call WhatsApp send endpoint
      const sendRes = await fetch(`${API_BASE}/api/lab/whatsapp-send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: report.sample_id,
          phone: phone,
          patientName: report.patient_name,
          testName: report.test_name
        })
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok || !sendData.success) {
        throw new Error(sendData.message || t.error);
      }

      // Success!
      setWhatsappStatus('success');
      
      // Auto close/reset after a few seconds of showing success
      setTimeout(() => {
        closeAndResetModal();
      }, 4000);

    } catch (error) {
      console.error('Kiosk Auto-Send Error:', error);
      setWhatsappStatus('error');
    }
  };

  const closeAndResetModal = () => {
    setShowModal(false);
    setSearchToken('');
    setWhatsappStatus('idle');
    setSelectedDate(new Date());
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'hi' : 'en');
  };

  // ── Keyboard Interaction ──────────────────────────────────────────────────
  const handleKeyPress = (key) => {
    if (whatsappStatus !== 'idle') return; // block input while sending
    
    if (key === 'BACKSPACE') {
      setSearchToken(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSearchAndSend();
    } else {
      setSearchToken(prev => prev + key);
    }
  };

  // ── Derived Data ─────────────────────────────────────────────────────────
  const nowServing = worklist.length > 0 ? worklist[0]          : null;
  const nextInLine = worklist.length > 1 ? worklist.slice(1, 5) : [];

  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  // ── Render Keyboard ──────────────────────────────────────────────────────
  const renderKeyboard = () => {
    const rows = [
      ['1','2','3','4','5','6','7','8','9','0'],
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M']
    ];

    return (
      <div className="kiosk-keyboard">
        {rows.map((row, i) => (
          <div key={i} className="keyboard-row">
            {row.map(key => (
              <button key={key} className="key-btn" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="keyboard-row action-row">
          <button className="key-btn backspace-btn" onClick={() => handleKeyPress('BACKSPACE')}>
            <Delete size={24} />
          </button>
          <button 
            className="key-btn enter-btn" 
            onClick={() => handleKeyPress('ENTER')}
            disabled={!searchToken}
          >
            Enter / Send
          </button>
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tv-mode-container">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="tv-header">
        <div className="tv-logo-area">
          <div className="tv-logo-icon">
            <FlaskIcon />
          </div>
          <div className="tv-logo-text">
            <h1>Best Clinical Laboratory</h1>
            <p>Patient Queue Display</p>
          </div>
        </div>

        <div className="tv-header-right">
          <div className="tv-clock">{timeString}</div>
          <div className="tv-date">{dateString}</div>
        </div>
      </header>

      {/* ── Main Content (Original TV Layout) ───────────────────────────── */}
      <div className="tv-main-content">
        <div className="tv-now-serving-section">
          <div className="tv-section-label live">
            <span className="live-dot" /> Now Serving
          </div>

          {nowServing ? (
            <div className="tv-now-serving-card">
              <div className="tv-token-label">Token Number</div>
              <div className="tv-token-number">
                #{nowServing.lab_queue_number ?? 1}
              </div>
              <div className="tv-patient-name">
                {nowServing.patient_name}
              </div>
              <div className="tv-department-name">
                Please proceed to the{' '}
                <strong>{nowServing.department || 'Laboratory'}</strong>{' '}
                Collection Desk
              </div>
            </div>
          ) : (
            <div className="tv-empty-state">
              <div className="tv-empty-icon">
                <EmptyIcon />
              </div>
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
                  <span className="tv-next-token">
                    #{item.lab_queue_number ?? index + 2}
                  </span>
                  <div className="tv-next-info">
                    <div className="tv-next-name">{item.patient_name}</div>
                    {item.department && (
                      <div className="tv-next-dept">{item.department}</div>
                    )}
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

      {/* ── Floating Action Button ──────────────────────────────────────── */}
      <button 
        className="kiosk-fab" 
        onClick={() => setShowModal(true)}
      >
        <FileText size={24} />
        <span>{t.getResults}</span>
      </button>

      {/* ── Floating Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="kiosk-modal-overlay">
          <div className="kiosk-modal large-modal">
            
            <button className="kiosk-modal-close" onClick={closeAndResetModal}>
              <X size={24} />
            </button>
            
            <button className="kiosk-lang-toggle" onClick={toggleLang}>
              <Languages size={18} />
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
            
            {whatsappStatus === 'idle' ? (
              <>
                <div className="kiosk-service-header">
                  <h2>{t.modalTitle}</h2>
                  <p>{t.modalSub}</p>
                </div>

                {/* Date Selector Row */}
                <div className="date-selector-row">
                  {datesList.map((d, i) => {
                    const isSelected = selectedDate.toDateString() === d.toDateString();
                    return (
                      <button 
                        key={i} 
                        className={`date-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedDate(d)}
                      >
                        <span className="day-name">{d.toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', { weekday: 'short' })}</span>
                        <span className="date-num">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Token Input Display */}
                <div className="token-input-display">
                  <div className="token-placeholder">{searchToken || t.enterToken}</div>
                  {searchToken && <span className="cursor-blink">|</span>}
                </div>

                {/* On Screen Keyboard */}
                {renderKeyboard()}
              </>
            ) : (
              <div className="whatsapp-status-screen">
                {whatsappStatus === 'sending' && (
                  <div className="status-sending">
                    <div className="spinner"></div>
                    <h3>{t.sending}</h3>
                  </div>
                )}
                {whatsappStatus === 'success' && (
                  <div className="status-success">
                    <CheckCircle size={64} className="success-icon animate-pop" />
                    <h3>{t.sent}</h3>
                  </div>
                )}
                {whatsappStatus === 'error' && (
                  <div className="status-error">
                    <X size={64} className="error-icon" />
                    <h3>{t.error}</h3>
                    <button className="key-btn enter-btn mt-4" onClick={() => setWhatsappStatus('idle')}>
                      {t.back}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default LabTVMode;