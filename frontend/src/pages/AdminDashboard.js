import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './AdminDashboard.css';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalRegularUsers: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookAnalytics, setBookAnalytics] = useState(null);
  const [happyReaders, setHappyReaders] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchHappyReaders();
  }, []);

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const UPLOADS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch books
      const booksResponse = await axios.get(`${API_BASE_URL}/books`);
      const books = booksResponse.data.books || booksResponse.data;
      
      // Fetch users
      const usersResponse = await axios.get(`${API_BASE_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = usersResponse.data;
      
      // Calculate stats
      const admins = users.filter(user => user.role === 'admin');
      const regularUsers = users.filter(user => user.role === 'user');
      
      setStats({
        totalBooks: books.length,
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalRegularUsers: regularUsers.length
      });
      
      // Get recent books (last 5)
      setRecentBooks(books.slice(-5).reverse());
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/books/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHappyReaders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/books/analytics/happy-readers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHappyReaders(response.data);
    } catch (error) {
      console.error('Error fetching happy readers:', error);
    }
  };

  const fetchBookAnalytics = async (bookId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/books/${bookId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookAnalytics(response.data);
      setSelectedBook(bookId);
    } catch (error) {
      console.error('Error fetching book analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening with your bookstore.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card books">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalBooks}</h3>
            <p>Total Books</p>
          </div>
        </div>
        
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div className="stat-card admins">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3>{stats.totalAdmins}</h3>
            <p>Admin Users</p>
          </div>
        </div>
        
        <div className="stat-card regular-users">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>{stats.totalRegularUsers}</h3>
            <p>Regular Users</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/add-book" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Add New Book</h3>
            <p>Upload a new book to your collection</p>
          </Link>
          
          <Link to="/admin/edit-books" className="action-card">
            <div className="action-icon">✏️</div>
            <h3>Manage Books</h3>
            <p>Edit or delete existing books</p>
          </Link>
          
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <h3>User Management</h3>
            <p>Manage user accounts and roles</p>
          </Link>
          
          <Link to="/admin/review-moderation" className="action-card">
            <div className="action-icon">🚩</div>
            <h3>Review Moderation</h3>
            <p>Moderate user reviews and reports</p>
          </Link>

          <Link to="/admin/super-admin" className="action-card super-admin-card">
            <div className="action-icon">👑</div>
            <h3>Super Admin Panel</h3>
            <p>Manage admin users (forhadaziz47@gmail.com only)</p>
          </Link>

          <Link to="/admin/active-users" className="action-card active-users-card">
            <div className="action-icon">👥</div>
            <h3>Live User Activity</h3>
            <p>Monitor who is currently browsing the website</p>
          </Link>

          <Link to="/books" className="action-card">
            <div className="action-icon">📖</div>
            <h3>View All Books</h3>
            <p>Browse your complete book collection</p>
          </Link>
        </div>
      </div>

      {/* Recent Books */}
      <div className="recent-books-section">
        <h2>Recent Books</h2>
        {recentBooks.length === 0 ? (
          <div className="no-books">
            <p>No books added yet. Start by adding your first book!</p>
            <Link to="/admin/add-book" className="btn-primary">Add First Book</Link>
          </div>
        ) : (
          <div className="recent-books-grid">
            {recentBooks.map(book => (
              <div key={book._id} className="recent-book-card">
                <div className="book-cover">
                  {book.coverImageFileName ? (
                    <img src={`${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}`} alt={book.title} />
                  ) : (
                    <div className="placeholder-cover">📚</div>
                  )}
                </div>
                <div className="book-info">
                  <h4>{book.title}</h4>
                  <p className="author">by {book.author}</p>
                  <p className="category">{book.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="system-status">
        <h2>System Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-indicator online"></span>
            <span>Backend Server</span>
          </div>
          <div className="status-item">
            <span className="status-indicator online"></span>
            <span>Database</span>
          </div>
          <div className="status-item">
            <span className="status-indicator online"></span>
            <span>File Storage</span>
          </div>
        </div>
      </div>

      {analytics && (
        <div className="analytics-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Books</h3>
              <div className="stat-number">{analytics.totalBooks}</div>
            </div>
            <div className="stat-card">
              <h3>Total Visits</h3>
              <div className="stat-number">{analytics.totalVisits}</div>
            </div>
            <div className="stat-card">
              <h3>Total Downloads</h3>
              <div className="stat-number">{analytics.totalDownloads}</div>
            </div>
            <div className="stat-card">
              <h3>Avg Visits per Book</h3>
              <div className="stat-number">
                {analytics.totalBooks > 0 ? Math.round(analytics.totalVisits / analytics.totalBooks) : 0}
              </div>
            </div>
          </div>

          <div className="analytics-sections">
            <div className="analytics-section">
              <h2>Most Visited Books</h2>
              <div className="books-list">
                {analytics.mostVisited.map((book, index) => (
                  <div key={book._id} className="book-analytics-item">
                    <div className="book-rank">#{index + 1}</div>
                    <div className="book-info">
                      <h4>{book.title}</h4>
                      <p>by {book.author}</p>
                      <span className="book-category">{book.category}</span>
                    </div>
                    <div className="book-stats">
                      <div className="stat">
                        <span className="stat-label">Visits:</span>
                        <span className="stat-value">{book.totalVisits}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Downloads:</span>
                        <span className="stat-value">{book.totalDownloads}</span>
                      </div>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => fetchBookAnalytics(book._id)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h2>Most Downloaded Books</h2>
              <div className="books-list">
                {analytics.mostDownloaded.map((book, index) => (
                  <div key={book._id} className="book-analytics-item">
                    <div className="book-rank">#{index + 1}</div>
                    <div className="book-info">
                      <h4>{book.title}</h4>
                      <p>by {book.author}</p>
                      <span className="book-category">{book.category}</span>
                    </div>
                    <div className="book-stats">
                      <div className="stat">
                        <span className="stat-label">Downloads:</span>
                        <span className="stat-value">{book.totalDownloads}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Visits:</span>
                        <span className="stat-value">{book.totalVisits}</span>
                      </div>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => fetchBookAnalytics(book._id)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {bookAnalytics && (
        <div className="book-analytics-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Analytics for: {bookAnalytics.book.title}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setBookAnalytics(null);
                  setSelectedBook(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="book-analytics-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <h4>Total Visits</h4>
                  <div className="stat-number">{bookAnalytics.totalVisits}</div>
                </div>
                <div className="stat-item">
                  <h4>Total Downloads</h4>
                  <div className="stat-number">{bookAnalytics.totalDownloads}</div>
                </div>
                <div className="stat-item">
                  <h4>Recent Visits (30 days)</h4>
                  <div className="stat-number">{bookAnalytics.recentVisits}</div>
                </div>
                <div className="stat-item">
                  <h4>Recent Downloads (30 days)</h4>
                  <div className="stat-number">{bookAnalytics.recentDownloads}</div>
                </div>
              </div>
            </div>

            <div className="analytics-details">
              <div className="detail-section">
                <h3>Visits by User</h3>
                <div className="users-list">
                  {bookAnalytics.visitsByUser.map((user, index) => (
                    <div key={index} className="user-item">
                      <div className="user-info">
                        <strong>{user.userName}</strong>
                        <span>{user.userEmail}</span>
                      </div>
                      <div className="user-stats">
                        <span>Visits: {user.visitCount}</span>
                        <span>Last: {new Date(user.lastVisit).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Downloads by User</h3>
                <div className="users-list">
                  {bookAnalytics.downloadsByUser.map((user, index) => (
                    <div key={index} className="user-item">
                      <div className="user-info">
                        <strong>{user.userName}</strong>
                        <span>{user.userEmail}</span>
                      </div>
                      <div className="user-stats">
                        <span>Downloads: {user.downloadCount}</span>
                        <span>Last: {new Date(user.lastDownload).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 