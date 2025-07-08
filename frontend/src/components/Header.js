import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from './BackButton';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't show back button on homepage
  const isHomePage = location.pathname === '/';
  
  const handleTitleClick = () => {
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {!isHomePage && (
          <BackButton text="← Back" className="header-back-button small" />
        )}
      </div>
    </header>
  );
};

export default Header; 