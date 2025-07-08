import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './BookList.css';

const BookList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('title'); // 'title', 'date', or 'trending'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const isAuthenticated = !!localStorage.getItem('token');

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const UPLOADS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';

  // Get category and sort from URL
  const categoryFromUrl = searchParams.get('category');
  const sortFromUrl = searchParams.get('sort');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        // Handle trending books
        if (sortFromUrl === 'trending') {
          const response = await axios.get(`${API_BASE_URL}/books/trending?limit=50`);
          setBooks(response.data);
          setSortBy('trending');
          setSortOrder('desc');
        } else {
          // Regular books fetch
          const params = {};
          if (categoryFromUrl) {
            params.category = categoryFromUrl;
          }
          
          const response = await axios.get(`${API_BASE_URL}/books`, { params });
          setBooks(response.data.books || response.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [categoryFromUrl, sortFromUrl]);

  // Sort books based on current sort settings
  const sortedBooks = [...books].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'title') {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    } else if (sortBy === 'date') {
      aValue = new Date(a.createdAt || a.updatedAt || 0);
      bValue = new Date(b.createdAt || b.updatedAt || 0);
    } else if (sortBy === 'trending') {
      // For trending, sort by totalVisits (already sorted from backend, but just in case)
      aValue = a.totalVisits || 0;
      bValue = b.totalVisits || 0;
    } else {
      return 0;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get page title based on current filters
  const getPageTitle = () => {
    if (sortFromUrl === 'trending') {
      return 'Trending Books';
    } else if (categoryFromUrl) {
      return `${categoryFromUrl} Books`;
    } else {
      return 'All Books';
    }
  };

  if (loading) {
    return (
      <div className="booklist-container">
        <h2 className="booklist-title">Loading books...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booklist-container">
        <h2 className="booklist-title">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="booklist-container">
      <div className="booklist-header">
        <h2 className="booklist-title">
          {getPageTitle()}
        </h2>
        
        <div className="booklist-sorting">
          <span className="sort-label">Sort by:</span>
          <button 
            className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSort('title')}
          >
            Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => handleSort('date')}
          >
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          {sortFromUrl !== 'trending' && (
            <button 
              className={`sort-btn ${sortBy === 'trending' ? 'active' : ''}`}
              onClick={() => navigate('/books?sort=trending')}
            >
              Trending
            </button>
          )}
        </div>
      </div>
      
      <div className="booklist-grid">
        {sortedBooks.length === 0 ? (
          <div className="no-books-message">
            {sortFromUrl === 'trending' 
              ? 'No trending books found.' 
              : categoryFromUrl 
                ? `No books found in ${categoryFromUrl} category.` 
                : 'No books found.'
            }
          </div>
        ) : (
          sortedBooks.map(book => {
            const coverUrl = book.coverImageFileName ? `${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}` : null;
            const hasPdf = !!book.pdfFileName;
            
            return (
              <div key={book._id} className="book-card">
                <div className="book-card-cover">
                  {coverUrl ? (
                    <img src={coverUrl} alt={`${book.title} cover`} className="book-cover-image" />
                  ) : (
                    <div className="book-cover-placeholder">
                      <span>No Cover</span>
                    </div>
                  )}
                  {sortFromUrl === 'trending' && book.totalVisits > 0 && (
                    <div className="trending-badge">
                      {book.totalVisits} views
                    </div>
                  )}
                </div>
                <div className="book-card-content">
                  <h4 className="book-card-title">{book.title}</h4>
                  <p className="book-card-author"><strong>Author:</strong> {book.author}</p>
                  <p className="book-card-price"><strong>Price:</strong> ${book.price}</p>
                  <p className="book-card-category"><strong>Category:</strong> {book.category}</p>
                  
                  <div className="book-card-actions">
                    <Link className="book-card-link" to={`/books/${book._id}`}>View Details</Link>
                    {hasPdf && isAuthenticated && (
                      <button 
                        className="book-card-read-btn"
                        onClick={() => navigate(`/books/${book._id}`)}
                      >
                        Read Online
                      </button>
                    )}
                    {hasPdf && !isAuthenticated && (
                      <span className="book-card-login-notice">Login to read</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BookList;
