import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookDetails.css';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [ratingInfo, setRatingInfo] = useState({ ratingAvg: 0, ratingsCount: 0, ratings: [] });
  const [userRating, setUserRating] = useState(0);
  const [ratingMsg, setRatingMsg] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const UPLOADS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/books`)
      .then(res => {
        const found = res.data.books ? res.data.books.find(b => b._id === id) : res.data.find(b => b._id === id);
        setBook(found);
      });
    axios.get(`${API_BASE_URL}/api/books/${id}/ratings`)
      .then(res => {
        setRatingInfo(res.data);
      });
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      axios.get(`${API_BASE_URL}/api/users/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setIsFavorite(res.data.some(b => b._id === id));
      });
    }
    axios.get(`${API_BASE_URL}/api/books/${id}/reviews`)
      .then(res => setReviews(res.data));
  }, [id, isAuthenticated]);

  const handleRate = (value) => {
    const token = localStorage.getItem('token');
    
    // Track visit when user rates the book (meaningful engagement)
    axios.post(`${API_BASE_URL}/api/books/${id}/visit`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
      console.error('Error tracking visit:', err);
    });
    
    axios.post(`${API_BASE_URL}/api/books/${id}/rate`, { value }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setRatingInfo(info => ({ ...info, ratingAvg: res.data.ratingAvg, ratingsCount: res.data.ratingsCount }));
        setUserRating(value);
        setRatingMsg('Thank you for rating!');
      })
      .catch(() => setRatingMsg('Error submitting rating.'));
  };

  const toggleFavorite = () => {
    const token = localStorage.getItem('token');
    
    // Track visit when regular user toggles favorite (meaningful engagement)
    if (!isAdmin) {
      axios.post(`${API_BASE_URL}/api/books/${id}/visit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error('Error tracking visit:', err);
      });
    }
    
    axios.post(`${API_BASE_URL}/api/users/favorites/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setIsFavorite(res.data.favorited));
  };

  const addToHistory = () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('token');
    
    // Track visit when regular user adds to history (meaningful engagement)
    if (!isAdmin) {
      axios.post(`${API_BASE_URL}/api/books/${id}/visit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error('Error tracking visit:', err);
      });
    }
    
    // Save to continue reading (user-specific)
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
    }
    
    axios.post(`${API_BASE_URL}/api/users/history/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const downloadPDF = async (action = 'download') => {
    if (!isAuthenticated) return;
    
    const token = localStorage.getItem('token');
    try {
      // Track visit when regular user actually interacts with the book
      if (!isAdmin) {
        axios.post(`${API_BASE_URL}/api/books/${id}/visit`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error('Error tracking visit:', err);
        });
      }
      
      // Add to history first
      addToHistory();
      
      if (action === 'download') {
        // For actual download, use the download endpoint that tracks
        const response = await fetch(`${API_BASE_URL}/api/books/${book._id}/download`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Download the file
          const link = document.createElement('a');
          link.href = url;
          link.download = `${book.title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } else {
          alert('Failed to download PDF. Please try again.');
        }
      } else {
        // For opening in new tab, use the regular PDF endpoint (no tracking)
        const response = await fetch(`${API_BASE_URL}/api/books/${book._id}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Open in new tab
          window.open(url, '_blank', 'noopener,noreferrer');
          
          // Clean up the blob URL
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } else {
          alert('Failed to open PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setReviewMsg('Please login to add a review.');
      return;
    }
    
    // Track visit when regular user submits a review (meaningful engagement)
    if (!isAdmin) {
      axios.post(`${API_BASE_URL}/api/books/${id}/visit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error('Error tracking visit:', err);
      });
    }
    
    setReviewMsg('Adding review...');
    
    axios.post(`${API_BASE_URL}/api/books/${id}/review`, { comment: reviewText }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        setReviewText('');
        setReviewMsg('Review added successfully!');
        // Refresh reviews
        axios.get(`${API_BASE_URL}/api/books/${id}/reviews`)
          .then(res => setReviews(res.data))
          .catch(err => console.error('Error refreshing reviews:', err));
      })
      .catch((error) => {
        console.error('Error adding review:', error);
        if (error.response?.status === 401) {
          setReviewMsg('Please login to add a review.');
        } else if (error.response?.data?.message) {
          setReviewMsg(error.response.data.message);
        } else {
          setReviewMsg('Error adding review. Please try again.');
        }
      });
  };

  const submitAdminReply = (reviewId) => {
    if (!adminReplyText.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to reply to reviews.');
      return;
    }
    
    axios.post(`${API_BASE_URL}/api/books/${id}/review/${reviewId}/reply`, 
      { comment: adminReplyText }, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((response) => {
        setAdminReplyText('');
        setReplyingTo(null);
        alert('Admin reply added successfully!');
        // Refresh reviews
        axios.get(`${API_BASE_URL}/api/books/${id}/reviews`)
          .then(res => setReviews(res.data))
          .catch(err => console.error('Error refreshing reviews:', err));
      })
      .catch((error) => {
        console.error('Error adding admin reply:', error);
        alert('Error adding admin reply. Please try again.');
      });
  };

  if (!book) return <div>Loading...</div>;

  const pdfUrl = book.pdfFileName ? `${API_BASE_URL}/api/books/${book._id}/pdf` : null;
  const coverUrl = book.coverImageFileName ? `${UPLOADS_BASE_URL}/uploads/${book.coverImageFileName}` : null;

  return (
    <div className="bookdetails-container">
      <h2 className="bookdetails-title">{book.title}
        {isAuthenticated && !isAdmin && (
          <span
            className={`bookdetails-fav ${isFavorite ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >&#10084;</span>
        )}
      </h2>
      {coverUrl && <img className="bookdetails-cover" src={coverUrl} alt="cover" />}
      <div className="bookdetails-info">
        <p><strong>Author:</strong> {book.author}</p>
        <p><strong>Price:</strong> ${book.price}</p>
        <p><strong>Category:</strong> {book.category}</p>
        <p><strong>Description:</strong> {book.description}</p>
      </div>
      <div className="bookdetails-rating">
        <strong>Rating:</strong> {ratingInfo.ratingAvg?.toFixed(2) || 0} / 5 ({ratingInfo.ratingsCount} ratings)
        {isAuthenticated && !isAdmin && (
          <div className="bookdetails-rate-stars">
            <span>Rate this book: </span>
            {[1,2,3,4,5].map(val => (
              <span key={val} className={`bookdetails-star${userRating >= val ? ' filled' : ''}`} onClick={() => handleRate(val)}>&#9733;</span>
            ))}
            {ratingMsg && <span className="bookdetails-rating-msg">{ratingMsg}</span>}
          </div>
        )}
      </div>
      {pdfUrl && isAuthenticated && (
        <div className="bookdetails-actions">
          <button 
            className="bookdetails-btn" 
            onClick={() => downloadPDF('download')}
          >
            Download PDF
          </button>
          <button 
            className="bookdetails-btn" 
            onClick={() => downloadPDF('open')}
          >
            Open PDF in New Tab
          </button>

        </div>
      )}
      {pdfUrl && !isAuthenticated && (
        <div className="bookdetails-actions">
          <div className="login-required-notice">
            <p>Please login to read or download this book.</p>
            <button className="bookdetails-btn" onClick={() => navigate('/login')}>
              Login to Read
            </button>
          </div>
        </div>
      )}

      <div className="bookdetails-reviews">
        <h3>Reviews</h3>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        {reviews.map((r, i) => (
          <div key={i} className="bookdetails-review">
            <div className="review-header">
              <div className="review-user-info">
                <strong>{r.userName}</strong> 
                <span className="bookdetails-review-date">{new Date(r.date).toLocaleString()}</span>
              </div>
              {isAuthenticated && (
                <button 
                  className="flag-review-btn"
                  onClick={() => {
                    const reason = prompt('Please specify why you are flagging this review:');
                    if (reason) {
                      const token = localStorage.getItem('token');
                      axios.post(`${API_BASE_URL}/api/books/${id}/review/flag`, {
                        reviewId: r._id,
                        reason: reason
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      .then(() => alert('Review flagged for moderation. Thank you for your feedback.'))
                      .catch(err => {
                        console.error('Error flagging review:', err);
                        alert('Error flagging review. Please try again.');
                      });
                    }
                  }}
                  title="Report inappropriate review"
                >
                  🚩 Flag
                </button>
              )}
            </div>
            <div className="bookdetails-review-comment">{r.comment}</div>
            {r.flagged && (
              <div className="review-flagged-notice">
                ⚠️ This review has been flagged for moderation
              </div>
            )}
            {r.adminReply && (
              <div className="admin-reply">
                <div className="admin-reply-header">
                  <strong>👨‍💼 Admin Reply by {r.adminReply.adminName}:</strong>
                  <span className="admin-reply-date">{new Date(r.adminReply.date).toLocaleString()}</span>
                </div>
                <div className="admin-reply-content">{r.adminReply.comment}</div>
              </div>
            )}
            {isAdmin && !r.adminReply && (
              <div className="admin-reply-form">
                {replyingTo === r._id ? (
                  <form onSubmit={(e) => { e.preventDefault(); submitAdminReply(r._id); }}>
                    <textarea 
                      className="bookdetails-review-input" 
                      value={adminReplyText} 
                      onChange={e => setAdminReplyText(e.target.value)} 
                      rows={2} 
                      cols={40} 
                      placeholder="Add an admin reply..." 
                    />
                    <br />
                    <div className="admin-reply-actions">
                      <button className="bookdetails-btn" type="submit">Submit Reply</button>
                      <button 
                        type="button" 
                        className="bookdetails-btn cancel" 
                        onClick={() => {
                          setReplyingTo(null);
                          setAdminReplyText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    className="admin-reply-btn"
                    onClick={() => setReplyingTo(r._id)}
                  >
                    💬 Reply as Admin
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isAuthenticated && !isAdmin && (
          <form className="bookdetails-review-form" onSubmit={submitReview}>
            <textarea className="bookdetails-review-input" value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} cols={40} placeholder="Write a review..." />
            <br />
            <button className="bookdetails-btn" type="submit">Add Review</button>
            {reviewMsg && <span className="bookdetails-review-msg">{reviewMsg}</span>}
          </form>
        )}
      </div>

    </div>
  );
};

export default BookDetails; 