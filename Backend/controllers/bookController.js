const Book = require('../models/Book');

const getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

const addBook = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, author, price, description, category } = req.body;
    const pdfFileName = req.files && req.files.pdf ? req.files.pdf[0].filename : undefined;
    const coverImageFileName = req.files && req.files.coverImage ? req.files.coverImage[0].filename : undefined;
    const newBook = new Book({
      title,
      author,
      price,
      description,
      category,
      image: req.body.image,
      pdfFileName,
      coverImageFileName
    });
    await newBook.save();
    res.json({ message: 'Book added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book' });
  }
};

const deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    await Book.findByIdAndDelete(id);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};

const updateBook = async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = { ...req.body };
    if (req.files && req.files.pdf) {
      updateData.pdfFileName = req.files.pdf[0].filename;
    }
    if (req.files && req.files.coverImage) {
      updateData.coverImageFileName = req.files.coverImage[0].filename;
    }
    const updated = await Book.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

const trackBookVisit = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    book.totalVisits += 1;

    if (req.user) {
      book.visits.push({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        timestamp: new Date()
      });
    }

    await book.save();
    res.json({ message: 'Visit tracked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track visit' });
  }
};

const getTrendingBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const trendingBooks = await Book.find()
      .sort({ totalVisits: -1 })
      .limit(limit);
    
    res.json(trendingBooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending books' });
  }
};

module.exports = {
  getBooks,
  addBook,
  deleteBook,
  updateBook,
  trackBookVisit,
  getTrendingBooks
};
