import { useState, useEffect, useCallback } from 'react';
import '../../assets/CSS/LabTVMode.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.8:7000';

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

  // ── Derived Data ─────────────────────────────────────────────────────────
  const nowServing = worklist.length > 0 ? worklist[0]          : null;
  const nextInLine = worklist.length > 1 ? worklist.slice(1, 5) : [];

  // ── Formatted Time / Date ────────────────────────────────────────────────
  const timeString = now.toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
  });

  const dateString = now.toLocaleDateString([], {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  }).toUpperCase();

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

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="tv-main-content">

        {/* Left — Now Serving */}
        <div className="tv-now-serving-section">
          <div className="tv-section-label live">
            <span className="live-dot" />
            Now Serving
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

        {/* Right — Next In Line */}
        <div className="tv-next-in-line-section">
          <div className="tv-section-label upcoming">
            Next in Queue
          </div>

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
                {nowServing
                  ? 'No further patients in queue'
                  : 'Queue is currently empty'}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="tv-footer-stats">
            <div className="tv-stat-box">
              <span className="tv-stat-label">Total Waiting</span>
              <span className="tv-stat-value">{worklist.length}</span>
            </div>

            <div className="tv-stat-divider" />

            <div className="tv-stat-box">
              <span className="tv-stat-label">Now Serving</span>
              <span className="tv-stat-value">
                {nowServing ? `#${nowServing.lab_queue_number ?? '—'}` : '—'}
              </span>
            </div>

            <div className="tv-stat-divider" />

            <div className="tv-stat-box">
              <span className="tv-stat-label">In Line</span>
              <span className="tv-stat-value">{nextInLine.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar ──────────────────────────────────────────────────── */}
      <div className="tv-statusbar">
        <div className="tv-statusbar-left">
          <span className="tv-online-dot" />
          Live Feed · Auto-refresh every 5 seconds
        </div>
        <div className="tv-statusbar-right">
          {loading ? 'Connecting…' : 'System Online'}
        </div>
      </div>

    </div>
  );
}

export default LabTVMode;