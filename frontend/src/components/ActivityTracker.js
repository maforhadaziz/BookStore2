import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ActivityTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Track activity when component mounts
    trackActivity();

    // Set up periodic activity tracking (every 30 seconds)
    const interval = setInterval(trackActivity, 30000);

    // Track activity when user navigates to different pages
    trackActivity();

    // Cleanup function
    return () => {
      clearInterval(interval);
      // Mark user as offline when component unmounts
      markOffline();
    };
  }, [location.pathname]);

  const trackActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API_BASE_URL = process.env.REACT_APP_API_URL;
      await axios.post(`${API_BASE_URL}/users/activity`, {
        currentPage: location.pathname,
        userAgent: navigator.userAgent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const markOffline = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API_BASE_URL = process.env.REACT_APP_API_URL;
      await axios.post(`${API_BASE_URL}/users/offline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking offline:', error);
    }
  };

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, mark as offline
        markOffline();
      } else {
        // Page is visible again, track activity
        trackActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ActivityTracker; 