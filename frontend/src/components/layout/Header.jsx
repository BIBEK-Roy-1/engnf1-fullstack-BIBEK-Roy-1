import { useAuth } from "../../context/AuthContext";
import { Menu } from "lucide-react";

function Header({ onMenuClick, title = "Dashboard" }) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-actions">
        <div className="header-profile">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role">
              {user?.role === "ADMIN" ? "Admin" : "Agent"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
