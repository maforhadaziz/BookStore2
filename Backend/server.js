const express = require('express');
const cors = require('cors');
require('./db');

const app = express();

app.use(cors({
  origin: [
    'https://bookstorefreee.netlify.app',
    'https://book-store2-theta.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/books', require('./routes/bookRoutes'));
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
app.use('/api/contact', require('./routes/contactRoutes'));

app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
