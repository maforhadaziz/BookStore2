const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['unread', 'read', 'replied'],
    default: 'unread'
  },
  
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date,
    default: null
  },
  repliedAt: {
    type: Date,
    default: null
  },
  
  adminReplies: [{
    message: {
      type: String,
      trim: true
    },
    adminName: {
      type: String,
      trim: true
    },
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  userReplies: [{
    message: {
      type: String,
      trim: true
    },
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  lastUserRead: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Contact', contactSchema); 