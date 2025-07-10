import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Signup from './Signup';
import AddBook from './pages/AddBook';
import EditBooks from './pages/EditBooks'; // You'll create this later
import Navbar from './components/navbar';
import Header from './components/Header';
import BookList from './components/BookList';
import BookDetails from './pages/BookDetails';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import ReviewModeration from './pages/ReviewModeration';
import SuperAdmin from './pages/SuperAdmin';
import ActiveUsers from './pages/ActiveUsers';
import Contact from './pages/Contact';
import ContactMessages from './pages/ContactMessages';
import ActivityTracker from './components/ActivityTracker';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Home from './pages/Home';

import MyMessages from './pages/MyMessages';
import { ThemeProvider, ThemeContext } from './ThemeContext';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to login with the current location as the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    
    if (token) {
      const API_BASE_URL = process.env.REACT_APP_API_URL;
      // Verify token is still valid by making a request
      fetch(`${API_BASE_URL}/api/users/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
          setIsAdmin(adminStatus);
        } else {
          // Token is invalid, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        // Network error, clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        setIsAdmin(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Define user object for Navbar
  const user = isAuthenticated ? { role: isAdmin ? 'admin' : 'user' } : null;

  const handleLogin = (isAdminUser = false) => {
    setIsAuthenticated(true);
    setIsAdmin(isAdminUser);
  };

  const handleAdminLogin = () => {
    handleLogin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`app-root ${theme}-theme`}>
      <ActivityTracker />
      <Navbar user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <Header />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/login" element={<Login setIsAuthenticated={handleLogin} onAdminLogin={handleAdminLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Favorites />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <History />
            </ProtectedRoute>
          } />

          <Route path="/my-messages" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MyMessages />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/admin/add-book" element={isAdmin ? <AddBook /> : <Navigate to="/login" replace />} />
          <Route path="/admin/edit-books" element={isAdmin ? <EditBooks /> : <Navigate to="/login" replace />} />
          <Route path="/admin/users" element={isAdmin ? <AdminUsers /> : <Navigate to="/login" replace />} />
          <Route path="/admin/review-moderation" element={isAdmin ? <ReviewModeration /> : <Navigate to="/login" replace />} />
          <Route path="/admin/super-admin" element={isAdmin ? <SuperAdmin /> : <Navigate to="/login" replace />} />
          <Route path="/admin/active-users" element={isAdmin ? <ActiveUsers /> : <Navigate to="/login" replace />} />
          <Route path="/admin/contact-messages" element={isAdmin ? <ContactMessages /> : <Navigate to="/login" replace />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">BookStore</div>
          <div className="footer-links">
            <a href="/" className="footer-link">Home</a>
            <a href="/books" className="footer-link">Books</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
          <div className="footer-copy">&copy; {new Date().getFullYear()} All rights reserved to Forhad Aziz</div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
