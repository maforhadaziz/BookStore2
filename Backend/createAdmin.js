require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminExists = await User.findOne({ email: 'forhadaziz47@gmail.com' });
    if (adminExists) {
      console.log('✅ Admin user already exists!');
      return;
    }

    const admin = new User({
      name: 'forhad',
      email: 'forhadaziz47@gmail.com',
      password: 'forhadaziz02', // Will be hashed by pre-save hook in User model
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    await mongoose.disconnect();
  }
}

async function addSampleFictionBooks() {
  const books = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      description: 'A classic novel set in the Roaring Twenties, exploring themes of wealth, love, and the American Dream.'
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      category: 'Fiction',
      description: 'A powerful story of racial injustice and childhood innocence in the Deep South.'
    },
    {
      title: '1984',
      author: 'George Orwell',
      category: 'Fiction',
      description: 'A dystopian novel about totalitarianism, surveillance, and the loss of individuality.'
    }
  ];

  try {
    await Book.insertMany(books);
    console.log('✅ Sample Fiction books added!');
  } catch (err) {
    console.error('❌ Error adding sample books:', err);
  }
}

async function main() {
  try {
    await createAdmin();
    await addSampleFictionBooks();
  } catch (err) {
    console.error('❌ Main error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
