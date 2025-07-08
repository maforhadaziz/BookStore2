import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import './Home.css';

const categories = [
  {
    name: "Fiction",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
    description: "Explore imaginative worlds and compelling stories"
  },
  {
    name: "Literature",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    description: "Discover real knowledge and insights"
  },
  {
    name: "Children",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    description: "Nurture young minds with engaging stories"
  },
  {
    name: "Science",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    description: "Explore the wonders of scientific discovery"
  },
  {
    name: "History",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80",
    description: "Journey through time and historical events"
  },
  {
    name: "Religious",
    image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&w=400&q=80",
    description: "Find spiritual guidance and wisdom"
  },
  {
    name: "Technology",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
    description: "Master technical skills and knowledge"
  },
  {
    name: "Biography",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    description: "Discover inspiring life stories and memoirs"
  }
];

// Inspirational quotes for readers
const quotes = [
  {
    text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin"
  },
  {
    text: "Books are a uniquely portable magic.",
    author: "Stephen King"
  },
  {
    text: "Read in the name of your Lord who created.",
    author: "Quran"
  },
  {
    text: "My Lord, increase me in knowledge.",
    author: "Quran (20:114)"
  },
  {
    text: "Whoever follows a path in the pursuit of knowledge, Allah will make a path to Paradise easy for him.",
    author: "Prophet Muhammad ﷺ (Sahih Muslim)"
  },
  {
    text: "Reading is essential for those who seek to rise above the ordinary.",
    author: "Jim Rohn"
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    text: "There is no friend as loyal as a book.",
    author: "Ernest Hemingway"
  }
];

const Home = () => {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({ totalBooks: 0, totalCategories: 8, totalUsers: 0, happyUsers: 0 });
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [continueReading, setContinueReading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingBooks, setTrendingBooks] = useState([]);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const UPLOADS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';

  useEffect(() => {
    // Set quote of the day
    const today = new Date().getDate();
    setQuoteOfTheDay(quotes[today % quotes.length]);

    // Clear old continue reading data if user is not authenticated
    if (!isAuthenticated) {
      // Clear all continue reading entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lastViewedBook_')) {
          localStorage.removeItem(key);
        }
      });
      setContinueReading(null);
    }

    // Fetch books
    axios.get(`${API_BASE_URL}/books`)
      .then(res => {
        const booksData = res.data.books || res.data;
        setBooks(booksData);
        setStats(prev => ({ ...prev, totalBooks: booksData.length }));

        // Check lastViewedBook validity for Continue Reading (user-specific)
        if (isAuthenticated && !isAdmin) {
          const userEmail = localStorage.getItem('userEmail');
          const userName = localStorage.getItem('userName');
          
          // Use user email if available, otherwise use user name, otherwise use token
          let userIdentifier = null;
          if (userEmail) {
            userIdentifier = userEmail;
          } else if (userName) {
            userIdentifier = userName;
          } else {
            // Fallback: use a hash of the token as identifier
            const token = localStorage.getItem('token');
            if (token) {
              userIdentifier = btoa(token).slice(0, 10); // Simple hash of token
            }
          }
          
          console.log('Continue Reading Debug:', {
            isAuthenticated,
            isAdmin,
            userEmail,
            userName,
            userIdentifier,
            hasToken: !!localStorage.getItem('token')
          });
          
          const lastViewedKey = userIdentifier ? `lastViewedBook_${userIdentifier}` : 'lastViewedBook';
          const lastViewed = localStorage.getItem(lastViewedKey);
          
          if (lastViewed) {
            try {
              const lastBook = JSON.parse(lastViewed);
              const found = booksData.find(b => b._id === lastBook._id);
              if (!found) {
                // Book was deleted, remove from localStorage and state
                localStorage.removeItem(lastViewedKey);
                setContinueReading(null);
              } else if (JSON.stringify(found) !== JSON.stringify(lastBook)) {
                // Book was edited, update info
                localStorage.setItem(lastViewedKey, JSON.stringify(found));
                setContinueReading(found);
              } else {
                setContinueReading(lastBook);
              }
            } catch (error) {
              console.error('Error parsing last viewed book:', error);
              localStorage.removeItem(lastViewedKey);
              setContinueReading(null);
            }
          } else {
            setContinueReading(null);
          }
        } else {
          setContinueReading(null);
        }
      })
      .catch(() => setBooks([]));

    // Fetch trending books
    axios.get(`${API_BASE_URL}/books/trending?limit=3`)
      .then(res => {
        setTrendingBooks(res.data);
      })
      .catch(() => setTrendingBooks([]));

    // Fetch user count and happy users (if authenticated)
    const token = localStorage.getItem('token');
    if (token) {
      // Get happy users count
      axios.get(`${API_BASE_URL}/books/analytics/happy-readers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setStats(prev => ({ 
          ...prev, 
          totalUsers: res.data.totalUsers,
          happyUsers: res.data.happyUsersCount 
        }));
      })
      .catch(() => {});
    }
  }, [isAdmin]);

  const featuredBooks = books.slice(0, 6);
  const latestBooks = books.slice(0, 4);

  const handleCategoryClick = (catName) => {
    navigate(`/books?category=${encodeURIComponent(catName)}`);
  };

  const handleBookClick = (book) => {
    // Save last viewed book (user-specific)
    if (isAuthenticated && !isAdmin) {
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      
      // Use user email if available, otherwise use user name, otherwise use token
      let userIdentifier = null;
      if (userEmail) {
        userIdentifier = userEmail;
      } else if (userName) {
        userIdentifier = userName;
      } else {
        // Fallback: use a hash of the token as identifier
        const token = localStorage.getItem('token');
        if (token) {
          userIdentifier = btoa(token).slice(0, 10); // Simple hash of token
        }
      }
      
      const lastViewedKey = userIdentifier ? `lastViewedBook_${userIdentifier}` : 'lastViewedBook';
      localStorage.setItem(lastViewedKey, JSON.stringify(book));
      console.log('Saved continue reading for user:', userIdentifier, 'Key:', lastViewedKey);
    }
    
    // Track book visit if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(`${API_BASE_URL}/books/${book._id}/visit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error('Error tracking visit:', err);
      });
    }
    
    navigate(`/books/${book._id}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Discover Your Next
              <span className="hero-title-highlight"> Great Read</span>
            </h1>
            <p className="hero-subtitle">
              Explore thousands of books across diverse categories. 
              Read online, download PDFs, and build your personal library.
            </p>
            
            {/* Search Bar */}
            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search for books, authors, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <span>🔍</span>
                </button>
              </div>
            </form>

            <div className="hero-actions">
              <button 
                className="hero-btn primary"
                onClick={() => navigate('/books')}
              >
                Browse All Books
              </button>
              <button 
                className="hero-btn secondary"
                onClick={() => document.getElementById('categories').scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Categories
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-books-stack">
              <div className="book-stack-item book-1"></div>
              <div className="book-stack-item book-2"></div>
              <div className="book-stack-item book-3"></div>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.totalBooks}+</span>
            <span className="stat-label">Books Available</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalCategories}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.happyUsers}+</span>
            <span className="stat-label">Happy Readers</span>
          </div>
        </div>
      </section>

      {/* Quote of the Day Section */}
      {quoteOfTheDay && (
        <section className="quote-section">
          <div className="quote-content">
            <div className="quote-icon">📖</div>
            <blockquote className="quote-text">
              "{quoteOfTheDay.text}"
            </blockquote>
            <cite className="quote-author">— {quoteOfTheDay.author}</cite>
          </div>
        </section>
      )}

      {/* Continue Reading Section (for logged-in users, excluding admin) */}
      {isAuthenticated && !isAdmin && continueReading && (
        <section className="continue-reading-section">
          <div className="section-header">
            <h2 className="section-title">Continue Reading</h2>
            <p className="section-subtitle">Pick up where you left off</p>
          </div>
          <div className="continue-reading-card" onClick={() => handleBookClick(continueReading)}>
            <div className="continue-book-cover">
              {continueReading.coverImageFileName ? (
                <img 
                  src={`${UPLOADS_BASE_URL}/uploads/${continueReading.coverImageFileName}`} 
                  alt={continueReading.title} 
                />
              ) : (
                <div className="continue-cover-placeholder">
                  <span>📖</span>
                </div>
              )}
            </div>
            <div className="continue-book-info">
              <h3 className="continue-book-title">{continueReading.title}</h3>
              <p className="continue-book-author">by {continueReading.author}</p>
 
              <button className="continue-btn">
                Continue Reading →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Trending Books Section */}
      {trendingBooks.length > 0 && (
        <section className="trending-section">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending Now</h2>
            <p className="section-subtitle">Most popular books this week</p>
          </div>
          <div className="trending-grid">
            {trendingBooks.map((book, index) => (
              <div className="trending-book-card" key={book._id}>
                <div className="trending-rank">#{index + 1}</div>
                <div className="trending-book-cover">
                  {book.coverImageFileName ? (
                    <img 
                      src={`${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}`} 
                      alt={book.title} 
                    />
                  ) : (
                    <div className="trending-cover-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                </div>
                <div className="trending-book-info">
                  <h4 className="trending-book-title">{book.title}</h4>
                  <p className="trending-book-author">{book.author}</p>
                  <div className="trending-book-meta">
                    <span className="trending-category">{book.category}</span>
                    <span className="trending-price">${book.price}</span>
                  </div>
                  <button 
                    className="trending-view-btn"
                    onClick={() => handleBookClick(book)}
                  >
                    Read Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="trending-actions">
            <button 
              className="trending-view-all-btn"
              onClick={() => navigate('/books?sort=trending')}
            >
              View All Trending Books →
            </button>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-subtitle">Find your perfect book in our carefully curated categories</p>
        </div>
        <div className="categories-grid">
          {categories.map((cat, index) => (
            <div 
              className="category-card" 
              key={cat.name} 
              onClick={() => handleCategoryClick(cat.name)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="category-image">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="category-placeholder" style={{ display: 'none' }}>
                  <span className="category-placeholder-icon">📚</span>
                  <span className="category-placeholder-text">{cat.name}</span>
                </div>
                <div className="category-overlay">
                  <span className="category-icon">📚</span>
                </div>
              </div>
              <div className="category-content">
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-description">{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Featured Books</h2>
            <p className="section-subtitle">Handpicked recommendations for you</p>
          </div>
          <div className="featured-grid">
            {featuredBooks.map(book => (
              <div className="featured-book-card" key={book._id}>
                <div className="book-cover">
                  {book.coverImageFileName ? (
                    <img 
                      src={`${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}`} 
                      alt={book.title} 
                    />
                  ) : (
                    <div className="book-cover-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                  <div className="book-overlay">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleBookClick(book)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                  <div className="book-meta">
                    <span className="book-category">{book.category}</span>
                    <span className="book-price">${book.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Books Section */}
      {latestBooks.length > 0 && (
        <section className="latest-section">
          <div className="section-header">
            <h2 className="section-title">Latest Additions</h2>
            <p className="section-subtitle">Fresh content added to our collection</p>
          </div>
          <div className="latest-grid">
            {latestBooks.map(book => (
              <div className="latest-book-card" key={book._id}>
                <div className="latest-book-cover">
                  {book.coverImageFileName ? (
                    <img 
                      src={`${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}`} 
                      alt={book.title} 
                    />
                  ) : (
                    <div className="latest-cover-placeholder">
                      <span>📖</span>
                    </div>
                  )}
                </div>
                <div className="latest-book-info">
                  <h4 className="latest-book-title">{book.title}</h4>
                  <p className="latest-book-author">{book.author}</p>
                  <button 
                    className="latest-view-btn"
                    onClick={() => handleBookClick(book)}
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Reading?</h2>
          <p className="cta-subtitle">
            Join thousands of readers who have already discovered their next favorite book
          </p>
          <div className="cta-actions">
            <button 
              className="cta-btn primary"
              onClick={() => navigate('/books')}
            >
              Start Reading Now
            </button>
            <button 
              className="cta-btn secondary"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;