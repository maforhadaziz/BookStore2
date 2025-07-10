import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUser({ ...res.data.user, password: '' });
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching profile:', error);
        // If token is invalid, redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          navigate('/login');
        }
        setLoading(false);
      });
  }, [isAuthenticated, navigate, API_BASE_URL]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    axios.put(`${API_BASE_URL}/api/users/profile`, user, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMessage('Profile updated!'))
      .catch(() => setMessage('Error updating profile'));
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  if (loading) return <div className="profile-container">Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">
          {isAdmin ? '🛠️ Admin Profile' : '👤 My Profile'}
        </h2>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" value={user.name} onChange={handleChange} required />
          </div>
          {isAdmin && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input type="text" id="role" value={user.role || 'admin'} disabled />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="password">New Password (leave blank to keep)</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={user.password} 
                onChange={handleChange} 
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button className="profile-update-btn" type="submit">
            {isAdmin ? 'Update Admin Profile' : 'Update Profile'}
          </button>
          {message && <div className="profile-success">{message}</div>}
        </form>
        
        {isAdmin && (
          <div className="admin-profile-info">
            <h3>🛠️ Admin Information</h3>
            <p>As an admin, you have access to:</p>
            <ul>
              <li>📚 Manage books (add, edit, delete)</li>
              <li>👥 Manage users and their roles</li>
              <li>📧 Handle contact messages</li>
              <li>📊 View analytics and user activity</li>
              <li>🔍 Moderate reviews and content</li>
            </ul>
            <div className="admin-actions">
              <button 
                className="admin-action-btn"
                onClick={() => window.location.href = '/admin'}
              >
                🛠️ Go to Admin Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 