import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Favorites.css';

const Favorites = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    if (!token) {
      setError('Please login to view your favorite books');
      setLoading(false);
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL;
    axios.get(`${API_BASE_URL}/api/users/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setBooks(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching favorites:', err);
      if (err.response?.status === 401) {
        setError('Please login to view your favorite books');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        setError('Failed to load favorite books. Please try again.');
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="favorites-container">
        <div className="loading">Loading your favorite books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-container">
        <div className="error-message">
          <h2>Favorite Books</h2>
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
    <div className="favorites-container">
      <h2>My Favorite Books</h2>
      {books.length === 0 ? (
        <div className="no-favorites">
          <p>You haven't added any books to your favorites yet.</p>
          <Link to="/books" className="browse-books-button">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {books.map(book => (
            <div key={book._id} className="favorite-book-card">
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

export default Favorites; 