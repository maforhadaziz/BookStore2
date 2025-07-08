import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdmin.css';

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
      setLoading(false);
    }
  };

  const promoteUser = async (userId, userName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/users/promote/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`User ${userName} has been promoted to admin successfully!`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error promoting user:', error);
      setMessage(error.response?.data?.message || 'Error promoting user');
    }
  };

  const demoteUser = async (userId, userName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/users/demote/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`Admin ${userName} has been demoted to user successfully!`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error demoting user:', error);
      setMessage(error.response?.data?.message || 'Error demoting user');
    }
  };

  // Check if current user is forhadaziz47@gmail.com
  const isSuperAdmin = currentUser && currentUser.email === 'forhadaziz47@gmail.com';

  if (loading) {
    return <div className="super-admin-container">Loading...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="super-admin-container">
        <div className="access-denied">
          <h2>🚫 Access Denied</h2>
          <p>Only forhadaziz47@gmail.com can access the Super Admin panel.</p>
          <p>Current user: {currentUser?.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-container">
      <h2>👑 Super Admin Panel</h2>
      <p className="super-admin-subtitle">Welcome, {currentUser?.name}! You have exclusive privileges to manage admin users.</p>
      
      {message && (
        <div className="message">
          {message}
          <button onClick={() => setMessage('')} className="close-message">×</button>
        </div>
      )}
      
      <div className="users-section">
        <h3>User Management</h3>
        <div className="users-grid">
          {users.map((user) => (
            <div key={user._id} className={`user-card ${user.role === 'admin' ? 'admin-user' : 'regular-user'}`}>
              <div className="user-info">
                <h4>{user.name}</h4>
                <p className="user-email">{user.email}</p>
                <span className={`user-role ${user.role}`}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </div>
              
              <div className="user-actions">
                {user.role === 'user' ? (
                  <button 
                    className="action-btn promote"
                    onClick={() => promoteUser(user._id, user.name)}
                    disabled={user._id === currentUser._id}
                  >
                    👑 Promote to Admin
                  </button>
                ) : (
                  <button 
                    className="action-btn demote"
                    onClick={() => demoteUser(user._id, user.name)}
                    disabled={user._id === currentUser._id}
                  >
                    👤 Demote to User
                  </button>
                )}
              </div>
              
              {user._id === currentUser._id && (
                <div className="current-user-notice">
                  This is you
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="super-admin-info">
        <h3>Super Admin Privileges</h3>
        <ul>
          <li>✅ Promote any user to admin status</li>
          <li>✅ Demote any admin back to user status</li>
          <li>✅ Cannot demote yourself (safety feature)</li>
          <li>✅ Exclusive access - only Forhad Aziz can use this panel</li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdmin; 