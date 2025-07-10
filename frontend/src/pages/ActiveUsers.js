import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActiveUsers.css';

const ActiveUsers = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalRecent, setTotalRecent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchActiveUsers();
    
    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchActiveUsers, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchActiveUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActiveUsers(response.data.activeUsers);
      setRecentUsers(response.data.recentUsers);
      setTotalActive(response.data.totalActive);
      setTotalRecent(response.data.totalRecent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active users:', error);
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diffInSeconds = Math.floor((now - lastSeen) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPageName = (path) => {
    const pageNames = {
      '/': 'Home',
      '/books': 'Books',
      '/login': 'Login',
      '/signup': 'Sign Up',
      '/profile': 'Profile',
      '/favorites': 'Favorites',
      '/history': 'History',
      '/admin': 'Admin Dashboard',
      '/admin/add-book': 'Add Book',
      '/admin/edit-books': 'Edit Books',
      '/admin/users': 'Manage Users',
      '/admin/review-moderation': 'Review Moderation',
      '/admin/super-admin': 'Super Admin'
    };
    
    return pageNames[path] || path;
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return '📱 Mobile';
    if (userAgent.includes('Tablet')) return '📱 Tablet';
    if (userAgent.includes('Chrome')) return '🌐 Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Firefox';
    if (userAgent.includes('Safari')) return '🍎 Safari';
    if (userAgent.includes('Edge')) return '🌐 Edge';
    
    return '💻 Desktop';
  };

  if (loading) {
    return <div className="active-users-container">Loading active users...</div>;
  }

  return (
    <div className="active-users-container">
      <div className="active-users-header">
        <h2>👥 Live User Activity</h2>
        <div className="header-controls">
          <button 
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </button>
          <button className="refresh-btn" onClick={fetchActiveUsers}>
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Currently Online</h3>
          <div className="stat-number">{totalActive}</div>
          <p>Active in last 5 minutes</p>
        </div>
        <div className="stat-card">
          <h3>Recently Active</h3>
          <div className="stat-number">{totalRecent}</div>
          <p>Active in last hour</p>
        </div>
      </div>

      <div className="users-sections">
        <div className="section">
          <h3>🟢 Currently Online ({totalActive})</h3>
          {activeUsers.length === 0 ? (
            <div className="no-users">
              <p>No users currently online</p>
            </div>
          ) : (
            <div className="users-grid">
              {activeUsers.map((user) => (
                <div key={user._id} className="user-card online">
                  <div className="user-header">
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <span className="user-email">{user.email}</span>
                      <span className={`user-role ${user.role}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </div>
                    <div className="online-indicator">🟢</div>
                  </div>
                  
                  <div className="user-activity">
                    <div className="activity-item">
                      <span className="label">Current Page:</span>
                      <span className="value">{getPageName(user.currentPage)}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Device:</span>
                      <span className="value">{getDeviceInfo(user.userAgent)}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">IP Address:</span>
                      <span className="value">{user.ipAddress || 'Unknown'}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Last Activity:</span>
                      <span className="value">{formatTimeAgo(user.lastSeen)}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Session Started:</span>
                      <span className="value">{formatTimeAgo(user.sessionStart)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h3>🟡 Recently Active ({totalRecent})</h3>
          {recentUsers.length === 0 ? (
            <div className="no-users">
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="users-grid">
              {recentUsers.map((user) => (
                <div key={user._id} className={`user-card ${user.isOnline ? 'online' : 'offline'}`}>
                  <div className="user-header">
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <span className="user-email">{user.email}</span>
                      <span className={`user-role ${user.role}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </div>
                    <div className="status-indicator">
                      {user.isOnline ? '🟢' : '🔴'}
                    </div>
                  </div>
                  
                  <div className="user-activity">
                    <div className="activity-item">
                      <span className="label">Last Page:</span>
                      <span className="value">{getPageName(user.currentPage)}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Device:</span>
                      <span className="value">{getDeviceInfo(user.userAgent)}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Last Seen:</span>
                      <span className="value">{formatTimeAgo(user.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveUsers; 