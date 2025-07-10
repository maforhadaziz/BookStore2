import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReviewModeration.css';

const ReviewModeration = () => {
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFlaggedReviews();
  }, []);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const fetchFlaggedReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/books/reviews/flagged`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlaggedReviews(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flagged reviews:', error);
      setMessage('Error loading flagged reviews');
      setLoading(false);
    }
  };

  const handleModeration = async (reviewId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
              await axios.post(`${API_BASE_URL}/api/books/reviews/${reviewId}/moderate`, {
        action,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`Review ${action}d successfully`);
      fetchFlaggedReviews(); // Refresh the list
    } catch (error) {
      console.error('Error moderating review:', error);
      setMessage('Error moderating review');
    }
  };

  if (loading) {
    return <div className="moderation-container">Loading flagged reviews...</div>;
  }

  return (
    <div className="moderation-container">
      <h2>Review Moderation</h2>
      {message && <div className="message">{message}</div>}
      
      {flaggedReviews.length === 0 ? (
        <div className="no-flagged-reviews">
          <h3>No flagged reviews to moderate</h3>
          <p>All reviews are currently approved.</p>
        </div>
      ) : (
        <div className="flagged-reviews-list">
          {flaggedReviews.map((review) => (
            <div key={review.reviewId} className="flagged-review-card">
              <div className="review-header">
                <h4>Book: {review.bookTitle}</h4>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="review-user">
                <strong>User:</strong> {review.userName} ({review.userEmail})
              </div>
              
              <div className="review-content">
                <strong>Review:</strong>
                <p>{review.comment}</p>
              </div>
              
              <div className="flag-info">
                <strong>Flagged for:</strong> {review.flagReason}
                <br />
                <strong>Flagged on:</strong> {new Date(review.flaggedAt).toLocaleDateString()}
              </div>
              
              <div className="moderation-actions">
                <button 
                  className="action-btn approve"
                  onClick={() => handleModeration(review.reviewId, 'approve')}
                >
                  Approve Review
                </button>
                
                <button 
                  className="action-btn remove"
                  onClick={() => handleModeration(review.reviewId, 'remove')}
                >
                  Remove Review
                </button>
                
                <button 
                  className="action-btn warn"
                  onClick={() => {
                    const reason = prompt('Enter warning reason:');
                    if (reason) {
                      handleModeration(review.reviewId, 'warn', reason);
                    }
                  }}
                >
                  Warn User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewModeration; 