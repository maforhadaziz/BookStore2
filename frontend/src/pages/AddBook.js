import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './AddBook.css';

const AddBook = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    price: '',
    description: ''
  });
  const [files, setFiles] = useState({
    pdf: null,
    coverImage: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = [
    'Fiction', 'Literature', 'Science', 'History', 
    'Children', 'Religious', 'Technical', 'Biography',
    'Romance', 'Mystery', 'Fantasy', 'Self-Help'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: fileList[0]
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return false;
    }
    if (!formData.author.trim()) {
      setMessage({ type: 'error', text: 'Author is required' });
      return false;
    }
    if (!formData.category) {
      setMessage({ type: 'error', text: 'Category is required' });
      return false;
    }
    if (formData.price === '' || formData.price < 0) {
      setMessage({ type: 'error', text: 'Valid price is required (0 or greater)' });
      return false;
    }
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Description is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Add files
      if (files.pdf) {
        data.append('pdf', files.pdf);
      }
      if (files.coverImage) {
        data.append('coverImage', files.coverImage);
      }

      await axios.post('http://localhost:5000/api/books', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setMessage({ type: 'success', text: 'Book added successfully!' });
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        category: '',
        price: '',
        description: ''
      });
      setFiles({
        pdf: null,
        coverImage: null
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin/edit-books');
      }, 2000);

    } catch (error) {
      console.error('Error adding book:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add book. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-book-container">
      <div className="add-book-header">
        <h1>Add New Book</h1>
        <p>Fill in the details below to add a new book to your store.</p>
      </div>

      <form onSubmit={handleSubmit} className="add-book-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Book Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter book title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter book description..."
            rows="4"
            required
          />
        </div>

        <div className="file-upload-section">
          <div className="form-group">
            <label htmlFor="coverImage">Cover Image</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="coverImage"
                name="coverImage"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
              <div className="file-input-display">
                {files.coverImage ? (
                  <span className="file-selected">✓ {files.coverImage.name}</span>
                ) : (
                  <span className="file-placeholder">Choose cover image...</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pdf">PDF File</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="pdf"
                name="pdf"
                onChange={handleFileChange}
                accept=".pdf"
                className="file-input"
              />
              <div className="file-input-display">
                {files.pdf ? (
                  <span className="file-selected">✓ {files.pdf.name}</span>
                ) : (
                  <span className="file-placeholder">Choose PDF file...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Adding Book...' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBook;
