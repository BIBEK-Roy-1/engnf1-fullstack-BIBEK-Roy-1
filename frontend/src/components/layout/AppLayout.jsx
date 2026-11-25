
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Triage Queue',
  '/resources': 'Resources & Booking',
  '/my-bookings': 'My Bookings',
  '/admin/resources': 'Manage Resources',
  '/admin/bookings': 'Manage Bookings',
  '/admin/analytics': 'Analytics',
};

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const location = useLocation();
  const title = pageTitles[location.pathname] || 'TriageSync';

 
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-layout">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={mobileOpen ? 'mobile-sidebar open' : 'mobile-sidebar'}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isAdmin={isAdmin}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="desktop-sidebar">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isAdmin={isAdmin}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <main className="main-area">
        <Header
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppLayout;
