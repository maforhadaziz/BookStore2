const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUsers() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });
    
    // Check if admin exists specifically
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`\nAdmin found: ${admin.name} (${admin.email})`);
    } else {
      console.log('\nNo admin user found!');
    }
    
  } catch (err) {
    console.error('❌ Error checking users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUsers(); 