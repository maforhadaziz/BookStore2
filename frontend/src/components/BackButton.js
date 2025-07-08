import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

const BackButton = ({ text = "← Back", className = "" }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page in history
  };

  return (
    <button 
      className={`back-button ${className}`}
      onClick={handleGoBack}
      title="Go back to previous page"
    >
      {text}
    </button>
  );
};

export default BackButton; 