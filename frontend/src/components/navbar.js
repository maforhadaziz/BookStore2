// Example: src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import SidebarDrawer from './SidebarDrawer';

const Navbar = ({ user, onLogout, theme, toggleTheme }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show menu icon if logged in
  const showMenuIcon = !!user;

  // Handle BookStore logo click - navigate to home and scroll to top
  const handleLogoClick = () => {
    // Always scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // If not on home page, navigate to home
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <button onClick={handleLogoClick} className="navbar-logo">BookStore</button>
        </div>
        <div className="navbar-right">
          <div className="navbar-links">
            {showMenuIcon && (
              <button 
                className="navbar-link menu-btn"
                onClick={() => setDrawerOpen(true)}
                title="Open menu"
                aria-label="Open menu"
              >
                &#9776;
              </button>
            )}
            {!user && (
              <Link to="/login" className="navbar-link">Login</Link>
            )}
            {user && (
              <button className="navbar-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>Logout</button>
            )}
          </div>
        </div>
        <button 
          className="theme-toggle-btn absolute-theme-btn"
          onClick={toggleTheme}
          title="Toggle dark/light mode"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
      <SidebarDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        user={user} 
        onLogout={onLogout} 
      />
    </>
  );
};

export default Navbar;
