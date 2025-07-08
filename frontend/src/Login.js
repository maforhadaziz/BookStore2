import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function Login({ setIsAuthenticated, onAdminLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage('Login successful!');

        // Debug: Log the response data
        console.log('Login response data:', data);

        // Save JWT token
        localStorage.setItem('token', data.token);

        // Save user information
        localStorage.setItem('userName', data.user?.name || '');
        localStorage.setItem('userEmail', data.user?.email || '');
        
        // Debug: Log what we're storing
        console.log('Storing in localStorage:', {
          userName: data.user?.name || '',
          userEmail: data.user?.email || ''
        });

        // Save admin flag
        const isAdmin = data.user?.role === 'admin';
        localStorage.setItem('isAdmin', isAdmin.toString());

        // Update parent state to reflect login status
        if (setIsAuthenticated) {
          setIsAuthenticated(isAdmin);
        }

        // Update admin state if needed
        if (isAdmin && onAdminLogin) onAdminLogin();

        // Redirect based on role or intended destination
        const from = location.state?.from?.pathname || '/';
        navigate(isAdmin ? '/admin' : from);
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (err) {
      setMessage('Server error. Please try again later.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In to Your Account</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
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
        <button type="submit" className="login-btn">Login</button>
      </form>
      {message && (
        <p className={success ? "success-message" : "error-message"}>{message}</p>
      )}
      <div className="signup-option">
        <span>Not signed up?</span>
        <Link to="/signup" className="signup-link">Sign Up</Link>
      </div>
    </div>
  );
}

export default Login;
