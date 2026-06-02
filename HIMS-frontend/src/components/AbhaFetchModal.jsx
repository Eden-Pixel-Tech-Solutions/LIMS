import React, { useState } from 'react';
import { X, AlertCircle, Loader2, Phone, Shield, CheckCircle, ChevronRight, User } from 'lucide-react';

const BRAND = '#005eb8';
const BRAND_DARK = '#004f9e';
const BRAND_LIGHT = '#e8f0fb';

export default function AbhaFetchModal({ isOpen, onClose, onComplete, initialMobile, initialAbhaId, mode: initialMode }) {
  const [activeMode, setActiveMode] = useState(initialMode || 'mobile');
  const isMobile = activeMode === 'mobile';

  const switchMode = (newMode) => {
    setActiveMode(newMode);
    setStep(newMode === 'mobile' ? 'SEARCH' : 'REQUEST_OTP');
    setLoginId(newMode === 'mobile' ? (initialMobile || '') : (initialAbhaId || ''));
    setOtp(''); setError(null); setSearchAccounts([]); setSelectedAccount(null); setOtpType('abdm');
  };

  // mobile flow: SEARCH → SELECT (if >1) → OTP → VERIFY
  // abha flow:   REQUEST_OTP → VERIFY
  const [step, setStep]           = useState(isMobile ? 'SEARCH' : 'REQUEST_OTP');
  const [loginId, setLoginId]     = useState(isMobile ? (initialMobile || '') : (initialAbhaId || ''));
  const [searchAccounts, setSearchAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTxnId, setSearchTxnId] = useState('');
  const [otpTxnId, setOtpTxnId]   = useState('');
  const [otpType, setOtpType]     = useState('abdm'); // 'abdm' | 'aadhaar'
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  if (!isOpen) return null;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7005';

  const handleError = (err, defaultMsg) => {
    setError(err.message || defaultMsg);
    setLoading(false);
  };

  // ── Mobile flow: Step 1 — Search ──────────────────────────
  const searchByMobile = async () => {
    const mobile = loginId.replace(/\D/g, '');
    if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/profile/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (data.success && data.data?.accounts?.length > 0) {
        setSearchTxnId(data.data.txnId);
        setSearchAccounts(data.data.accounts);
        if (data.data.accounts.length === 1) {
          setSelectedAccount(data.data.accounts[0]);
          setStep('SELECT_OTP_TYPE');
        } else {
          setStep('SELECT');
        }
      } else {
        throw new Error('No ABHA account found linked to this mobile number.');
      }
    } catch (err) { handleError(err, 'Search failed'); }
    setLoading(false);
  };

  // ── Mobile flow: Step 2 — send OTP for selected index ─────
  const sendOtpByIndex = async (account, txnId, selectedOtpType) => {
    const resolvedOtpType = selectedOtpType || otpType;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/profile/request-otp-by-index`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: account.index, txnId: txnId || searchTxnId, otpType: resolvedOtpType })
      });
      const data = await res.json();
      if (data.success && data.data?.txnId) {
        setSelectedAccount(account);
        setOtpType(resolvedOtpType);
        setOtpTxnId(data.data.txnId);
        setStep('VERIFY_OTP');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to send OTP');
      }
    } catch (err) { handleError(err, 'Failed to send OTP'); }
    setLoading(false);
  };

  // ── ABHA number flow: Step 1 — request OTP ────────────────
  const requestOtpByAbha = async () => {
    if (!loginId.trim()) { setError('Please enter an ABHA ID'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/profile/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaNumber: loginId.trim() })
      });
      const data = await res.json();
      if (data.success && data.data?.txnId) {
        setOtpTxnId(data.data.txnId);
        setStep('VERIFY_OTP');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to send OTP');
      }
    } catch (err) { handleError(err, 'Failed to send OTP'); }
    setLoading(false);
  };

  // ── Both flows: verify OTP ─────────────────────────────────
  const verifyOtp = async () => {
    if (otp.length < 6) { setError('Please enter the 6-digit OTP'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/profile/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId: otpTxnId, otp, otpType })
      });
      const data = await res.json();
      if (data.success && data.data?.profile) {
        onComplete(data.data.profile);
        onClose();
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'OTP verification failed');
      }
    } catch (err) { handleError(err, 'OTP verification failed'); }
    setLoading(false);
  };

  // ── Step progress ──────────────────────────────────────────
  const mobileSteps  = ['Search', ...(searchAccounts.length > 1 ? ['Select'] : []), 'OTP Method', 'Verify OTP'];
  const abhaSteps    = ['ABHA ID', 'Verify OTP'];
  const allSteps     = isMobile ? mobileSteps : abhaSteps;
  const mobileStepMap = { SEARCH: 0, SELECT: 1, SELECT_OTP_TYPE: searchAccounts.length > 1 ? 2 : 1, VERIFY_OTP: mobileSteps.length - 1 };
  const currentIndex = isMobile ? (mobileStepMap[step] ?? 0) : (step === 'REQUEST_OTP' ? 0 : 1);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>

        {/* ── Branded Header ── */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0077cc 100%)`, padding: '18px 20px', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 14,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px', cursor: 'pointer', color: '#fff',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={15} /></button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '8px', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMobile ? <Phone size={18} color="#fff" /> : <Shield size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ABHA Profile Fetch</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Fetch Existing Profile</div>
            </div>
          </div>

          {/* Mode Toggle — only show on first step */}
          {(step === 'SEARCH' || step === 'REQUEST_OTP') && (
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', padding: '3px', marginBottom: '14px' }}>
              {[{ id: 'mobile', icon: <Phone size={13} />, label: 'Mobile Number' }, { id: 'abha', icon: <Shield size={13} />, label: 'ABHA ID' }].map(m => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '7px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    background: activeMode === m.id ? '#fff' : 'transparent',
                    color: activeMode === m.id ? BRAND : 'rgba(255,255,255,0.7)',
                    transition: 'all 150ms'
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Step Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {allSteps.map((label, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <React.Fragment key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', fontSize: '10px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#10b981' : active ? '#fff' : 'rgba(255,255,255,0.2)',
                      color: done ? '#fff' : active ? BRAND : 'rgba(255,255,255,0.55)'
                    }}>
                      {done ? <CheckCircle size={12} /> : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                      {label}
                    </span>
                  </div>
                  {i < allSteps.length - 1 && <ChevronRight size={12} color="rgba(255,255,255,0.35)" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ margin: '14px 20px 0', padding: '10px 13px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', gap: '8px' }}>
            <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: '20px' }}>

          {/* SEARCH (mobile) */}
          {step === 'SEARCH' && (
            <>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                Enter the patient's mobile number to find their linked ABHA accounts.
              </p>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mobile Number</label>
              <div style={{ display: 'flex', marginBottom: '18px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '0 14px', display: 'flex', alignItems: 'center', borderRight: '1px solid #cbd5e1', color: '#475569', fontSize: '14px', fontWeight: 600 }}>+91</div>
                <input
                  className="preg-input"
                  type="text" placeholder="9876543210" value={loginId} maxLength={10} autoFocus
                  onChange={e => setLoginId(e.target.value.replace(/\D/g, ''))}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '18px', fontWeight: 600, letterSpacing: '3px', padding: '12px 14px' }}
                />
              </div>
              <PrimaryBtn onClick={searchByMobile} loading={loading} disabled={loginId.replace(/\D/g,'').length !== 10}>
                Search ABHA Accounts
              </PrimaryBtn>
            </>
          )}

          {/* SELECT (mobile, multiple accounts) */}
          {step === 'SELECT' && (
            <>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                {searchAccounts.length} ABHA accounts found for <strong>+91 {loginId}</strong>. Select one to continue.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {searchAccounts.map(acc => (
                  <button
                    key={acc.index}
                    onClick={() => { setSelectedAccount(acc); setStep('SELECT_OTP_TYPE'); }}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%',
                      transition: 'border-color 150ms, background 150ms'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = BRAND_LIGHT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: BRAND_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={18} color={BRAND} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{acc.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{acc.ABHANumber} · {acc.gender === 'M' ? 'Male' : acc.gender === 'F' ? 'Female' : acc.gender}</div>
                    </div>
                    {loading ? <Loader2 size={16} className="spin" color={BRAND} /> : <ChevronRight size={16} color="#94a3b8" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* REQUEST_OTP (ABHA number flow) */}
          {step === 'REQUEST_OTP' && (
            <>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                Enter the 14-digit ABHA number. An OTP will be sent to the registered mobile.
              </p>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ABHA ID</label>
              <input
                className="preg-input"
                type="text" placeholder="91-XXXX-XXXX-XXXX" value={loginId} maxLength={20} autoFocus
                onChange={e => setLoginId(e.target.value)}
                style={{ width: '100%', fontSize: '17px', fontWeight: 600, letterSpacing: '1px', padding: '12px 14px', marginBottom: '18px', boxSizing: 'border-box' }}
              />
              <PrimaryBtn onClick={requestOtpByAbha} loading={loading} disabled={!loginId.trim()}>
                Send OTP
              </PrimaryBtn>
            </>
          )}

          {/* SELECT_OTP_TYPE (mobile flow) */}
          {step === 'SELECT_OTP_TYPE' && selectedAccount && (
            <>
              {/* Account preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: BRAND_LIGHT, border: `1px solid ${BRAND}25`, borderRadius: '8px', marginBottom: '18px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={17} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{selectedAccount.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedAccount.ABHANumber}</div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', fontWeight: 500 }}>
                Choose where to receive the OTP:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {/* Mobile OTP option — available when account supports MOBILE_OTP */}
                {(!selectedAccount.authMethods || selectedAccount.authMethods.includes('MOBILE_OTP')) && (
                  <button
                    onClick={() => sendOtpByIndex(selectedAccount, searchTxnId, 'abdm')}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                      border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = BRAND_LIGHT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#e8f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={18} color={BRAND} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>Mobile OTP</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>OTP sent to ABHA-registered mobile number</div>
                    </div>
                    {loading ? <Loader2 size={16} className="spin" color={BRAND} /> : <ChevronRight size={16} color="#94a3b8" />}
                  </button>
                )}

                {/* Aadhaar OTP option — available when account supports AADHAAR_OTP */}
                {(!selectedAccount.authMethods || selectedAccount.authMethods.includes('AADHAAR_OTP')) && (
                  <button
                    onClick={() => sendOtpByIndex(selectedAccount, searchTxnId, 'aadhaar')}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                      border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#f5f3ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={18} color="#7c3aed" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>Aadhaar OTP</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>OTP sent to Aadhaar-linked mobile number</div>
                    </div>
                    {loading ? <Loader2 size={16} className="spin" color="#7c3aed" /> : <ChevronRight size={16} color="#94a3b8" />}
                  </button>
                )}
              </div>
            </>
          )}

          {/* VERIFY_OTP (both flows) */}
          {step === 'VERIFY_OTP' && (
            <>
              {selectedAccount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: BRAND_LIGHT, border: `1px solid ${BRAND}30`, borderRadius: '8px', marginBottom: '16px' }}>
                  <User size={16} color={BRAND} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: BRAND }}>{selectedAccount.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedAccount.ABHANumber}</div>
                  </div>
                </div>
              )}
              <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '18px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} />
                OTP sent to the registered mobile number
              </div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enter 6-digit OTP</label>
              <input
                className="preg-input"
                type="text" placeholder="• • • • • •" value={otp} maxLength={6} autoFocus
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', height: '60px', fontSize: '30px', fontWeight: 700,
                  textAlign: 'center', letterSpacing: '12px', marginBottom: '18px',
                  borderColor: otp.length === 6 ? '#059669' : undefined, boxSizing: 'border-box'
                }}
              />
              <SuccessBtn onClick={verifyOtp} loading={loading} disabled={otp.length < 6}>
                Verify & Fetch Profile
              </SuccessBtn>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {(step === 'SELECT' || step === 'SELECT_OTP_TYPE' || step === 'VERIFY_OTP' || step === 'REQUEST_OTP') && (
          <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                setError(null); setOtp('');
                if (step === 'SELECT' || step === 'REQUEST_OTP') setStep(isMobile ? 'SEARCH' : 'REQUEST_OTP');
                else if (step === 'SELECT_OTP_TYPE') setStep(searchAccounts.length > 1 ? 'SELECT' : 'SEARCH');
                else if (step === 'VERIFY_OTP') setStep(isMobile ? 'SELECT_OTP_TYPE' : 'REQUEST_OTP');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#64748b' }}
            >
              ← Back
            </button>
            {step === 'VERIFY_OTP' && (
              <button
                onClick={() => sendOtpByIndex(selectedAccount, searchTxnId, otpType)}
                disabled={loading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: BRAND }}
              >
                Resend OTP
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({ onClick, loading, disabled, children }) {
  const BRAND = '#005eb8';
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      width: '100%', height: '46px', borderRadius: '7px', border: 'none',
      background: loading || disabled ? '#94a3b8' : BRAND,
      color: '#fff', fontSize: '14px', fontWeight: 700,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
    }}>
      {loading ? <><Loader2 size={17} className="spin" /> Please wait…</> : children}
    </button>
  );
}

function SuccessBtn({ onClick, loading, disabled, children }) {
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      width: '100%', height: '46px', borderRadius: '7px', border: 'none',
      background: loading || disabled ? '#94a3b8' : '#059669',
      color: '#fff', fontSize: '14px', fontWeight: 700,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
    }}>
      {loading ? <><Loader2 size={17} className="spin" /> Verifying…</> : <><CheckCircle size={16} /> {children}</>}
    </button>
  );
}
