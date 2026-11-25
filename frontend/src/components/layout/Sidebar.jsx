import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  CalendarCheck,
  Settings,
  ClipboardList,
  ChartNoAxesCombined,
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const workspaceLinks = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Triage Queue", path: "/triage", icon: Ticket },
  { label: "Resources & Booking", path: "/resources", icon: CalendarDays },
  { label: "My Bookings", path: "/my-bookings", icon: CalendarCheck },
];

const adminLinks = [
  { label: "Manage Resources", path: "/admin/resources", icon: Settings },
  { label: "Manage Bookings", path: "/admin/bookings", icon: ClipboardList },
  { label: "Analytics", path: "/admin/analytics", icon: ChartNoAxesCombined },
];

function Sidebar({ collapsed, setCollapsed, isAdmin = false, onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const renderLink = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={collapsed ? item.label : undefined}
        onClick={onNavigate}
        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
      >
        <Icon size={19} strokeWidth={1.8} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Layers size={21} />
        </div>

        {!collapsed && <span className="brand-name">TriageSync</span>}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <p className="nav-heading">WORKSPACE</p>}
          {workspaceLinks.map(renderLink)}
        </div>

        {isAdmin && (
          <div className="nav-section">
            {!collapsed && <p className="nav-heading">ADMINISTRATION</p>}
            {adminLinks.map(renderLink)}
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-link" type="button" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          className="collapse-button"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
