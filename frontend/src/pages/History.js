import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './History.css';

const History = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    if (!token) {
      setError('Please login to view your reading history');
      setLoading(false);
      return;
    }

    axios.get('http://localhost:5000/api/users/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setBooks(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching history:', err);
      if (err.response?.status === 401) {
        setError('Please login to view your reading history');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError('Failed to load reading history. Please try again.');
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">Loading your reading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-message">
          <h2>Reading History</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="login-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2>My Reading History</h2>
      {books.length === 0 ? (
        <div className="no-history">
          <p>You haven't read any books yet.</p>
          <Link to="/books" className="browse-books-button">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="history-grid">
          {books.map(book => (
            <div key={book._id} className="history-book-card">
              <h4>{book.title}</h4>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Price:</strong> ${book.price}</p>
              <p><strong>Category:</strong> {book.category}</p>
              <Link to={`/books/${book._id}`} className="view-details-link">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 