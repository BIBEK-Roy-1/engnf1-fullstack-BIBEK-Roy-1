
import { Bell, Search, Menu } from 'lucide-react';

function Header({ onMenuClick, title = 'Dashboard' }) {
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
        <div className="header-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>

        <button
          className="header-icon-button"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>

        <div className="header-profile">
          <div className="profile-avatar">A</div>
          <div className="profile-info">
            <span className="profile-name">Agent Demo</span>
            <span className="profile-role">Agent</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
