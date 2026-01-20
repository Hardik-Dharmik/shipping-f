import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/calculate-rate') return 'Rate Calculator';
    if (path === '/orders') return 'Orders';
    if (path === '/admin/signups/pending') return 'Pending Approvals';
    if (path === '/admin/users') return 'Users';
    return 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <header className={`header ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-content">
        <h1 className="header-title"></h1>
        {user && (
          <div className="header-user" ref={dropdownRef}>
            <button 
              className="header-profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Profile menu"
            >
              <div className="header-profile-avatar">
                {getInitials(user.name)}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{user.name}</span>
                <span className="header-user-role">{isAdmin ? 'Admin' : 'User'}</span>
              </div>
              <svg 
                className={`header-dropdown-icon ${dropdownOpen ? 'open' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="header-dropdown">
                <div className="header-dropdown-header">
                  <div className="header-dropdown-avatar">
                    {getInitials(user.name)}
                  </div>
                  <div className="header-dropdown-user-info">
                    <div className="header-dropdown-name">{user.name}</div>
                    <div className="header-dropdown-email">{user.email}</div>
                    <div className="header-dropdown-role">{isAdmin ? 'Administrator' : 'User'}</div>
                  </div>
                </div>
                <div className="header-dropdown-divider"></div>
                <button 
                  className="header-dropdown-item"
                  onClick={handleLogout}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

