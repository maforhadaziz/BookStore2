const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testRegistration() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check current users
    const currentUsers = await User.find({});
    console.log(`Current users in database: ${currentUsers.length}`);
    currentUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Try to create a test user
    console.log('\n--- Testing User Registration ---');
    
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    
    console.log('Attempting to save test user...');
    await testUser.save();
    console.log('✅ Test user saved successfully!');
    
    // Check users again
    const updatedUsers = await User.find({});
    console.log(`\nUsers after test: ${updatedUsers.length}`);
    updatedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Clean up - delete test user
    await User.findOneAndDelete({ email: 'test@example.com' });
    console.log('🧹 Test user cleaned up');
    
  } catch (err) {
    console.error('❌ Error during test:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testRegistration(); 