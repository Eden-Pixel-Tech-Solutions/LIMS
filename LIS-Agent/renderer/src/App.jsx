import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Worklist from "./pages/Worklist";
import SampleList from "./pages/SampleList";
import Verification from "./pages/Verification";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import Demos from "./pages/Demos";
import MERILIYZERMICRO from "./pages/merilyxermicro";
import EditResults from "./pages/EditResults";
import KyroSetupCliniQuant from "./pages/KyroSetupCliniQuant";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/setup" element={<Layout><Setup /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/worklist" element={<Layout><Worklist /></Layout>} />
        <Route path="/sample-list" element={<Layout><SampleList /></Layout>} />
        <Route path="/verification" element={<Layout><Verification /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
        <Route path="/logs" element={<Layout><Logs /></Layout>} />
        <Route path="/edit-results" element={<Layout><EditResults /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/demos" element={<Layout><Demos /></Layout>} />
        <Route path="/demos/micro" element={<Layout><MERILIYZERMICRO /></Layout>} />
        <Route path="/demos/3part" element={<Layout><MERILIYZERMICRO /></Layout>} />
        <Route path="/demos/5part" element={<Layout><MERILIYZERMICRO /></Layout>} />
        <Route path="/setup/cliniquant" element={<Layout><KyroSetupCliniQuant /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}