import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/env.js';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { logout, user, isAdmin } = useAuth();
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);

  // Auto-open orders menu if on orders page
  useEffect(() => {
    if (location.pathname.startsWith('/orders')) {
      setOrdersMenuOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
        {!isCollapsed && <h2>{config.app.name}</h2>}
      </div>
      <nav className="sidebar-nav">
        {!isAdmin && (
          <>
            <Link 
              to="/home" 
              className={`sidebar-link ${location.pathname === '/home' ? 'active' : ''}`}
              title={isCollapsed ? 'Home' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11l9-7 9 7" />
                <path d="M9 22V12h6v10" />
              </svg>
              {!isCollapsed && <span>Home</span>}
            </Link>
            <Link 
              to="/calculate-rate" 
              className={`sidebar-link ${location.pathname === '/calculate-rate' ? 'active' : ''}`}
              title={isCollapsed ? 'Rate Calculator' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {!isCollapsed && <span>Rate Calculator</span>}
            </Link>
            <div className="sidebar-menu">
              <button
                className={`sidebar-menu-toggle ${location.pathname.startsWith('/orders') ? 'active' : ''}`}
                onClick={() => !isCollapsed && setOrdersMenuOpen(!ordersMenuOpen)}
                title={isCollapsed ? 'Orders' : ''}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                {!isCollapsed && (
                  <>
                    <span>Orders</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className={`menu-arrow ${ordersMenuOpen ? 'open' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </>
                )}
              </button>
              {!isCollapsed && (
                <div className={`sidebar-submenu ${ordersMenuOpen ? 'open' : ''}`}>
                  <Link 
                    to="/orders/create" 
                    className={`sidebar-submenu-link ${location.pathname === '/orders/create' ? 'active' : ''}`}
                  >
                    <span>Create Order</span>
                  </Link>
            <Link 
                    to="/orders/list" 
                    className={`sidebar-submenu-link ${location.pathname === '/orders/list' ? 'active' : ''}`}
                  >
                    <span>Order List</span>
                  </Link>
                  <Link
                    to="/orders/address-forms"
                    className={`sidebar-submenu-link ${location.pathname === '/orders/address-forms' ? 'active' : ''}`}
                  >
                    <span>Address Forms</span>
                  </Link>
                </div>
              )}
            </div>
            <Link 
              to="/billing" 
              className={`sidebar-link ${location.pathname === '/billing' ? 'active' : ''}`}
              title={isCollapsed ? 'Billing' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {!isCollapsed && <span>Billing</span>}
            </Link>
            <Link 
              to="/tickets" 
              className={`sidebar-link ${location.pathname === '/tickets' ? 'active' : ''}`}
              title={isCollapsed ? 'Tickets' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5v2" />
                <path d="M15 11v2" />
                <path d="M15 17v2" />
                <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
              </svg>
              {!isCollapsed && <span>Tickets</span>}
            </Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link 
              to="/home" 
              className={`sidebar-link ${location.pathname === '/home' ? 'active' : ''}`}
              title={isCollapsed ? 'Home' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11l9-7 9 7" />
                <path d="M9 22V12h6v10" />
              </svg>
              {!isCollapsed && <span>Home</span>}
            </Link>
            <Link 
              to="/admin/signups/pending" 
              className={`sidebar-link ${location.pathname === '/admin/signups/pending' ? 'active' : ''}`}
              title={isCollapsed ? 'Pending Approvals' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
              {!isCollapsed && <span>Pending Approvals</span>}
            </Link>
            <Link 
              to="/admin/users" 
              className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
              title={isCollapsed ? 'Users' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {!isCollapsed && <span>Users</span>}
            </Link>
            <Link 
              to="/admin/users/orders" 
              className={`sidebar-link ${location.pathname === '/admin/users/orders' ? 'active' : ''}`}
              title={isCollapsed ? 'User Orders' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
              {!isCollapsed && <span>User Orders</span>}
            </Link>
            <Link 
              to="/billing" 
              className={`sidebar-link ${location.pathname === '/billing' ? 'active' : ''}`}
              title={isCollapsed ? 'Billing' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {!isCollapsed && <span>Billing</span>}
            </Link>
            <Link 
              to="/tickets" 
              className={`sidebar-link ${location.pathname === '/tickets' ? 'active' : ''}`}
              title={isCollapsed ? 'Tickets' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5v2" />
                <path d="M15 11v2" />
                <path d="M15 17v2" />
                <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
              </svg>
              {!isCollapsed && <span>Tickets</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        {!isCollapsed && user && (
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
        )}
        <button 
          onClick={handleLogout} 
          className="sidebar-logout"
          title={isCollapsed ? 'Logout' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;



