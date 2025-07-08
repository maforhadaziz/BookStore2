import React, { useState } from 'react';
import axios from 'axios';
import './Contact.css';

const Contact = () => {
  // Get user info from localStorage
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await axios.post('http://localhost:5000/api/contact/submit', formData);
      
      setStatus({
        type: 'success',
        message: response.data.message
      });
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Error sending message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>📞 Contact Us</h1>
        <p>Get in touch with us for any questions, suggestions, or support</p>
      </div>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      <div className="contact-content">
        <div className="contact-info">
          <div className="contact-card">
            <div className="contact-icon">📧</div>
            <h3>Email</h3>
            <p>forhadaziz47@gmail.com</p>
            {!isAdmin ? (
              <a 
                href="mailto:forhadaziz47@gmail.com" 
                className="contact-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Send Email
              </a>
            ) : (
              <span className="contact-text">Email Address</span>
            )}
          </div>

          <div className="contact-card">
            <div className="contact-icon">📘</div>
            <h3>Facebook</h3>
            <p>Follow us on Facebook</p>
            <a 
              href="https://www.facebook.com/share/1Y7PqHYrT7/" 
              className="contact-link facebook-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Facebook Page
            </a>
          </div>

          <div className="contact-card">
            <div className="contact-icon">👨‍💻</div>
            <h3>Developer</h3>
            <p>Forhad Aziz</p>
            <span className="developer-tag">Full Stack Developer</span>
            <a
              href="https://github.com/maforhadaziz"
              className="contact-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: '8px', display: 'inline-block' }}
            >
              🌐 GitHub Profile
            </a>
          </div>
        </div>

        {!isAdmin && (
          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required 
                  disabled={!!userName}
                />
                {userName && <small className="field-note">Pre-filled from your account</small>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  required 
                  disabled={!!userEmail}
                />
                {userEmail && <small className="field-note">Pre-filled from your account</small>}
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subject of your message"
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea 
                  id="message" 
                  name="message" 
                  value={formData.message}
                  onChange={handleChange}
                  rows="5" 
                  placeholder="Your message here..."
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? '📤 Sending...' : '📤 Send Message'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="contact-footer">
        <div className="social-links">
          <a 
            href="mailto:forhadaziz47@gmail.com" 
            className="social-link email-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            📧 Email
          </a>
          <a 
            href="https://www.facebook.com/share/1Y7PqHYrT7/" 
            className="social-link facebook-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            📘 Facebook
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact; 