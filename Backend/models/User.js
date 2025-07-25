const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  currentPage: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  sessionStart: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
