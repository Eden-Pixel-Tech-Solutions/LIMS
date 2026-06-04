import { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  Camera,
  ArrowRight,
  Check
} from 'lucide-react';
import Alert from '../../components/Alert';
import { useAlert } from '../../hooks/useAlert';
import AbhaRegistrationModal from '../../components/AbhaRegistrationModal';
import AbhaFetchModal from '../../components/AbhaFetchModal';
import '../../assets/CSS/PatientRegistration.css';

const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed'];
const OCCS = ['Employed', 'Unemployed', 'Student', 'Retired', 'Self-employed'];
const LANGS = ['English', 'French', 'Spanish', 'Hindi', 'Other'];
const EDUS = ['Primary', 'High School', "Bachelor's", "Master's", 'PhD', 'Other'];
const RELS = ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'None', 'Other'];
const CITIZENS = ['Ghana', 'Nigeria', 'US', 'UK', 'Canada', 'India', 'Other'];
const COUNTRIES = ['Ghana', 'Nigeria', 'US', 'UK', 'Canada', 'India', 'Other'];
const KIN_RELS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Other'];
const PAYERS = ['Self / Out of Pocket', 'Insurance', 'Government / NHIS', 'Employer'];

const INIT = {
  regNo: 'REG-' + Math.floor(10000 + Math.random() * 90000),
  regDate: new Date().toISOString().split('T')[0],
  isNewBorn: false,
  title: '', firstName: '', middleName: '', lastName: '',
  dob: '', ageYears: '', ageMonths: '', ageDays: '',
  gender: '', aadharNumber: '', abhaId: '', maritalStatus: '', occupation: '', language: '',
  educationLevel: '', religion: '', citizen: '', emailId: '', telephone: '', fileRequired: false,
  address: '', suburb: '', city: '', country: '', postalCode: '', postalAddress: false,
  kinSameAddress: false, kinName: '', kinRelation: '', kinTelephone: '',
  kinAddress: '', kinSuburb: '', kinCity: '', kinCountry: '', kinCode: '',
  payerType: '', insuranceProvider: '', policyNumber: '',
};

const Field = ({ label, children, span }) => (
  <div className={`preg-field ${span ? `preg-col-span-${span}` : ''}`}>
    <label className="preg-label">{label}</label>
    {children}
  </div>
);

const Input = (props) => <input className="preg-input" {...props} />;

const Select = ({ options, placeholder = 'Select', ...props }) => (
  <select className="preg-select" {...props}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

function PatientDetails({ onSaveSuccess }) {
  const { alert, showAlert, hideAlert } = useAlert();
  const [data, setData] = useState(INIT);
  const [photo, setPhoto] = useState(null);
  const [cam, setCam] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAbhaModalOpen, setIsAbhaModalOpen] = useState(false);
  const [abhaFetchModal, setAbhaFetchModal] = useState({ open: false, mode: 'mobile' });
  const searchRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!data.dob) return;
    const b = new Date(data.dob), now = new Date();
    let y = now.getFullYear() - b.getFullYear();
    let m = now.getMonth() - b.getMonth();
    let d = now.getDate() - b.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    setData(p => ({ ...p, ageYears: y, ageMonths: m, ageDays: d }));
  }, [data.dob]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setCam(true);
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(s => {
            setStream(s);
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 50);
          })
          .catch(() => { showAlert('Camera access denied.', 'error'); setCam(false); });
      }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        document.querySelector('input[name="firstName"]')?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        document.querySelector('input[name="address"]')?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        document.querySelector('input[name="address"]')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ch = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'kinSameAddress' && checked) {
      setData(p => ({
        ...p, kinSameAddress: true,
        kinAddress: p.address, kinSuburb: p.suburb,
        kinCity: p.city, kinCountry: p.country, kinCode: p.postalCode,
      }));
      return;
    }
    setData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  /* Camera */
  const openCam = async () => {
    setCam(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch { showAlert('Camera access denied.', 'error'); setCam(false); }
  };

  const closeCam = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null); setCam(false);
  };

  const capturePhoto = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setPhoto(c.toDataURL('image/png'));
    closeCam();
  };

  const handleSave = async () => {
    if (!data.firstName || !data.lastName || !data.dob || !data.gender || !data.telephone) {
      showAlert('First Name, Last Name, DOB, Gender and Phone Number are required!', 'warning');
      return;
    }

    try {
      const payload = {
        ...data,
        photo_base64: photo,
        branch_id: localStorage.getItem('branch_id')
      };

      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/patients/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        onSaveSuccess(data.regNo);
      } else {
        showAlert(result.message || 'Error saving patient.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error while saving patient.', 'error');
    }
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/patients/search?q=${encodeURIComponent(val)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setSearchResults(result.patients || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatient = (patient) => {
    setShowDropdown(false);
    setSearchQuery('');
    showAlert(`Returning patient selected: ${patient.first_name} ${patient.last_name}`, 'success');
    if (onSaveSuccess) onSaveSuccess(patient.reg_no);
  };

  const handleAbhaComplete = (profile) => {
    let formattedDob = profile.dob;
    if (formattedDob && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(formattedDob)) {
      const parts = formattedDob.split(/[-/]/);
      formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    if (profile.profilePhoto) setPhoto(profile.profilePhoto);
    setData(prev => ({
      ...prev,
      firstName: profile.firstName || prev.firstName,
      middleName: profile.middleName || prev.middleName,
      lastName: profile.lastName || prev.lastName,
      dob: formattedDob || prev.dob,
      gender: profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Other',
      abhaId: profile.ABHANumber || prev.abhaId,
      citizen: 'India',
      emailId: profile.email || prev.emailId,
      telephone: profile.mobile || prev.telephone,
      address: profile.address || prev.address,
      city: profile.city || prev.city,
      country: 'India',
      postalCode: profile.postalCode || prev.postalCode
    }));
    showAlert('Patient details auto-filled from ABHA Profile successfully!', 'success');
  };

  const handleAbhaFetchComplete = (profile) => {
    const parsedName = profile.name ? profile.name.trim().split(/\s+/) : [];
    let formattedDob = profile.dob || '';
    if (formattedDob && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(formattedDob)) {
      const parts = formattedDob.split(/[-/]/);
      formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const rawPhoto = profile.profilePhoto || profile.photo || '';
    const photoUrl = rawPhoto ? (rawPhoto.startsWith('data:') ? rawPhoto : `data:image/jpeg;base64,${rawPhoto}`) : '';
    if (photoUrl) setPhoto(photoUrl);
    setData(prev => ({
      ...prev,
      firstName: profile.firstName || parsedName[0] || prev.firstName,
      middleName: profile.middleName || (parsedName.length > 2 ? parsedName.slice(1, -1).join(' ') : '') || prev.middleName,
      lastName: profile.lastName || (parsedName.length > 1 ? parsedName[parsedName.length - 1] : '') || prev.lastName,
      dob: formattedDob || prev.dob,
      gender: profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : (prev.gender || 'Other'),
      abhaId: profile.ABHANumber || profile.abhaNumber || prev.abhaId,
      citizen: 'India',
      emailId: profile.email || profile.emailAddress || prev.emailId,
      telephone: profile.mobile || profile.mobileNumber || prev.telephone,
      address: profile.address || prev.address,
      city: profile.districtName || profile.city || prev.city,
      country: 'India',
      postalCode: profile.pincode || profile.postalCode || prev.postalCode
    }));
    showAlert('Patient details fetched from ABHA successfully!', 'success');
  };

  return (
    <>
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={hideAlert}
          duration={4000}
        />
      )}
      <div className="preg-body" style={{ paddingBottom: '80px' }}>
        <div className="preg-card">
          <div className="preg-card-header">
            <span className="preg-card-title">Registration Info</span>
          </div>
          <div className="preg-card-body">
            <div className="preg-meta-strip">
              <div className="preg-meta-item">
                <span className="preg-meta-label">Reg. No.</span>
                <span className="preg-meta-value">{data.regNo}</span>
              </div>
              <div className="preg-meta-item">
                <span className="preg-meta-label">Date</span>
                <Input type="date" name="regDate" value={data.regDate} onChange={ch} />
              </div>

              <div style={{ marginLeft: 24, position: 'relative', flex: 1, maxWidth: '300px' }} ref={searchRef}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="text"
                    className="preg-input"
                    placeholder="Search patient by name, phone..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
                    style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                  {isSearching && (
                    <div style={{ position: 'absolute', right: 12, top: 12, width: 14, height: 14, border: '2px solid #e2e8f0', borderTop: '2px solid var(--blue-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  )}
                </div>

                {showDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
                    {searchResults.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {searchResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => selectPatient(p)}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{p.first_name} {p.last_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.reg_no} • {p.telephone || 'No phone'}</div>
                            </div>
                            <ArrowRight size={16} color="var(--blue-primary)" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                        No patients found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ABHA Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 16 }}>
                <button
                  className="btn-primary"
                  onClick={() => setIsAbhaModalOpen(true)}
                  style={{ height: 42, padding: '0 16px', borderRadius: 8, fontSize: 13 }}
                >
                  + Register with ABHA
                </button>
                <button
                  onClick={() => setAbhaFetchModal({ open: true, mode: 'mobile' })}
                  style={{
                    height: 42, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: '#fff', border: '1.5px solid #005eb8', color: '#005eb8',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ↓ Fetch from ABHA
                </button>
              </div>
              
              {/* Avatar */}
              <div className="preg-avatar" onClick={openCam} title="Add Photo (Alt + C)">
                {photo
                  ? <img src={photo} alt="patient" />
                  : <>
                    <User size={22} color="currentColor" strokeWidth={1.5} />
                    <span>Add Photo</span>
                  </>
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Personal Details ── */}
        <div className="preg-card">
          <div className="preg-card-header">
            <span className="preg-card-title">Personal Details</span>
          </div>
          <div className="preg-card-body">
            <div className="preg-grid">

              <Field label="Full Name *" span={2}>
                <div className="preg-inline">
                  <Select options={TITLES} name="title" value={data.title} onChange={ch} className="preg-select sm" style={{ flex: '0 0 72px' }} placeholder="Title" />
                  <Input name="firstName" value={data.firstName} onChange={ch} placeholder="First Name" />
                  <Input name="middleName" value={data.middleName} onChange={ch} placeholder="Middle" />
                  <Input name="lastName" value={data.lastName} onChange={ch} placeholder="Last Name" />
                </div>
              </Field>

              <Field label="Date of Birth">
                <Input type="date" name="dob" value={data.dob} onChange={ch} />
              </Field>

              <Field label="Age (Y / M / D)*">
                <div className="preg-age-group">
                  <Input value={data.ageYears} readOnly placeholder="Yrs" />
                  <Input value={data.ageMonths} readOnly placeholder="Mo" />
                  <Input value={data.ageDays} readOnly placeholder="Day" />
                </div>
              </Field>

              <Field label="Gender*">
                <Select options={GENDERS} name="gender" value={data.gender} onChange={ch} />
              </Field>

              <Field label="Marital Status">
                <Select options={MARITAL} name="maritalStatus" value={data.maritalStatus} onChange={ch} />
              </Field>

              <Field label="Occupation">
                <Select options={OCCS} name="occupation" value={data.occupation} onChange={ch} />
              </Field>

              <Field label="Language">
                <Select options={LANGS} name="language" value={data.language} onChange={ch} />
              </Field>

              <Field label="Aadhar Number" span={1}>
                <Input type="text" name="aadharNumber" value={data.aadharNumber} onChange={ch} placeholder="XXXX XXXX XXXX" />
              </Field>

              <Field label="ABHA ID" span={1}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <Input type="text" name="abhaId" value={data.abhaId} onChange={ch} placeholder="XX-XXXX-XXXX-XXXX" style={{ flex: 1, minWidth: 0 }} />
                </div>
              </Field>

              <Field label="Education" span={1}>
                <Select name="educationLevel" value={data.educationLevel} onChange={ch} options={EDUS} />
              </Field>

              <Field label="Religion">
                <Select options={RELS} name="religion" value={data.religion} onChange={ch} />
              </Field>

              <Field label="Citizenship">
                <Select options={CITIZENS} name="citizen" value={data.citizen} onChange={ch} />
              </Field>

              <Field label="Email">
                <Input type="email" name="emailId" value={data.emailId} onChange={ch} placeholder="patient@email.com" />
              </Field>

              <Field label="Phone Number*">
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <div className="preg-phone-prefix" style={{ flex: 1, minWidth: 0 }}>
                    <span className="country-code">+91</span>
                    <Input type="tel" name="telephone" value={data.telephone} onChange={ch} placeholder="12345 67890" />
                  </div>
                </div>
              </Field>

              <Field>
                <label className="preg-checkbox-row">
                  <input type="checkbox" name="isNewBorn" checked={data.isNewBorn} onChange={ch} />
                  New Born
                </label>
              </Field>

            </div>
          </div>
        </div>

        {/* ── Home Address ── */}
        <div className="preg-card">
          <div className="preg-card-header">
            <span className="preg-card-title">Home Address</span>
          </div>
          <div className="preg-card-body">
            <div className="preg-grid">
              <Field label="Street Address" span={2}>
                <Input name="address" value={data.address} onChange={ch} placeholder="House no. & street" />
              </Field>
              <Field label="Suburb / Area">
                <Input name="suburb" value={data.suburb} onChange={ch} />
              </Field>
              <Field label="City">
                <Input name="city" value={data.city} onChange={ch} />
              </Field>
              <Field label="Country">
                <Select options={COUNTRIES} name="country" value={data.country} onChange={ch} />
              </Field>
              <Field label="Postal Code">
                <Input name="postalCode" value={data.postalCode} onChange={ch} />
              </Field>
              <Field label="">
                <label className="preg-checkbox-row" style={{ paddingTop: 18 }}>
                  <input type="checkbox" name="postalAddress" checked={data.postalAddress} onChange={ch} />
                  Postal Address
                </label>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Next of Kin ── */}
        <div className="preg-card">
          <div className="preg-card-header">
            <span className="preg-card-title">Next of Kin</span>
            <label className="preg-checkbox-row" style={{ fontSize: 12 }}>
              <input type="checkbox" name="kinSameAddress" checked={data.kinSameAddress} onChange={ch} />
              Same address as patient
            </label>
          </div>
          <div className="preg-card-body">
            <div className="preg-grid">
              <Field label="Full Name" span={2}>
                <Input name="kinName" value={data.kinName} onChange={ch} />
              </Field>
              <Field label="Relation">
                <Select options={KIN_RELS} name="kinRelation" value={data.kinRelation} onChange={ch} />
              </Field>
              <Field label="Telephone">
                <Input type="tel" name="kinTelephone" value={data.kinTelephone} onChange={ch} />
              </Field>
              <Field label="Address" span={2}>
                <Input name="kinAddress" value={data.kinAddress} onChange={ch} />
              </Field>
              <Field label="Suburb">
                <Input name="kinSuburb" value={data.kinSuburb} onChange={ch} />
              </Field>
              <Field label="City">
                <Input name="kinCity" value={data.kinCity} onChange={ch} />
              </Field>
              <Field label="Country">
                <Select options={COUNTRIES} name="kinCountry" value={data.kinCountry} onChange={ch} />
              </Field>
              <Field label="Code">
                <Input name="kinCode" value={data.kinCode} onChange={ch} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Payer ── */}
        <div className="preg-card">
          <div className="preg-card-header">
            <span className="preg-card-title">Payer Information</span>
          </div>
          <div className="preg-card-body">
            <div className="preg-grid preg-grid-3">
              <Field label="Payer Type">
                <Select options={PAYERS} name="payerType" value={data.payerType} onChange={ch} />
              </Field>
              <Field label="Insurance Provider">
                <Input name="insuranceProvider" value={data.insuranceProvider} onChange={ch} />
              </Field>
              <Field label="Policy Number">
                <Input name="policyNumber" value={data.policyNumber} onChange={ch} />
              </Field>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky Action Bar ── */}
      <div className="preg-action-bar">
        <span style={{ fontSize: 12, color: 'var(--text-soft)', marginRight: 'auto' }}>
          Fields marked * are required
        </span>
        <button className="btn-ghost" onClick={() => window.history.back()}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>
          <Check size={15} strokeWidth={2.5} />
          Save & Continue
        </button>
      </div>

      {/* ── Camera Modal ── */}
      {cam && (
        <div className="camera-overlay">
          <div className="camera-box">
            <h3>Capture Patient Photo</h3>
            <div className="camera-video">
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="camera-actions">
              <button type="button" className="btn-ghost" onClick={closeCam}>Cancel</button>
              <button type="button" className="btn-primary" onClick={capturePhoto}>
                <Camera size={14} />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABHA Registration Modal */}
      <AbhaRegistrationModal
        isOpen={isAbhaModalOpen}
        onClose={() => setIsAbhaModalOpen(false)}
        onComplete={handleAbhaComplete}
      />

      {/* ABHA Fetch Modal */}
      <AbhaFetchModal
        isOpen={abhaFetchModal.open}
        mode={abhaFetchModal.mode}
        initialMobile={data.telephone}
        initialAbhaId={data.abhaId}
        onClose={() => setAbhaFetchModal(m => ({ ...m, open: false }))}
        onComplete={handleAbhaFetchComplete}
      />

    </>
  );
}

export default PatientDetails;