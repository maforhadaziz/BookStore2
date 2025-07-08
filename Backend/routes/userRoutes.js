const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  res.json({ message: 'User route works!' });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, password } = req.body;
    const updateData = { name, email };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

router.get('/something', (req, res) => {
  res.send('Hello');
});

router.get('/some-path', (req, res) => {
  res.send('This is some path');
});

router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, email, role } = req.body;
    const updateData = { name, email, role };
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (userToDelete.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.post('/favorites/:bookId', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  const idx = user.favorites.findIndex(fav => fav.toString() === bookId);
  if (idx > -1) {
    user.favorites.splice(idx, 1);
    await user.save();
    return res.json({ favorited: false });
  } else {
    user.favorites.push(bookId);
    await user.save();
    return res.json({ favorited: true });
  }
});

router.get('/favorites', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json(user.favorites);
});

router.post('/history/:bookId', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  if (!user.history.includes(bookId)) {
    user.history.push(bookId);
    await user.save();
  }
  res.json({ added: true });
});

// Get all books in user's history
router.get('/history', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('history');
  res.json(user.history);
});

// Super Admin: Promote user to admin (only forhadaziz47@gmail.com can do this)
router.post('/promote/:userId', auth, async (req, res) => {
  try {
    // Check if current user is "forhadaziz47@gmail.com"
    if (req.user.email !== 'forhadaziz47@gmail.com') {
      return res.status(403).json({ 
        message: 'Only forhadaziz47@gmail.com can promote users to admin status' 
      });
    }
    
    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You must be an admin to promote users' 
      });
    }
    
    const userToPromote = await User.findById(req.params.userId);
    if (!userToPromote) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToPromote.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }
    
    // Promote user to admin
    userToPromote.role = 'admin';
    await userToPromote.save();
    
    res.json({ 
      message: `User ${userToPromote.name} has been promoted to admin successfully`,
      user: {
        id: userToPromote._id,
        name: userToPromote.name,
        email: userToPromote.email,
        role: userToPromote.role
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Failed to promote user' });
  }
});

// Super Admin: Demote admin to user (only forhadaziz47@gmail.com can do this)
router.post('/demote/:userId', auth, async (req, res) => {
  try {
    // Check if current user is "forhadaziz47@gmail.com"
    if (req.user.email !== 'forhadaziz47@gmail.com') {
      return res.status(403).json({ 
        message: 'Only forhadaziz47@gmail.com can demote admin users' 
      });
    }
    
    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You must be an admin to demote users' 
      });
    }
    
    const userToDemote = await User.findById(req.params.userId);
    if (!userToDemote) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToDemote.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }
    
    // Prevent demoting yourself
    if (userToDemote._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot demote yourself' });
    }
    
    // Demote admin to user
    userToDemote.role = 'user';
    await userToDemote.save();
    
    res.json({ 
      message: `Admin ${userToDemote.name} has been demoted to user successfully`,
      user: {
        id: userToDemote._id,
        name: userToDemote.name,
        email: userToDemote.email,
        role: userToDemote.role
      }
    });
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ message: 'Failed to demote user' });
  }
});

// Track user activity (called periodically from frontend)
router.post('/activity', auth, async (req, res) => {
  try {
    const { currentPage, userAgent } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: true,
      lastSeen: new Date(),
      currentPage: currentPage || '',
      userAgent: userAgent || '',
      ipAddress: ipAddress,
      sessionStart: req.user.sessionStart || new Date()
    });
    
    res.json({ message: 'Activity tracked' });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({ message: 'Error tracking activity' });
  }
});

// Mark user as offline
router.post('/offline', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });
    
    res.json({ message: 'User marked as offline' });
  } catch (error) {
    console.error('Error marking user offline:', error);
    res.status(500).json({ message: 'Error marking user offline' });
  }
});

// Get active users (admin only)
router.get('/active', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Get users who were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeUsers = await User.find({
      lastSeen: { $gte: fiveMinutesAgo },
      isOnline: true
    }).select('-password').sort({ lastSeen: -1 });
    
    // Get users who were active in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentUsers = await User.find({
      lastSeen: { $gte: oneHourAgo }
    }).select('-password').sort({ lastSeen: -1 });
    
    res.json({
      activeUsers,
      recentUsers,
      totalActive: activeUsers.length,
      totalRecent: recentUsers.length
    });
  } catch (error) {
    console.error('Error getting active users:', error);
    res.status(500).json({ message: 'Error getting active users' });
  }
});

// Get user activity history (admin only)
router.get('/activity-history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const users = await User.find({})
      .select('-password')
      .sort({ lastSeen: -1 })
      .limit(50);
    
    res.json(users);
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({ message: 'Error getting activity history' });
  }
});

// Add more user routes here (e.g., profile, update, delete)

module.exports = router;