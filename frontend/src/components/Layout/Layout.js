import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="header-logo" style={{ flex: 1 }}>
            <img src="/yantrik-logo.png" alt="Yantrik Automation" className="header-logo-image" />
          </div>
          <div style={{ textAlign: 'center', flex: 2 }}>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>RFQ Tracker</h1>
            <div style={{ fontSize: '14px', marginTop: '4px', color: 'rgba(255,255,255,0.9)' }}>Yantrik Automation Pvt Ltd</div>
          </div>
          <div className="header-actions" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <span className="user-info">
              {user?.full_name} ({user?.role})
            </span>
            <button onClick={logout} className="btn btn-secondary btn-small">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link
              to="/rfq"
              className={`nav-link ${location.pathname.startsWith('/rfq') && location.pathname !== '/rfq/new' ? 'active' : ''}`}
            >
              RFQs
            </Link>
          </li>
          {user && (user.role === 'admin' || user.role === 'sales') && (
            <li className="nav-item">
              <Link
                to="/rfq/new"
                className={`nav-link ${location.pathname === '/rfq/new' ? 'active' : ''}`}
              >
                New RFQ
              </Link>
            </li>
          )}
          {user && user.role === 'admin' && (
            <li className="nav-item">
              <Link
                to="/settings"
                className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
              >
                Settings
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

