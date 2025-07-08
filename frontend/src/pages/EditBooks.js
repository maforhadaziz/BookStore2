import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EditBooks.css';

const EditBooks = () => {
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [sortBy, setSortBy] = useState('title'); // 'title' or 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedBookAnalytics, setSelectedBookAnalytics] = useState(null);
  const [files, setFiles] = useState({
    pdf: null,
    coverImage: null
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = () => {
    axios.get(`${API_BASE_URL}/books`)
      .then(res => setBooks(res.data.books || res.data))
      .catch(err => console.error(err));
  };

  const fetchBookAnalytics = async (bookId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/books/${bookId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBookAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching book analytics:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/books/${id}`);
      fetchBooks(); // Always get the latest list from backend
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setFiles({ pdf: null, coverImage: null }); // Reset files when starting edit
  };

  const handleEditChange = (e) => {
    setEditingBook({ ...editingBook, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: fileList[0]
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      // Add form data
      Object.keys(editingBook).forEach(key => {
        if (key !== '_id' && key !== '__v' && key !== 'pdfFileName' && key !== 'coverImageFileName') {
          data.append(key, editingBook[key]);
        }
      });

      // Add files if selected
      if (files.pdf) {
        data.append('pdf', files.pdf);
      }
      if (files.coverImage) {
        data.append('coverImage', files.coverImage);
      }

      await axios.put(`${API_BASE_URL}/books/${editingBook._id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert("Book updated successfully!");
      setEditingBook(null);
      setFiles({ pdf: null, coverImage: null });
      fetchBooks();
    } catch (error) {
      console.error('Error updating book:', error);
      alert("Failed to update");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort books based on current sort settings
  const sortedBooks = [...books].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'title') {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    } else if (sortBy === 'date') {
      aValue = new Date(a.createdAt || a.updatedAt || 0);
      bValue = new Date(b.createdAt || b.updatedAt || 0);
    } else {
      return 0;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="editbooks-container">
      <div className="editbooks-header">
        <h2 className="editbooks-title">Edit or Delete Books</h2>
        
        <div className="editbooks-sorting">
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
        </div>
      </div>

      {sortedBooks.map(book => (
        editingBook && editingBook._id === book._id ? (
          <div key={book._id} className="editbooks-edit-form-container">
            <h3 className="editbooks-edit-title">Editing: {editingBook.title}</h3>
            <form className="editbooks-edit-form" onSubmit={handleUpdate}>
              <input className="editbooks-input" name="title" value={editingBook.title} onChange={handleEditChange} placeholder="Title" />
              <input className="editbooks-input" name="author" value={editingBook.author} onChange={handleEditChange} placeholder="Author" />
              <input className="editbooks-input" name="price" value={editingBook.price} onChange={handleEditChange} placeholder="Price" />
              <input className="editbooks-input" name="description" value={editingBook.description} onChange={handleEditChange} placeholder="Description" />
              <input className="editbooks-input" name="category" value={editingBook.category} onChange={handleEditChange} placeholder="Category" />
              <input className="editbooks-input" name="image" value={editingBook.image} onChange={handleEditChange} placeholder="Image URL" />
              
              {/* File Upload Section */}
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
                        <span className="file-placeholder">Choose new cover image (optional)...</span>
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
                        <span className="file-placeholder">Choose new PDF file (optional)...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="editbooks-btn" type="submit">Update Book</button>
              <button className="editbooks-btn cancel" type="button" onClick={() => {
                setEditingBook(null);
                setFiles({ pdf: null, coverImage: null });
              }} style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
          </div>
        ) : (
          <div key={book._id} className="editbooks-book-card">
            <div className="editbooks-book-header">
              <h3 className="editbooks-book-title">{book.title}</h3>
              <div className="editbooks-book-stats">
                <span className="stat-item">
                  <span className="stat-label">Visits:</span>
                  <span className="stat-value">{book.totalVisits || 0}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-label">Downloads:</span>
                  <span className="stat-value">{book.totalDownloads || 0}</span>
                </span>
              </div>
            </div>
            <p className="editbooks-book-author"><strong>Author:</strong> {book.author}</p>
            <p className="editbooks-book-price"><strong>Price:</strong> ${book.price}</p>
            <div className="editbooks-book-actions">
              <button className="editbooks-btn" onClick={() => startEdit(book)}>Edit</button>
              <button className="editbooks-btn analytics" onClick={() => fetchBookAnalytics(book._id)}>Analytics</button>
              <button className="editbooks-btn delete" onClick={() => handleDelete(book._id)}>Delete</button>
            </div>
          </div>
        )
      ))}

      {selectedBookAnalytics && (
        <div className="book-analytics-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Analytics for: {selectedBookAnalytics.book.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedBookAnalytics(null)}
              >
                ×
              </button>
            </div>
            
            <div className="book-analytics-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <h4>Total Visits</h4>
                  <div className="stat-number">{selectedBookAnalytics.totalVisits}</div>
                </div>
                <div className="stat-item">
                  <h4>Total Downloads</h4>
                  <div className="stat-number">{selectedBookAnalytics.totalDownloads}</div>
                </div>
                <div className="stat-item">
                  <h4>Recent Visits (30 days)</h4>
                  <div className="stat-number">{selectedBookAnalytics.recentVisits}</div>
                </div>
                <div className="stat-item">
                  <h4>Recent Downloads (30 days)</h4>
                  <div className="stat-number">{selectedBookAnalytics.recentDownloads}</div>
                </div>
              </div>
            </div>

            <div className="analytics-details">
              <div className="detail-section">
                <h3>Visits by User</h3>
                <div className="users-list">
                  {selectedBookAnalytics.visitsByUser.map((user, index) => (
                    <div key={index} className="user-item">
                      <div className="user-info">
                        <strong>{user.userName}</strong>
                        <span>{user.userEmail}</span>
                      </div>
                      <div className="user-stats">
                        <span>Visits: {user.visitCount}</span>
                        <span>Last: {new Date(user.lastVisit).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Downloads by User</h3>
                <div className="users-list">
                  {selectedBookAnalytics.downloadsByUser.map((user, index) => (
                    <div key={index} className="user-item">
                      <div className="user-info">
                        <strong>{user.userName}</strong>
                        <span>{user.userEmail}</span>
                      </div>
                      <div className="user-stats">
                        <span>Downloads: {user.downloadCount}</span>
                        <span>Last: {new Date(user.lastDownload).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBooks;
