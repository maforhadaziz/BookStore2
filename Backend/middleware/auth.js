const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) return res.status(401).json({ message: 'No token, authorization denied.' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    
    req.user = user;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};