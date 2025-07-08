const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Test Message',
  message: 'This is a test message from John Doe'
};

const adminToken = 'your-admin-token-here'; // You'll need to get this from login

async function testContactSystem() {
  console.log('🧪 Testing Contact System with Admin Replies...\n');

  try {
    // 1. Submit a contact message
    console.log('1. Submitting contact message...');
    const submitResponse = await axios.post(`${BASE_URL}/contact/submit`, testUser);
    console.log('✅ Message submitted:', submitResponse.data.message);
    
    // 2. Get all messages (admin only)
    console.log('\n2. Fetching all messages (admin only)...');
    try {
      const messagesResponse = await axios.get(`${BASE_URL}/contact/messages`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Messages fetched:', messagesResponse.data.length, 'messages');
      
      if (messagesResponse.data.length > 0) {
        const messageId = messagesResponse.data[0]._id;
        console.log('📧 First message ID:', messageId);
        
        // 3. Send admin reply
        console.log('\n3. Sending admin reply...');
        const replyData = {
          replyText: 'Thank you for your message! We have received it and will get back to you soon.',
          userEmail: testUser.email,
          userName: testUser.name
        };
        
        const replyResponse = await axios.post(
          `${BASE_URL}/contact/messages/${messageId}/send-reply`,
          replyData,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Admin reply sent:', replyResponse.data.message);
        
        // 4. Get user's messages (requires user authentication)
        console.log('\n4. Testing user message retrieval...');
        console.log('ℹ️  This would require user authentication token');
        console.log('ℹ️  User can view their messages at: /my-messages');
        
      }
    } catch (error) {
      console.log('❌ Admin operation failed (expected without proper token):', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Contact system test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the frontend: cd ../frontend && npm start');
    console.log('2. Login as admin and go to Contact Messages');
    console.log('3. Reply to a message');
    console.log('4. Login as user and go to My Messages to see the reply');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testContactSystem(); 