const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });
    
    await contact.save();
    
    res.status(201).json({ 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Error sending message. Please try again.' });
  }
});

router.get('/messages', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const messages = await Contact.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const count = await Contact.countDocuments({ status: 'unread' });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

router.get('/unread-replies-count', auth, async (req, res) => {
  try {
    const messages = await Contact.find({ 
      email: req.user.email,
      adminReplies: { $exists: true, $ne: [] }
    });
    
    let unreadCount = 0;
    messages.forEach(message => {
      if (message.lastUserRead) {
        const unreadReplies = message.adminReplies.filter(reply => 
          reply.repliedAt > message.lastUserRead
        );
        unreadCount += unreadReplies.length;
      } else {
        unreadCount += message.adminReplies.length;
      }
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread replies count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

router.put('/messages/:id/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'read',
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message marked as read', contact: message });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

router.put('/messages/:id/replied', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'replied',
        repliedAt: new Date()
      },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message marked as replied', contact: message });
  } catch (error) {
    console.error('Error marking message as replied:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

router.delete('/messages/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const message = await Contact.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

router.post('/messages/:id/send-reply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { replyText, userEmail, userName } = req.body;
    
    if (!replyText || !userEmail) {
      return res.status(400).json({ message: 'Reply text and user email are required' });
    }
    
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Store admin reply in database
    const updatedMessage = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          adminReplies: {
            message: replyText,
            adminName: req.user.name,
            repliedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Here you would typically send an email to the user
    // For now, we'll just log the reply
    console.log('=== ADMIN REPLY ===');
    console.log(`To: ${userEmail} (${userName})`);
    console.log(`Subject: Re: ${message.subject}`);
    console.log(`Message: ${replyText}`);
    console.log('==================');
    
    // In a real application, you would use a service like Nodemailer, SendGrid, etc.
    // Example with Nodemailer:
    /*
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
      }
    });
    
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: userEmail,
      subject: `Re: ${message.subject}`,
      text: replyText,
      html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`
    });
    */
    
    res.json({ 
      message: 'Reply sent successfully', 
      contact: updatedMessage 
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ message: 'Error sending reply' });
  }
});

// Get user's own messages (authenticated users)
router.get('/my-messages', auth, async (req, res) => {
  try {
    // Find messages sent by the authenticated user
    const messages = await Contact.find({ 
      email: req.user.email 
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your messages' 
    });
  }
});

// Get a specific message by ID (for authenticated users)
router.get('/my-messages/:id', auth, async (req, res) => {
  try {
    const message = await Contact.findOne({
      _id: req.params.id,
      email: req.user.email
    });
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    // Mark admin reply as read if user views the message
    if (message.adminReply && !message.userReadReply) {
      await Contact.findByIdAndUpdate(req.params.id, {
        userReadReply: true
      });
    }
    
    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching message' 
    });
  }
});

// Mark admin replies as read (for authenticated users)
router.put('/my-messages/:id/mark-read', auth, async (req, res) => {
  try {
    const message = await Contact.findOneAndUpdate(
      {
        _id: req.params.id,
        email: req.user.email
      },
      { lastUserRead: new Date() },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Replies marked as read'
    });
  } catch (error) {
    console.error('Error marking replies as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating message' 
    });
  }
});

// Send user reply to admin (for authenticated users)
router.post('/my-messages/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: 'Message is required' 
      });
    }
    
    const updatedMessage = await Contact.findOneAndUpdate(
      {
        _id: req.params.id,
        email: req.user.email
      },
      {
        $push: {
          userReplies: {
            message,
            repliedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!updatedMessage) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      contact: updatedMessage
    });
  } catch (error) {
    console.error('Error sending user reply:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending reply' 
    });
  }
});

module.exports = router; 