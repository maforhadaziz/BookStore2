require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'forhadaziz47@gmail.com' }).select('-password');
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('ID:', admin._id);
      console.log('Created:', admin.createdAt);
    } else {
      console.log('❌ Admin user not found');
    }

    // Get all users
    const allUsers = await User.find({}).select('-password');
    console.log('\n📊 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAdmin(); 