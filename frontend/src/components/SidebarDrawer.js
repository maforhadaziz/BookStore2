import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SidebarDrawer.css';

const SidebarDrawer = ({ open, onClose, user, onLogout }) => {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // Fetch unread messages count when drawer opens
  useEffect(() => {
    if (open && user) {
      if (user.role === 'admin') {
        fetchAdminUnreadMessages();
      } else {
        fetchUserUnreadMessages();
      }
    }
  }, [open, user]);

  const fetchUserUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/contact/unread-replies-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadMessages(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const fetchAdminUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/contact/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Count messages that are unread (status: 'unread')
      const unreadMessages = response.data.filter(msg => msg.status === 'unread');
      setUnreadMessages(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching admin unread messages:', error);
    }
  };

  // User links
  const userLinks = [
    { to: '/', label: '🏠 Home' },
    { to: '/favorites', label: '❤️ Favorites' },
    { to: '/history', label: '🕓 History' },
    { 
      to: '/my-messages', 
      label: '💬 My Messages',
      hasNotification: unreadMessages > 0,
      notificationCount: unreadMessages
    },
    { to: '/profile', label: '👤 Profile' },
  ];

  // Admin links
  const adminLinks = [
    { to: '/', label: '🏠 Home' },
    { to: '/admin', label: '🛠️ Admin Panel' },
    { 
      to: '/admin/contact-messages', 
      label: '📧 Contact Messages',
      hasNotification: unreadMessages > 0,
      notificationCount: unreadMessages
    },
    { to: '/profile', label: '👤 Profile' },
  ];

  return (
    <div className={`sidebar-drawer-backdrop${open ? ' open' : ''}`} onClick={onClose}>
      <nav 
        className={`sidebar-drawer${open ? ' open' : ''}`}
        onClick={e => e.stopPropagation()}
        aria-label="Sidebar navigation"
      >
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button className="drawer-close" onClick={onClose}>&times;</button>
        </div>
        <ul className="drawer-links">
          {user && user.role !== 'admin' && userLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} onClick={onClose} className={link.hasNotification ? 'has-notification' : ''}>
                {link.label}
                {link.hasNotification && (
                  <span className="notification-badge">{link.notificationCount}</span>
                )}
              </Link>
            </li>
          ))}
          {user && user.role === 'admin' && adminLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} onClick={onClose} className={link.hasNotification ? 'has-notification' : ''}>
                {link.label}
                {link.hasNotification && (
                  <span className="notification-badge">{link.notificationCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <button className="drawer-logout" onClick={() => { onLogout(); onClose(); }}>
            Logout
          </button>
        )}
      </nav>
    </div>
  );
};

export default SidebarDrawer; 