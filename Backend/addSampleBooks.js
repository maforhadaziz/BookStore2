require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGODB_URI = process.env.MONGODB_URI;

const sampleBooks = [
  {
    title: 'Sample Book 1',
    author: 'Author One',
    price: 0,
    description: 'A free sample book for testing.',
    category: 'Fiction',
    coverImageFileName: 'pg2641.cover.medium-1751532561529.jpg',
    pdfFileName: '3.25 report-1751532561477.pdf',
  },
  {
    title: 'Sample Book 2',
    author: 'Author Two',
    price: 0,
    description: 'Another free sample book for testing.',
    category: 'Science',
    coverImageFileName: 'pg2641.cover.medium-1751532561529.jpg',
    pdfFileName: '3.25 report-1751532561477.pdf',
  },
];

async function addSampleBooks() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await Book.deleteMany({ title: { $in: sampleBooks.map(b => b.title) } });
    await Book.insertMany(sampleBooks);
    console.log('✅ Sample books added!');
  } catch (err) {
    console.error('❌ Error adding sample books:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addSampleBooks(); 