import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Billing/Register';
import PatientRegistration from './pages/Patients/PatientRegistration';
import StaffManagement from './pages/Staff/StaffManagement';
import HospitalInfra from './pages/Settings/HospitalInfra';
import DutyScheduler from './pages/Staff/DutyScheduler';
import BillingPackages from './pages/Billing/BillingPackages';
import LabTestManagement from './pages/Lab/LabTestManagement';
import LabWorklist from './pages/Lab/LabWorklist';
import SampleList from './pages/Lab/SampleList';
import LabVerification from './pages/Lab/LabVerification';
import LabReportDownload from './pages/Lab/LabReportDownload';
import LabActivityLogs from './pages/Lab/LabActivityLogs';
import InventoryDashboard from './pages/Inventory/InventoryDashboard';
import Billings from './pages/Billing/Billings';
import PatientLogin from './pages/Patients/PatientLogin';
import LabTVMode from './pages/Lab/LabTVMode';
import LabTrack from './pages/Lab/LabTrack';
import PatientProfile from './pages/Patients/PatientProfile';
import PatientReports from './pages/Patients/PatientReports';
import InventoryItemMaster from './pages/Inventory/InventoryItemMaster';
import InventoryVendors from './pages/Inventory/InventoryVendors';
import VendorManagement from './pages/Inventory/VendorManagement';
import PurchaseManagement from './pages/Inventory/PurchaseManagement';
import InventoryStockManagement from './pages/Inventory/InventoryStockManagement';
import InventoryTransactions from './pages/Inventory/InventoryTransactions';
import InventoryTestMapping from './pages/Inventory/InventoryTestMapping';
import InventoryNetworkDashboard from './pages/Inventory/InventoryNetworkDashboard';
import InventoryOverview from './pages/Inventory/InventoryOverview';
import InventoryTransfers from './pages/Inventory/InventoryTransfers';
import PurchasePayments from './pages/Inventory/PurchasePayments';
import BillingOverview from './pages/Billing/BillingOverview';
import Settings from './pages/Settings/Settings';
import Hospitals from './pages/Settings/Hospitals';
import Dashboard from './pages/Dashboard';
import DisasterDashboard from './pages/DisasterDashboard';
import MachineNetwork from './pages/Settings/MachineNetwork';
import Layout from './components/Layout';
import PatientLayout from './components/PatientLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient-login" element={<PatientLogin />} />

        {/* Public App Routes */}
        <Route path="/lab-tv" element={<LabTVMode />} />
        <Route path="/track" element={<LabTrack />} />
        <Route path="/track/:referenceId" element={<LabTrack />} />
        <Route path="/disaster-dashboard" element={<DisasterDashboard />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patient-registration" element={<PatientRegistration />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/hospital-infra" element={<HospitalInfra />} />
          <Route path="/duty-scheduler" element={<DutyScheduler />} />
          <Route path="/billing-packages" element={<BillingPackages />} />
          <Route path="/billing-overview" element={<BillingOverview />} />
          <Route path="/lab-test-management" element={<LabTestManagement />} />
          <Route path="/lab-worklist" element={<LabWorklist />} />
          <Route path="/lab-sample-list" element={<SampleList />} />
          <Route path="/lab-verification" element={<LabVerification />} />
          <Route path="/lab-reports" element={<LabReportDownload />} />
          <Route path="/lab-logs" element={<LabActivityLogs />} />
          <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
          <Route path="/inventory" element={<InventoryNetworkDashboard />} />
          <Route path="/inventory/overview" element={<InventoryOverview />} />
          <Route path="/inventory/items" element={<InventoryItemMaster />} />
          <Route path="/inventory/vendors" element={<InventoryVendors />} />
          <Route path="/inventory/ap" element={<PurchasePayments />} />
          <Route path="/inventory/purchase" element={<PurchaseManagement />} />
          <Route path="/inventory/stock" element={<InventoryStockManagement />} />
          <Route path="/inventory/transactions" element={<InventoryTransactions />} />
          <Route path="/inventory/transfers" element={<InventoryTransfers />} />
          <Route path="/inventory/mappings" element={<InventoryTestMapping />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/machine-network" element={<MachineNetwork />} />
        </Route>

        {/* Patient Portal Routes */}
        <Route element={<PatientLayout />}>
          <Route path="/patient-portal/profile" element={<PatientProfile />} />
          <Route path="/patient-portal/reports" element={<PatientReports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
