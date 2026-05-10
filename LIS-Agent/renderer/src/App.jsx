import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Worklist from "./pages/Worklist";
import Verification from "./pages/Verification";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import Demos from "./pages/Demos";
import MERILIYZERMICRO from "./pages/merilyxermicro";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/setup" element={<Layout><Setup /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/worklist" element={<Layout><Worklist /></Layout>} />
        <Route path="/verification" element={<Layout><Verification /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/demos" element={<Layout><Demos /></Layout>} />
        <Route path="/demos/micro" element={<Layout><MERILIYZERMICRO /></Layout>} />
        <Route path="/demos/3part" element={<Layout><MERILIYZERMICRO /></Layout>} />
        <Route path="/demos/5part" element={<Layout><MERILIYZERMICRO /></Layout>} />

      </Routes>
    </BrowserRouter>
  );
}