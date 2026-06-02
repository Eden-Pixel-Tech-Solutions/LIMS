import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Shield, AlertCircle, Phone, Fingerprint, Loader2, ScanFace, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import '../assets/CSS/PatientRegistration.css';

export default function AbhaRegistrationModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState('ENTER_AADHAAR');
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'face'
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [mobile, setMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [email, setEmail] = useState('');
  const [txnId, setTxnId] = useState('');
  const [xToken, setXToken] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [faceQrUrl, setFaceQrUrl] = useState('');
  const [faceQrDataUrl, setFaceQrDataUrl] = useState('');
  const [faceStatus, setFaceStatus] = useState(''); // PENDING | VERIFIED | FAILED | COMPLETE
  const pollRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!faceQrUrl) return;
    QRCode.toDataURL(faceQrUrl, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
      .then(setFaceQrDataUrl)
      .catch(err => console.error('QR generation error:', err));
  }, [faceQrUrl]);

  if (!isOpen) return null;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7005';

  const handleError = (err, defaultMsg) => {
    console.error(err);
    const msg = err.message || err.response?.data?.error?.message || defaultMsg;
    setError(msg);
    setLoading(false);
  };

  // ---- shared: parse ABDM profile response ----
  const parseProfile = (data) => {
    const profile = data.profile || data.ABHAProfile || data;
    const parsedName = profile.name ? profile.name.trim().split(/\s+/) : [];
    const rawPhoto = profile.profilePhoto || profile.photo || '';
    const profilePhotoUrl = rawPhoto
      ? (rawPhoto.startsWith('data:') ? rawPhoto : `data:image/jpeg;base64,${rawPhoto}`)
      : '';
    return {
      ABHANumber: profile.ABHANumber || '91-1234-5678-9012',
      firstName: profile.firstName || parsedName[0] || 'John',
      middleName: profile.middleName || (parsedName.length > 2 ? parsedName.slice(1, -1).join(' ') : '') || '',
      lastName: profile.lastName || (parsedName.length > 1 ? parsedName[parsedName.length - 1] : '') || 'Doe',
      gender: profile.gender || 'M',
      dob: profile.dob || '1990-01-01',
      mobile: profile.mobile || '',
      address: profile.address || '',
      city: profile.districtName || profile.city || '',
      postalCode: profile.pincode || profile.postalCode || '',
      profilePhoto: profilePhotoUrl
    };
  };

  const fetchSuggestions = async (currentTxnId, currentXToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/abdm/abha/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId: currentTxnId, xToken: currentXToken || xToken })
      });
      const data = await res.json();
      setSuggestions(data.success ? (data.data?.abhaAddresses || ['johndoe1@abdm', 'john.doe123@abdm']) : ['johndoe1@abdm', 'john.doe123@abdm']);
    } catch {
      setSuggestions(['johndoe1@abdm', 'john.doe123@abdm']);
    }
  };

  // ---- OTP flow ----
  const requestAadhaarOtp = async () => {
    if (aadhaar.length !== 12) { setError('Please enter a valid 12-digit Aadhaar number'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/aadhaar/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar })
      });
      const data = await res.json();
      if (data.success && data.data?.txnId) {
        setTxnId(data.data.txnId);
        setStep('VERIFY_AADHAAR_OTP');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to send Aadhaar OTP');
      }
    } catch (err) { handleError(err, 'Failed to send Aadhaar OTP'); }
    setLoading(false);
  };

  const verifyAadhaarOtp = async () => {
    if (aadhaarOtp.length < 6) { setError('Please enter a valid OTP'); return; }
    if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/aadhaar/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, otp: aadhaarOtp, mobile })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed = parseProfile(data.data);
        const tok = data.data.tokens?.token || data.data.token || '';
        setXToken(tok);
        setProfileData(parsed);
        const newTxnId = data.data.txnId || txnId;
        setTxnId(newTxnId);
        await fetchSuggestions(newTxnId, tok);
        setStep('CREATE_ADDRESS');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to verify Aadhaar OTP');
      }
    } catch (err) { handleError(err, 'Failed to verify Aadhaar OTP'); }
    setLoading(false);
  };

  // ---- Face Auth flow ----
  const startFaceAuth = async () => {
    if (aadhaar.length !== 12) { setError('Please enter a valid 12-digit Aadhaar number'); return; }
    if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/face/init`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success && data.data?.txnId) {
        setTxnId(data.data.txnId);
        setFaceQrUrl(data.data.qrUrl);
        setFaceStatus('PENDING');
        setStep('FACE_QR');
        startPolling(data.data.txnId);
      } else {
        throw new Error(data.error?.message || 'Failed to initialize face auth');
      }
    } catch (err) { handleError(err, 'Failed to initialize face auth'); }
    setLoading(false);
  };

  const startPolling = (currentTxnId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => checkFaceStatus(currentTxnId), 5000);
  };

  const checkFaceStatus = async (currentTxnId) => {
    try {
      const res = await fetch(`${API_BASE}/api/abdm/face/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId: currentTxnId })
      });
      const data = await res.json();
      if (data.success && data.data?.status) {
        const status = data.data.status;
        setFaceStatus(status);
        if (status === 'COMPLETE') {
          clearInterval(pollRef.current);
          await enrollFaceAuth(currentTxnId);
        } else if (status === 'FAILED') {
          clearInterval(pollRef.current);
          setError('Face capture failed in ABHA app. Please try again.');
        }
      }
    } catch { /* silent poll failure */ }
  };

  const enrollFaceAuth = async (currentTxnId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/face/enroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar, mobile, txnId: currentTxnId })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed = parseProfile(data.data);
        const tok = data.data.tokens?.token || data.data.token || '';
        setXToken(tok);
        setProfileData(parsed);
        const newTxnId = data.data.txnId || currentTxnId;
        setTxnId(newTxnId);
        await fetchSuggestions(newTxnId, tok);
        setStep('CREATE_ADDRESS');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Face Auth enrollment failed');
      }
    } catch (err) { handleError(err, 'Face Auth enrollment failed'); }
    setLoading(false);
  };

  // ---- shared steps ----
  const createAbhaAddress = async () => {
    if (!selectedAddress) { setError('Please select or enter an ABHA Address'); return; }
    setError(null); setLoading(true);
    try {
      const cleanAddress = selectedAddress.split('@')[0];
      const res = await fetch(`${API_BASE}/api/abdm/abha/address`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, abhaAddress: cleanAddress })
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(prev => ({ ...prev, ABHANumber: selectedAddress }));
        setStep('PROFILE_PREVIEW');
      } else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to create ABHA Address');
      }
    } catch (err) { handleError(err, 'Failed to create ABHA Address'); }
    setLoading(false);
  };

  const requestEmailVerification = async () => {
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/email/verify-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, xToken })
      });
      const data = await res.json();
      if (data.success) { setEmailSent(true); }
      else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to send verification link');
      }
    } catch (err) { handleError(err, 'Failed to send verification link'); }
    setLoading(false);
  };

  const requestMobileOtp = async () => {
    if (mobile.length < 10) { setError('Please enter a valid mobile number'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/mobile/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, mobile })
      });
      const data = await res.json();
      if (data.success) { setTxnId(data.data?.txnId || txnId); setStep('VERIFY_MOBILE_OTP'); }
      else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to send Mobile OTP');
      }
    } catch (err) { handleError(err, 'Failed to send Mobile OTP'); }
    setLoading(false);
  };

  const verifyMobileOtp = async () => {
    if (mobileOtp.length < 6) { setError('Please enter a valid OTP'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/mobile/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, otp: mobileOtp })
      });
      const data = await res.json();
      if (data.success) { setProfileData(p => ({ ...p, mobile })); setStep('PROFILE_PREVIEW'); }
      else {
        const e = data.error;
        throw new Error(typeof e === 'string' ? e : e?.error?.message || e?.message || 'Failed to verify Mobile OTP');
      }
    } catch (err) { handleError(err, 'Failed to verify Mobile OTP'); }
    setLoading(false);
  };

  const finishRegistration = () => {
    onComplete({ ...profileData, email });
    onClose();
  };

  // ---------------- UI Renders ----------------

  const renderStepEnterAadhaar = () => (
    <div className="abha-step">
      <Fingerprint size={48} color="#0284c7" style={{ marginBottom: 16 }} />
      <h2>Create ABHA ID</h2>

      {/* Auth Method Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: '100%' }}>
        <button
          onClick={() => setAuthMethod('otp')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: authMethod === 'otp' ? '#fff' : 'transparent',
            color: authMethod === 'otp' ? '#0284c7' : '#64748b',
            boxShadow: authMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Aadhaar OTP
        </button>
        <button
          onClick={() => setAuthMethod('face')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: authMethod === 'face' ? '#fff' : 'transparent',
            color: authMethod === 'face' ? '#0284c7' : '#64748b',
            boxShadow: authMethod === 'face' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <ScanFace size={14} /> Face Auth
        </button>
      </div>

      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 16, textAlign: 'center' }}>
        {authMethod === 'otp'
          ? "Enter the patient's 12-digit Aadhaar to receive an OTP."
          : "Enter Aadhaar and mobile. A QR code will be shown for the patient to scan with their ABHA app."}
      </p>

      <input
        type="text"
        className="preg-input"
        placeholder="e.g. 1234 5678 9012"
        value={aadhaar}
        maxLength={12}
        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '2px', padding: '12px', marginBottom: authMethod === 'face' ? 12 : 0 }}
      />

      {authMethod === 'face' && (
        <input
          type="text"
          className="preg-input"
          placeholder="Enter 10-digit Mobile Number"
          value={mobile}
          maxLength={10}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
          style={{ fontSize: '16px', textAlign: 'center', padding: '12px' }}
        />
      )}

      <button
        className="btn-primary"
        onClick={authMethod === 'otp' ? requestAadhaarOtp : startFaceAuth}
        disabled={loading || aadhaar.length !== 12 || (authMethod === 'face' && mobile.length !== 10)}
        style={{ marginTop: 24, width: '100%', padding: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {loading ? <Loader2 className="spin" size={18} /> : authMethod === 'otp' ? 'Request OTP' : <><ScanFace size={16} /> Generate QR Code</>}
      </button>
    </div>
  );

  const renderStepVerifyAadhaarOtp = () => (
    <div className="abha-step">
      <Shield size={48} color="#0284c7" style={{ marginBottom: 16 }} />
      <h2>Enter Aadhaar OTP</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 24, textAlign: 'center' }}>
        OTP sent to the mobile number registered with Aadhaar ending in ...{aadhaar.slice(-4)}
      </p>
      <input
        type="text" className="preg-input" placeholder="Enter 6-digit OTP" value={aadhaarOtp} maxLength={6}
        onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '4px', padding: '12px', marginBottom: 16 }}
      />
      <input
        type="text" className="preg-input" placeholder="Enter 10-digit Mobile Number" value={mobile} maxLength={10}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '2px', padding: '12px' }}
      />
      <button
        className="btn-primary" onClick={verifyAadhaarOtp}
        disabled={loading || aadhaarOtp.length < 6 || mobile.length !== 10}
        style={{ marginTop: 24, width: '100%', padding: '12px', justifyContent: 'center' }}
      >
        {loading ? <Loader2 className="spin" size={18} /> : 'Verify & Continue'}
      </button>
    </div>
  );

  const renderStepFaceQR = () => {
    const statusColors = { PENDING: '#f59e0b', VERIFIED: '#3b82f6', FAILED: '#ef4444', COMPLETE: '#10b981' };
    const statusLabels = { PENDING: 'Waiting for patient to scan...', VERIFIED: 'Face scan in progress...', FAILED: 'Scan failed', COMPLETE: 'Face captured! Enrolling...' };

    return (
      <div className="abha-step" style={{ width: '100%' }}>
        <ScanFace size={40} color="#0284c7" style={{ marginBottom: 12 }} />
        <h2 style={{ marginBottom: 8 }}>Scan QR with ABHA App</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 16, textAlign: 'center' }}>
          Ask the patient to open their <strong>ABHA mobile app</strong>, tap <strong>QR Scanner</strong>, scan this code, and complete face capture.
        </p>

        {/* QR Code */}
        <div style={{ background: '#fff', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: 8 }}>
          {faceQrDataUrl
            ? <img src={faceQrDataUrl} alt="Face Auth QR Code" width={220} height={220} />
            : <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spin" size={32} color="#0284c7" /></div>
          }
        </div>

        {/* Raw URL for verification */}
        <div style={{ fontSize: '10px', color: '#94a3b8', wordBreak: 'break-all', textAlign: 'center', marginBottom: 12, padding: '4px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          {faceQrUrl}
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
          borderRadius: '8px', marginBottom: 16, width: '100%',
          background: faceStatus === 'FAILED' ? '#fef2f2' : '#f0f9ff',
          border: `1px solid ${statusColors[faceStatus] || '#bae6fd'}`
        }}>
          {loading || (faceStatus !== 'FAILED' && faceStatus !== 'COMPLETE')
            ? <Loader2 size={16} className="spin" style={{ color: statusColors[faceStatus] || '#0284c7' }} />
            : <CheckCircle size={16} color={statusColors[faceStatus]} />
          }
          <span style={{ fontSize: '13px', fontWeight: 500, color: statusColors[faceStatus] || '#0284c7' }}>
            {statusLabels[faceStatus] || 'Initializing...'}
          </span>
        </div>

        {faceStatus === 'FAILED' && (
          <button
            className="btn-primary" onClick={startFaceAuth}
            style={{ width: '100%', padding: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Regenerate QR Code
          </button>
        )}
      </div>
    );
  };

  const renderStepCreateAddress = () => (
    <div className="abha-step" style={{ width: '100%' }}>
      <CheckCircle size={48} color="#0284c7" style={{ marginBottom: 16 }} />
      <h2>Choose ABHA Address</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 24, textAlign: 'center' }}>
        Select a suggested ABHA address or create your own.
      </p>
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
          {suggestions.map((sugg, idx) => (
            <button key={idx} onClick={() => setSelectedAddress(sugg)} style={{
              padding: '8px 12px', borderRadius: '20px', border: '1px solid #0ea5e9',
              background: selectedAddress === sugg ? '#0ea5e9' : '#f0f9ff',
              color: selectedAddress === sugg ? '#fff' : '#0369a1',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500
            }}>
              {sugg}
            </button>
          ))}
        </div>
      )}
      <input
        type="text" className="preg-input" placeholder="Custom ABHA Address (e.g. name12345)" value={selectedAddress}
        onChange={(e) => setSelectedAddress(e.target.value.toLowerCase())}
        style={{ fontSize: '16px', textAlign: 'center', padding: '12px', marginBottom: 8 }}
      />
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: 16, textAlign: 'center' }}>
        8-18 characters. Must start with a letter. Only letters, numbers, dot (.), and underscore (_).
      </div>
      <button
        className="btn-primary" onClick={createAbhaAddress}
        disabled={loading || !(/^[a-z][a-z0-9._]{7,17}$/.test(selectedAddress.split('@')[0]))}
        style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
      >
        {loading ? <Loader2 className="spin" size={18} /> : 'Create Address'}
      </button>
    </div>
  );

  const renderStepProfilePreview = () => (
    <div className="abha-step" style={{ alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {profileData.profilePhoto
          ? <img src={profileData.profilePhoto} alt="ABHA Profile" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} />
          : <CheckCircle size={32} color="#10b981" />
        }
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>ABHA Created Successfully</h2>
          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>{profileData.ABHANumber}</span>
        </div>
      </div>
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', width: '100%', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
          <div><strong>Name:</strong> {profileData.firstName} {profileData.middleName} {profileData.lastName}</div>
          <div><strong>DOB:</strong> {profileData.dob}</div>
          <div><strong>Gender:</strong> {profileData.gender}</div>
          <div>
            <strong>Mobile:</strong> {profileData.mobile
              ? <span style={{ color: '#10b981' }}>{profileData.mobile} ✓</span>
              : <span style={{ color: '#ef4444' }}>Not Linked</span>}
          </div>
          <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {profileData.address}, {profileData.city} - {profileData.postalCode}</div>
        </div>
      </div>

      {!profileData.mobile ? (
        <div style={{ width: '100%' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Link Mobile Number</h4>
          <input
            type="text" className="preg-input" placeholder="Enter 10-digit Mobile Number" value={mobile} maxLength={10}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-ghost" onClick={finishRegistration} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
              Skip & Auto-fill
            </button>
            <button className="btn-primary" onClick={requestMobileOtp} disabled={loading || mobile.length !== 10} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <Loader2 className="spin" size={18} /> : 'Send Mobile OTP'}
            </button>
          </div>
        </div>
      ) : !emailSent ? (
        <div style={{ width: '100%' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Verify Email (Optional)</h4>
          <input
            type="email" className="preg-input" placeholder="Enter Email Address" value={email}
            onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-ghost" onClick={finishRegistration} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
              Skip & Auto-fill
            </button>
            <button className="btn-primary" onClick={requestEmailVerification} disabled={loading || !email.includes('@')} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
              {loading ? <Loader2 className="spin" size={18} /> : 'Send Link'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', marginBottom: 20, padding: '12px', background: '#d1fae5', borderRadius: '8px' }}>
            <CheckCircle size={20} />
            <span style={{ fontWeight: 500 }}>Verification email sent successfully!</span>
          </div>
          <button className="btn-primary" onClick={finishRegistration} style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
            Auto-fill Registration Form
          </button>
        </div>
      )}
    </div>
  );

  const renderStepVerifyMobileOtp = () => (
    <div className="abha-step">
      <Phone size={48} color="#0284c7" style={{ marginBottom: 16 }} />
      <h2>Verify Mobile OTP</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 24, textAlign: 'center' }}>OTP sent to {mobile}</p>
      <input
        type="text" className="preg-input" placeholder="Enter 6-digit OTP" value={mobileOtp} maxLength={6}
        onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '4px', padding: '12px' }}
      />
      <button
        className="btn-primary" onClick={verifyMobileOtp} disabled={loading || mobileOtp.length < 6}
        style={{ marginTop: 24, width: '100%', padding: '12px', justifyContent: 'center' }}
      >
        {loading ? <Loader2 className="spin" size={18} /> : 'Verify Mobile'}
      </button>
    </div>
  );

  return (
    <div className="abha-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="abha-modal-content" style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Register with ABHA</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '16px 24px 0', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#991b1b', fontSize: '13px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {step === 'ENTER_AADHAAR' && renderStepEnterAadhaar()}
          {step === 'VERIFY_AADHAAR_OTP' && renderStepVerifyAadhaarOtp()}
          {step === 'FACE_QR' && renderStepFaceQR()}
          {step === 'CREATE_ADDRESS' && renderStepCreateAddress()}
          {step === 'PROFILE_PREVIEW' && renderStepProfilePreview()}
          {step === 'VERIFY_MOBILE_OTP' && renderStepVerifyMobileOtp()}
        </div>

        {/* Back footer */}
        {(step === 'VERIFY_AADHAAR_OTP' || step === 'FACE_QR' || step === 'VERIFY_MOBILE_OTP') && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <button
              className="btn-ghost"
              onClick={() => {
                if (step === 'VERIFY_AADHAAR_OTP') setStep('ENTER_AADHAAR');
                if (step === 'FACE_QR') { clearInterval(pollRef.current); setFaceQrUrl(''); setFaceQrDataUrl(''); setFaceStatus(''); setStep('ENTER_AADHAAR'); }
                if (step === 'VERIFY_MOBILE_OTP') setStep('PROFILE_PREVIEW');
                setError(null);
              }}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
