//layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflowX: 'clip' }}>
      {/* Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main style={{ 
        flex: 1,
        minWidth: 0,
        height: '100vh', 
        background: 'var(--sys-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'clip',
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
