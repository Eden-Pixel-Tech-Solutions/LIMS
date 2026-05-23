import { useState, useEffect } from 'react';
import Alert from '../../components/Alert';
import { useAlert } from '../../hooks/useAlert';
import '../../assets/CSS/StaffManagement.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7005';

const ROLES = ['Doctor', 'Receptionist', 'HR', 'Admin', 'Lab Head', 'Lab Technician', 'Lab Admin'];

function StaffManagement() {
  const { alert, showAlert, hideAlert } = useAlert();
  const [stats, setStats] = useState({});
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || '';
  const canAddStaff = ['Admin', 'Lab Head', 'Doctor', 'Lab Admin'].includes(userRole);
  const isSuperAdmin = user.role_level === 'State' || user.role_level === 'District';
  const [branches, setBranches] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Doctor',
    department: '',
    staffId: 'STF-' + Math.floor(1000 + Math.random() * 9000),
    password: 'password123',
    branch_id: user.branch_id || ''
  });

  // Fetch departments from backend
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/departments?is_active=true`);
      const data = await res.json();
      if (data.success) {
        const deptNames = data.departments.map(d => d.name);
        setDepartments(deptNames);
        // Set default department to first one
        setFormData(prev => ({ ...prev, department: deptNames[0] || '' }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchStats();
    fetchStaff();
    if (isSuperAdmin) fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/branches`);
      const data = await res.json();
      if (data.success) setBranches(data.branches);
    } catch (err) { console.error('Error fetching branches:', err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/staff/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error('Error fetching stats:', err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/staff/list`);
      const data = await res.json();
      if (data.success) setStaff(data.staff);
    } catch (err) { console.error('Error fetching staff list:', err); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/staff/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Staff member added successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          firstName: '', lastName: '', email: '', phone: '',
          role: 'Doctor', department: departments[0] || '',
          staffId: 'STF-' + Math.floor(1000 + Math.random() * 9000),
          password: 'password123'
        });
        fetchStats();
        fetchStaff();
      } else {
        showAlert(data.message || 'Error adding staff', 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      showAlert('Network error adding staff.', 'error');
    }
  };

  const filteredStaff = staff.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.staff_id.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="staff-page">
        <div className="staff-header">
          <div>
            <h1>Employee Management</h1>
            <p>Manage hospital personnel and monitor role distribution</p>
          </div>
          {canAddStaff && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add New Staff
            </button>
          )}
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Staff</span>
            <span className="stat-value">{staff.length}</span>
          </div>
          {ROLES.map(role => (
            <div className="stat-card" key={role}>
              <span className="stat-label">{role}s</span>
              <span className="stat-value">{stats[role] || 0}</span>
            </div>
          ))}
        </div>

        {/* Staff Directory Table */}
        <div className="staff-table-card">
          <div className="table-toolbar">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="preg-input"
                placeholder="Search by name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="staff-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Email</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading staff records...</td></tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--brand-blue)' }}>{s.staff_id}</td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>
                      <span className={`role-badge role-${s.role.toLowerCase().replace(' ', '-')}`}>
                        {s.role}
                      </span>
                    </td>
                    <td>{s.department}</td>
                    <td>{s.email}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No staff members found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-header-info">
                  <h3>Create New Staff Member</h3>
                  <p>Fill in the details to register a new employee in the system.</p>
                </div>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddStaff}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="preg-field">
                      <label className="preg-label">First Name</label>
                      <div className="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <input type="text" className="preg-input" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" required />
                      </div>
                    </div>
                    <div className="preg-field">
                      <label className="preg-label">Last Name</label>
                      <div className="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <input type="text" className="preg-input" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" required />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="preg-field">
                      <label className="preg-label">Staff ID</label>
                      <div className="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h10" />
                        </svg>
                        <input type="text" className="preg-input" name="staffId" value={formData.staffId} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="preg-field">
                      <label className="preg-label">Official Email</label>
                      <div className="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m3 7 9 6 9-6M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <input type="email" className="preg-input" name="email" value={formData.email} onChange={handleInputChange} placeholder="john.doe@hospital.com" required />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="preg-field">
                      <label className="preg-label">Designation / Role</label>
                      <select className="preg-select" name="role" value={formData.role} onChange={handleInputChange}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {isSuperAdmin ? (
                      <div className="preg-field">
                        <label className="preg-label">Assign to Facility/Branch</label>
                        <select className="preg-select" name="branch_id" value={formData.branch_id} onChange={handleInputChange} required>
                          <option value="">Select Branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="preg-field">
                        <label className="preg-label">Department</label>
                        <select className="preg-select" name="department" value={formData.department} onChange={handleInputChange}>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <div className="preg-field">
                      <label className="preg-label">Initial Password</label>
                      <div className="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <input type="text" className="preg-input" name="password" value={formData.password} onChange={handleInputChange} required />
                      </div>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <div className="form-row">
                      <div className="preg-field">
                        <label className="preg-label">Department</label>
                        <select className="preg-select" name="department" value={formData.department} onChange={handleInputChange}>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="preg-field">
                        <label className="preg-label">Initial Password</label>
                        <input type="text" className="preg-input" name="password" value={formData.password} onChange={handleInputChange} required />
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-ghost" onClick={() => setShowAddModal(false)}>Discard</button>
                  <button type="submit" className="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Register Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default StaffManagement;
