import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import merilLogo from '../assets/meril.png';
import '../assets/CSS/Sidebar.css';

const LOGO_SRC = '/meril_hims_logo.png';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    id: 'hospitals',
    label: 'Hospital Network',
    path: '/hospitals',
    roles: ['Central', 'Sub-Central', 'Branch'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 7v14M21 7v14M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 9h6M9 13h6M9 17h6" />
      </svg>
    )
  },
  {
    id: 'machine-network',
    label: 'Machine Network',
    path: '/machine-network',
    roles: ['Central'], // typically Admin/Central
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <path d="M22 10H2" />
        <path d="M12 10v4" />
        <path d="M8 10v4" />
        <path d="M16 10v4" />
      </svg>
    )
  },
  {
    id: 'patients',
    label: 'Registration',
    path: '/patient-registration',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" />
      </svg>
    )
  },

  {
    id: 'staff',
    label: 'Employee Management',
    path: '/staff-management',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    )
  },
  {
    id: 'duty',
    label: 'Duty Roster',
    path: '/duty-scheduler',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    id: 'billing',
    label: 'Billing & Payments',
    path: '/billing-overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    )
  },
  {
    id: 'billing-packages',
    label: 'Billing Packages',
    path: '/billing-packages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    )
  },

  {
    id: 'laboratory',
    label: 'Laboratory',
    path: '/lab-worklist',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19.8 18.4L14 10.67V6.75l1.35-1.35c.18-.18.28-.43.28-.69V2.25c0-.41-.34-.75-.75-.75h-6c-.41 0-.75.34-.75.75v2.46c0 .26.1.51.28.69L10 6.75v3.92L4.2 18.4c-.77 1.16-.13 2.73 1.3 2.73h13c1.43 0 2.07-1.57 1.3-2.73z" />
        <path d="M10 15v2h4v-2" strokeLinecap="round" />
      </svg>
    ),
    children: [
      {
        id: 'lab-worklist',
        label: 'Worklist',
        path: '/lab-worklist',
      },
      {
        id: 'lab-sample-list',
        label: 'Sample List',
        path: '/lab-sample-list',
      },
      {
        id: 'lab-verification',
        label: 'Verification',
        path: '/lab-verification',
      },
      {
        id: 'lab-reports',
        label: 'Reports',
        path: '/lab-reports',
      },
      {
        id: 'lab-test-management',
        label: 'Test Management',
        path: '/lab-test-management',
      },
      {
        id: 'lab-logs',
        label: 'Audit Logs',
        path: '/lab-logs',
      },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    children: [
      { id: 'inventory-dashboard', label: 'Network Dashboard', path: '/inventory' },
      { id: 'inventory-overview', label: 'Overall Stock', path: '/inventory/overview' },
      { id: 'inventory-items', label: 'Master', path: '/inventory/items' },
      { id: 'inventory-vendors', label: 'Vendors', path: '/inventory/vendors' },
      { id: 'inventory-ap', label: 'Accounts Payable', path: '/inventory/ap' },
      { id: 'inventory-purchase', label: 'Purchase', path: '/inventory/purchase' },
      { id: 'inventory-stock', label: 'Item Wise Stock', path: '/inventory/stock' },
      { id: 'inventory-transfers', label: 'Transfers', path: '/inventory/transfers' },
      { id: 'inventory-transactions', label: 'Transactions', path: '/inventory/transactions' },
      { id: 'inventory-mappings', label: 'Test Mappings', path: '/inventory/mappings' },
    ]
  },
  {
    id: 'infra',
    label: 'Hospital Infrastructure',
    path: '/hospital-infra',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2M3 7h18M3 7v14M21 7v14M9 3v4M15 3v4M9 21V11M15 21V11M3 11h18" />
      </svg>
    )
  },
  {
    id: 'disaster-dashboard',
    label: 'Disease Heatmap',
    path: '/disaster-dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M12 12v10" strokeDasharray="3 3" /><circle cx="12" cy="12" r="3" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    )
  },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userRoleLevel = localStorage.getItem('role_level') || 'Branch';
  const userRole = localStorage.getItem('role') || ''; // e.g., 'Lab Technician', 'Lab Doctor', 'Receptionist'

  const filteredNavItems = NAV_ITEMS.filter(item => {
    // Basic role level filtering
    if (item.roles && !item.roles.includes(userRoleLevel)) return false;

    const lowerRole = userRole.toLowerCase();
    const isLabRole = lowerRole === 'lab technician' || lowerRole === 'lab_tech' || lowerRole === 'lab_doctor' || lowerRole === 'lab doctor';

    // Lab Roles logic: Only show Dashboard, Laboratory, Settings
    if (isLabRole) {
      if (!['dashboard', 'laboratory', 'settings'].includes(item.id)) return false;
    }

    // Receptionist logic: remove Laboratory and Duty Roster
    if (lowerRole === 'receptionist') {
      if (item.id === 'laboratory' || item.id === 'duty') return false;
    }

    return true;
  }).map(item => {
    // Lab Technician logic: only show Worklist and Reports in Laboratory
    const isLabTech = userRole.toLowerCase() === 'lab technician' || userRole.toLowerCase() === 'lab_tech';
    if (item.id === 'laboratory' && isLabTech) {
      return {
        ...item,
        children: item.children.filter(child => 
          child.id === 'lab-worklist' || child.id === 'lab-reports' || child.id === 'lab-sample-list' || child.id === 'lab-logs'
        )
      };
    }
    // Lab Doctor: sees all children, so no change needed
    return item;
  });

  const handleLogout = () => {
    // Clear auth state if any (future)
    navigate('/');
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const isChildActive = (children) => {
    return children?.some(child => location.pathname === child.path);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container" style={{ background: 'none' }}>
          <img src={merilLogo} alt="Meril Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        </div>
        <span className="sidebar-brand">MERIL LIS</span>

        {/* Toggle Hook */}
        <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isDropdownOpen = openDropdown === item.id;
          const isActiveParent = hasChildren && isChildActive(item.children);

          if (hasChildren) {
            return (
              <div key={item.id} className="nav-dropdown">
                <button
                  className={`nav-item ${isActiveParent ? 'active' : ''}`}
                  onClick={() => toggleDropdown(item.id)}
                  title={collapsed ? item.label : ''}
                >
                  <div className="nav-icon">{item.icon}</div>
                  <span className="nav-text">{item.label}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                    style={{ marginLeft: 'auto', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {!collapsed && isDropdownOpen && (
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <div className="nav-icon">{item.icon}</div>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <div className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </div>
          <span className="nav-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
