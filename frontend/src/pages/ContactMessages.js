import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContactMessages.css';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/contact/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setStatus({ type: 'error', message: 'Error loading messages' });
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/contact/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/contact/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'read', readAt: new Date() }
          : msg
      ));
      fetchUnreadCount();
      setStatus({ type: 'success', message: 'Message marked as read' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      setStatus({ type: 'error', message: 'Error updating message' });
    }
  };

  const markAsReplied = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/contact/messages/${messageId}/replied`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, status: 'replied', repliedAt: new Date() }
          : msg
      ));
      setStatus({ type: 'success', message: 'Message marked as replied' });
    } catch (error) {
      console.error('Error marking message as replied:', error);
      setStatus({ type: 'error', message: 'Error updating message' });
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/contact/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(messages.filter(msg => msg._id !== messageId));
      setSelectedMessage(null);
      setStatus({ type: 'success', message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      setStatus({ type: 'error', message: 'Error deleting message' });
    }
  };

  const sendReply = async (messageId, userEmail, userName) => {
    if (!replyText.trim()) {
      setStatus({ type: 'error', message: 'Please enter a reply message' });
      return;
    }

    setIsReplying(true);
    try {
      const token = localStorage.getItem('token');
      
      // Send reply email (you'll need to implement this endpoint)
      await axios.post(`http://localhost:5000/api/contact/messages/${messageId}/send-reply`, {
        replyText,
        userEmail,
        userName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mark as replied
      await markAsReplied(messageId);
      
      setReplyText('');
      setStatus({ type: 'success', message: 'Reply sent successfully!' });
    } catch (error) {
      console.error('Error sending reply:', error);
      setStatus({ type: 'error', message: 'Error sending reply. Please try again.' });
    } finally {
      setIsReplying(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      unread: { text: '📧 Unread', class: 'unread' },
      read: { text: '👁️ Read', class: 'read' },
      replied: { text: '✅ Replied', class: 'replied' }
    };
    return badges[status] || badges.unread;
  };

  if (loading) {
    return <div className="contact-messages-container">Loading messages...</div>;
  }

  return (
    <div className="contact-messages-container">
      <div className="messages-header">
        <h2>📧 Contact Messages</h2>
        <div className="header-stats">
          <span className="stat-item">
            📧 Total: {messages.length}
          </span>
          <span className="stat-item unread">
            📬 Unread: {unreadCount}
          </span>
        </div>
      </div>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      <div className="messages-content">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No contact messages yet.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message._id} 
                className={`message-card ${message.status} ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="message-header">
                  <div className="message-info">
                    <h4>{message.subject}</h4>
                    <p className="sender">From: {message.name} ({message.email})</p>
                    <p className="date">{formatDate(message.createdAt)}</p>
                  </div>
                  <div className="message-status">
                    <span className={`status-badge ${getStatusBadge(message.status).class}`}>
                      {getStatusBadge(message.status).text}
                    </span>
                  </div>
                </div>
                <div className="message-preview">
                  {message.message.substring(0, 100)}...
                </div>
              </div>
            ))
          )}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="detail-header">
              <h3>{selectedMessage.subject}</h3>
              <div className="detail-actions">
                {selectedMessage.status === 'unread' && (
                  <button 
                    className="action-btn read-btn"
                    onClick={() => markAsRead(selectedMessage._id)}
                  >
                    👁️ Mark as Read
                  </button>
                )}
                {selectedMessage.status !== 'replied' && (
                  <button 
                    className="action-btn reply-btn"
                    onClick={() => markAsReplied(selectedMessage._id)}
                  >
                    ✅ Mark as Replied
                  </button>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteMessage(selectedMessage._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              <div className="sender-info">
                <p><strong>From:</strong> {selectedMessage.name}</p>
                <p><strong>Email:</strong> {selectedMessage.email}</p>
                <p><strong>Date:</strong> {formatDate(selectedMessage.createdAt)}</p>
                <p><strong>IP Address:</strong> {selectedMessage.ipAddress}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedMessage.status).text}</p>
                {selectedMessage.readAt && (
                  <p><strong>Read at:</strong> {formatDate(selectedMessage.readAt)}</p>
                )}
                {selectedMessage.repliedAt && (
                  <p><strong>Replied at:</strong> {formatDate(selectedMessage.repliedAt)}</p>
                )}
              </div>

              <div className="message-content">
                <h4>Message:</h4>
                <div className="message-text">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.adminReplies && selectedMessage.adminReplies.length > 0 && (
                <div className="admin-replies-section">
                  <h4>💬 Admin Replies:</h4>
                  {selectedMessage.adminReplies.map((reply, index) => (
                    <div key={index} className="admin-reply-item">
                      <div className="admin-reply-info">
                        <p><strong>From:</strong> {reply.adminName}</p>
                        <p><strong>Replied:</strong> {formatDate(reply.repliedAt)}</p>
                      </div>
                      <div className="admin-reply-text">
                        {reply.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedMessage.userReplies && selectedMessage.userReplies.length > 0 && (
                <div className="user-replies-section">
                  <h4>💬 User Replies:</h4>
                  {selectedMessage.userReplies.map((reply, index) => (
                    <div key={index} className="user-reply-item">
                      <div className="user-reply-info">
                        <p><strong>Replied:</strong> {formatDate(reply.repliedAt)}</p>
                      </div>
                      <div className="user-reply-text">
                        {reply.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="reply-section">
                <h4>Reply to {selectedMessage.name}:</h4>
                <textarea 
                  className="reply-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows="4"
                ></textarea>
                <div className="reply-actions">
                  <button 
                    className="action-btn send-reply-btn"
                    onClick={() => sendReply(selectedMessage._id, selectedMessage.email, selectedMessage.name)}
                    disabled={isReplying || !replyText.trim()}
                  >
                    {isReplying ? '📤 Sending...' : '📤 Send Reply'}
                  </button>
                  <button 
                    className="action-btn cancel-reply-btn"
                    onClick={() => setReplyText('')}
                    disabled={isReplying}
                  >
                    ❌ Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages; 