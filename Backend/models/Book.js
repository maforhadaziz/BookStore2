const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  
  pdfFileName: String,
  coverImageFileName: String,
  
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, min: 1, max: 5 }
    }
  ],
  ratingAvg: { type: Number, default: 0 },
  
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      comment: String,
      date: { type: Date, default: Date.now },
      
      flagged: { type: Boolean, default: false },
      flagReason: String,
      flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      flaggedAt: Date,
      moderationNote: String,
      
      adminReply: {
        comment: String,
        adminName: String,
        date: { type: Date, default: Date.now }
      }
    }
  ],
  
  visits: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      userEmail: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  downloads: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      userEmail: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  
  totalVisits: { type: Number, default: 0 },
  totalDownloads: { type: Number, default: 0 }
});

module.exports = mongoose.model('Book', bookSchema);
