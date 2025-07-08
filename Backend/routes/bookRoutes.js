const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});

const upload = multer({ storage });

const {
  getBooks,
  addBook,
  deleteBook,
  updateBook,
  trackBookVisit,
  getTrendingBooks
} = require('../controllers/bookController');

const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/', async (req, res) => {
  const Book = require('../models/Book');
  
  const { search, category, page, limit } = req.query;
  const query = {};
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (category) {
    query.category = category;
  }
  
  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const books = await Book.find(query).skip(skip).limit(parseInt(limit));
    const total = await Book.countDocuments(query);
    res.json({ books, total });
  } else {
    const books = await Book.find(query);
    res.json({ books, total: books.length });
  }
});

router.post('/', auth, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), addBook);

router.put('/:id', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), updateBook);

router.delete('/:id', deleteBook);

router.get('/:id/pdf', auth, async (req, res) => {
  const Book = require('../models/Book');
  const path = require('path');
  
  const book = await Book.findById(req.params.id);
  if (!book || !book.pdfFileName) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  const filePath = path.join(__dirname, '../uploads', book.pdfFileName);
  res.sendFile(filePath);
});

router.post('/:id/download', auth, async (req, res) => {
  const Book = require('../models/Book');
  const path = require('path');
  
  const book = await Book.findById(req.params.id);
  if (!book || !book.pdfFileName) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  book.downloads.push({
    userId: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    timestamp: new Date()
  });
  book.totalDownloads += 1;
  await book.save();
  
  const filePath = path.join(__dirname, '../uploads', book.pdfFileName);
  res.sendFile(filePath);
});

router.post('/:id/open-pdf', auth, async (req, res) => {
  const Book = require('../models/Book');
  const path = require('path');
  const book = await Book.findById(req.params.id);
  if (!book || !book.pdfFileName) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  book.downloads.push({
    userId: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    timestamp: new Date()
  });
  book.totalDownloads += 1;
  await book.save();
  
  const filePath = path.join(__dirname, '../uploads', book.pdfFileName);
  res.sendFile(filePath);
});

router.post('/:id/visit', auth, async (req, res) => {
  const Book = require('../models/Book');
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    book.visits.push({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      timestamp: new Date()
    });
    book.totalVisits += 1;
    await book.save();
    
    res.json({ success: true, totalVisits: book.totalVisits });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ message: 'Failed to track visit' });
  }
});

router.get('/trending', getTrendingBooks);

router.get('/:id/analytics', auth, async (req, res) => {
  const Book = require('../models/Book');
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    // Get recent visits (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVisits = book.visits.filter(visit => 
      new Date(visit.timestamp) > thirtyDaysAgo
    );
    
    const recentDownloads = book.downloads.filter(download => 
      new Date(download.timestamp) > thirtyDaysAgo
    );
    
    // Group visits by user
    const visitsByUser = {};
    book.visits.forEach(visit => {
      const key = visit.userId.toString();
      if (!visitsByUser[key]) {
        visitsByUser[key] = {
          userName: visit.userName,
          userEmail: visit.userEmail,
          visitCount: 0,
          lastVisit: visit.timestamp
        };
      }
      visitsByUser[key].visitCount += 1;
      if (new Date(visit.timestamp) > new Date(visitsByUser[key].lastVisit)) {
        visitsByUser[key].lastVisit = visit.timestamp;
      }
    });
    
    // Group downloads by user
    const downloadsByUser = {};
    book.downloads.forEach(download => {
      const key = download.userId.toString();
      if (!downloadsByUser[key]) {
        downloadsByUser[key] = {
          userName: download.userName,
          userEmail: download.userEmail,
          downloadCount: 0,
          lastDownload: download.timestamp
        };
      }
      downloadsByUser[key].downloadCount += 1;
      if (new Date(download.timestamp) > new Date(downloadsByUser[key].lastDownload)) {
        downloadsByUser[key].lastDownload = download.timestamp;
      }
    });
    
    res.json({
      book: {
        title: book.title,
        author: book.author,
        category: book.category
      },
      totalVisits: book.totalVisits,
      totalDownloads: book.totalDownloads,
      recentVisits: recentVisits.length,
      recentDownloads: recentDownloads.length,
      visitsByUser: Object.values(visitsByUser),
      downloadsByUser: Object.values(downloadsByUser),
      allVisits: book.visits.slice(-50), // Last 50 visits
      allDownloads: book.downloads.slice(-50) // Last 50 downloads
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

// Get all books analytics (admin only)
router.get('/analytics/overview', auth, async (req, res) => {
  const Book = require('../models/Book');
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  
  try {
    const books = await Book.find({}, 'title author category totalVisits totalDownloads');
    
    // Calculate totals
    const totalVisits = books.reduce((sum, book) => sum + book.totalVisits, 0);
    const totalDownloads = books.reduce((sum, book) => sum + book.totalDownloads, 0);
    
    // Get most popular books
    const mostVisited = books
      .sort((a, b) => b.totalVisits - a.totalVisits)
      .slice(0, 10);
    
    const mostDownloaded = books
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, 10);
    
    res.json({
      totalBooks: books.length,
      totalVisits,
      totalDownloads,
      mostVisited,
      mostDownloaded,
      booksAnalytics: books
    });
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({ message: 'Failed to get analytics overview' });
  }
});

// Endpoint to get total users count
router.get('/analytics/total-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get total users' });
  }
});

// Rate a book (add/update rating)
router.post('/:id/rate', auth, async (req, res) => {
  const Book = require('../models/Book');
  const { value } = req.body;
  if (!value || value < 1 || value > 5) return res.status(400).json({ message: 'Invalid rating' });
  
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    const existing = book.ratings.find(r => r.userId.toString() === req.user._id.toString());
    if (existing) {
      existing.value = value;
    } else {
      book.ratings.push({ userId: req.user._id, value });
    }
    
    book.ratingAvg = book.ratings.reduce((sum, r) => sum + r.value, 0) / book.ratings.length;
    await book.save();
    res.json({ ratingAvg: book.ratingAvg, ratingsCount: book.ratings.length });
  } catch (error) {
    console.error('Error rating book:', error);
    res.status(500).json({ message: 'Failed to rate book' });
  }
});

// Get all ratings and average for a book
router.get('/:id/ratings', async (req, res) => {
  const Book = require('../models/Book');
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json({ ratingAvg: book.ratingAvg, ratingsCount: book.ratings.length, ratings: book.ratings });
});

// Add a review to a book
router.post('/:id/review', auth, async (req, res) => {
  const Book = require('../models/Book');
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).json({ message: 'Comment required' });
  
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    // Add review with user info from auth middleware
    book.reviews.push({ 
      userId: req.user._id, 
      userName: req.user.name, 
      comment: comment.trim(),
      date: new Date()
    });
    
    await book.save();
    res.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Failed to add review' });
  }
});

// Get all reviews for a book
router.get('/:id/reviews', async (req, res) => {
  const Book = require('../models/Book');
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book.reviews);
});

// Flag negative review for moderation
router.post('/:id/review/flag', auth, async (req, res) => {
  try {
    const { reviewId, reason } = req.body;
    const Book = require('../models/Book');
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    const review = book.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Add flag to review
    review.flagged = true;
    review.flagReason = reason;
    review.flaggedBy = req.user.id;
    review.flaggedAt = new Date();
    
    await book.save();
    
    res.json({ message: 'Review flagged for moderation' });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ message: 'Error flagging review' });
  }
});

// Get flagged reviews (admin only)
router.get('/reviews/flagged', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const Book = require('../models/Book');
    const books = await Book.find({
      'reviews.flagged': true
    }).populate('reviews.user', 'name email');
    
    const flaggedReviews = [];
    books.forEach(book => {
      book.reviews.forEach(review => {
        if (review.flagged) {
          flaggedReviews.push({
            bookId: book._id,
            bookTitle: book.title,
            reviewId: review._id,
            userName: review.userName,
            userEmail: review.user?.email,
            comment: review.comment,
            date: review.date,
            flagReason: review.flagReason,
            flaggedBy: review.flaggedBy,
            flaggedAt: review.flaggedAt
          });
        }
      });
    });
    
    res.json(flaggedReviews);
  } catch (error) {
    console.error('Error getting flagged reviews:', error);
    res.status(500).json({ message: 'Error getting flagged reviews' });
  }
});

// Moderate flagged review (admin only)
router.post('/reviews/:reviewId/moderate', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { action, reason } = req.body; // action: 'approve', 'remove', 'warn'
    
    // Find the book containing this review
    const Book = require('../models/Book');
    const book = await Book.findOne({
      'reviews._id': req.params.reviewId
    });
    
    if (!book) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = book.reviews.id(req.params.reviewId);
    
    if (action === 'remove') {
      // Remove the review
      review.remove();
    } else if (action === 'approve') {
      // Unflag the review
      review.flagged = false;
      review.flagReason = undefined;
      review.flaggedBy = undefined;
      review.flaggedAt = undefined;
    } else if (action === 'warn') {
      // Keep flagged but add warning
      review.moderationNote = reason;
    }
    
    await book.save();
    
    res.json({ message: `Review ${action}d successfully` });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ message: 'Error moderating review' });
  }
});

// Admin reply to a review
router.post('/:id/review/:reviewId/reply', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { comment } = req.body;
    const Book = require('../models/Book');
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    const review = book.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Add admin reply
    review.adminReply = {
      comment: comment,
      adminName: req.user.name,
      date: new Date()
    };
    
    await book.save();
    
    res.json({ message: 'Admin reply added successfully' });
  } catch (error) {
    console.error('Error adding admin reply:', error);
    res.status(500).json({ message: 'Error adding admin reply' });
  }
});

module.exports = router;
