require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAdminAuth() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'forhadaziz47@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('ID:', admin._id);

    // Test password verification
    const password = 'forhadaziz02';
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('✅ Password verification:', isMatch ? 'SUCCESS' : 'FAILED');

    if (isMatch) {
      // Generate JWT token
      const token = jwt.sign(
        { userId: admin._id, email: admin.email },
        'your_jwt_secret',
        { expiresIn: '1h' }
      );
      console.log('✅ JWT Token generated:', token.substring(0, 50) + '...');
      
      // Decode token to verify
      const decoded = jwt.verify(token, 'your_jwt_secret');
      console.log('✅ Token decoded successfully:');
      console.log('  UserId:', decoded.userId);
      console.log('  Email:', decoded.email);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAdminAuth(); 