import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './MyMessages.css';

const MyMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/contact/my-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load your messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
    
    // Mark admin reply as read if user hasn't read it yet
    if (message.adminReply && !message.userReadReply) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/contact/my-messages/${message._id}/mark-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update the message in the list to mark as read
        setMessages(messages.map(msg => 
          msg._id === message._id 
            ? { ...msg, userReadReply: true }
            : msg
        ));
      } catch (error) {
        console.error('Error marking reply as read:', error);
      }
    }
  };

  const closeMessageDetail = () => {
    setShowMessageDetail(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const sendReply = async () => {
    if (!replyText.trim()) {
      return;
    }

    setIsSendingReply(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/contact/my-messages/${selectedMessage._id}/reply`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the message with the new reply
      setSelectedMessage(response.data.contact);
      setMessages(messages.map(msg => 
        msg._id === selectedMessage._id 
          ? response.data.contact
          : msg
      ));
      
      setReplyText('');
      setStatus({ type: 'success', message: 'Reply sent successfully!' });
    } catch (error) {
      console.error('Error sending reply:', error);
      setStatus({ type: 'error', message: 'Error sending reply. Please try again.' });
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'unread':
        return <span className="status-badge unread">Unread</span>;
      case 'read':
        return <span className="status-badge read">Read</span>;
      case 'replied':
        return <span className="status-badge replied">Replied</span>;
      default:
        return <span className="status-badge unread">Unread</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="my-messages-container">
        <BackButton />
        <div className="auth-required">
          <h2>My Messages</h2>
          <p>Please login to view your contact messages.</p>
          <button 
            className="login-btn"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-messages-container">
      <BackButton />
      
      <div className="messages-header">
        <h1>My Messages</h1>
        <p>View your contact messages and admin replies</p>
        <button 
          className="new-message-btn"
          onClick={() => navigate('/contact')}
        >
          📧 Send New Message
        </button>
      </div>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading your messages...</div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchMessages} className="retry-btn">Try Again</button>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📧</div>
          <h3>No Messages Yet</h3>
          <p>You haven't sent any contact messages yet.</p>
          <button 
            className="send-first-btn"
            onClick={() => navigate('/contact')}
          >
            Send Your First Message
          </button>
        </div>
      ) : (
        <div className="messages-content">
          <div className="messages-list">
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`message-card ${message.adminReply ? 'has-reply' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-header">
                  <h3 className="message-subject">{message.subject}</h3>
                  {getStatusBadge(message.status)}
                </div>
                
                <div className="message-preview">
                  <p className="message-text">
                    {message.message.length > 100 
                      ? `${message.message.substring(0, 100)}...` 
                      : message.message
                    }
                  </p>
                </div>
                
                <div className="message-meta">
                  <span className="message-date">
                    Sent: {formatDate(message.createdAt)}
                  </span>
                  {message.adminReplies && message.adminReplies.length > 0 && (
                    <span className="reply-indicator">
                      💬 {message.adminReplies.length} admin reply{message.adminReplies.length > 1 ? 'ies' : ''}
                    </span>
                  )}
                  {message.userReplies && message.userReplies.length > 0 && (
                    <span className="reply-indicator user-replies">
                      💬 {message.userReplies.length} your reply{message.userReplies.length > 1 ? 'ies' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {showMessageDetail && selectedMessage && (
        <div className="message-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Message Details</h2>
              <button 
                className="close-btn"
                onClick={closeMessageDetail}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="message-detail">
                <div className="detail-section">
                  <h3>Your Message</h3>
                  <div className="message-info">
                    <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                    <p><strong>Sent:</strong> {formatDate(selectedMessage.createdAt)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedMessage.status)}</p>
                  </div>
                  <div className="message-content">
                    <h4>Message:</h4>
                    <p>{selectedMessage.message}</p>
                  </div>
                </div>

                {selectedMessage.adminReplies && selectedMessage.adminReplies.length > 0 && (
                  <div className="detail-section admin-replies">
                    <h3>Admin Replies</h3>
                    {selectedMessage.adminReplies.map((reply, index) => (
                      <div key={index} className="reply-item">
                        <div className="reply-info">
                          <p><strong>From:</strong> {reply.adminName}</p>
                          <p><strong>Replied:</strong> {formatDate(reply.repliedAt)}</p>
                        </div>
                        <div className="reply-content">
                          <h4>Reply:</h4>
                          <p>{reply.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMessage.userReplies && selectedMessage.userReplies.length > 0 && (
                  <div className="detail-section user-replies">
                    <h3>Your Replies</h3>
                    {selectedMessage.userReplies.map((reply, index) => (
                      <div key={index} className="reply-item user-reply">
                        <div className="reply-info">
                          <p><strong>Replied:</strong> {formatDate(reply.repliedAt)}</p>
                        </div>
                        <div className="reply-content">
                          <h4>Your Reply:</h4>
                          <p>{reply.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!selectedMessage.adminReply && selectedMessage.status === 'replied' && (
                  <div className="detail-section">
                    <div className="no-reply-yet">
                      <p>Admin has marked this message as replied, but the reply content is not available.</p>
                      <p>Please check your email for the admin's response.</p>
                    </div>
                  </div>
                )}

                {selectedMessage.status === 'unread' && (
                  <div className="detail-section">
                    <div className="pending-reply">
                      <p>Your message is waiting for admin review.</p>
                      <p>We'll get back to you as soon as possible!</p>
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                <div className="detail-section reply-section">
                  <h3>Send Reply</h3>
                  <div className="reply-form">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      rows="4"
                      className="reply-textarea"
                    />
                    <div className="reply-actions">
                      <button
                        onClick={sendReply}
                        disabled={isSendingReply || !replyText.trim()}
                        className="send-reply-btn"
                      >
                        {isSendingReply ? '📤 Sending...' : '📤 Send Reply'}
                      </button>
                      <button
                        onClick={() => setReplyText('')}
                        disabled={isSendingReply}
                        className="clear-reply-btn"
                      >
                        ❌ Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="close-detail-btn"
                onClick={closeMessageDetail}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMessages; 