# Create message sending API
message_api = '''// API endpoint for sending messages
// Note: In serverless, state is not shared between function invocations
// This is a simplified version for demo purposes

// Simple in-memory storage (will reset with each cold start)
let chatData = {
  users: new Set(['Alice', 'Bob', 'Charlie']), // Pre-populate for demo
  messages: [
    {
      id: 1,
      type: 'system',
      message: 'Welcome to the serverless chat!',
      timestamp: new Date().toISOString(),
      username: null
    },
    {
      id: 2,
      type: 'message',
      message: 'Hi everyone! This is running on Vercel!',
      timestamp: new Date().toISOString(),
      username: 'Alice'
    },
    {
      id: 3,
      type: 'message',
      message: 'Pretty cool serverless deployment!',
      timestamp: new Date().toISOString(),
      username: 'Bob'
    }
  ],
  messageId: 3
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and message are required' 
      });
    }

    const trimmedMessage = message.trim();
    const trimmedUsername = username.trim();
    
    if (!trimmedMessage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message cannot be empty' 
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message too long' 
      });
    }

    // Add user if not exists
    chatData.users.add(trimmedUsername);
    
    // Add message
    const newMessage = {
      id: ++chatData.messageId,
      type: 'message',
      message: trimmedMessage,
      timestamp: new Date().toISOString(),
      username: trimmedUsername
    };
    
    chatData.messages.push(newMessage);

    // Keep only last 100 messages
    if (chatData.messages.length > 100) {
      chatData.messages = chatData.messages.slice(-100);
    }

    // Simulate auto-responses occasionally for demo
    if (Math.random() < 0.3) {
      setTimeout(() => {
        const autoResponses = [
          "That's interesting!",
          "Great point!",
          "I agree with that.",
          "Thanks for sharing!",
          "Nice to see this working!",
          "Vercel deployment is smooth!"
        ];
        
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        const botUsers = ['Alice', 'Bob', 'Charlie', 'TestBot'];
        const randomBot = botUsers[Math.floor(Math.random() * botUsers.length)];
        
        if (randomBot !== trimmedUsername) {
          const botMessage = {
            id: ++chatData.messageId,
            type: 'message',
            message: randomResponse,
            timestamp: new Date().toISOString(),
            username: randomBot
          };
          
          chatData.messages.push(botMessage);
        }
      }, 1000);
    }

    return res.status(200).json({
      success: true,
      messageId: chatData.messageId
    });

  } catch (error) {
    console.error('Message API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}'''

# Save message API
with open('api/message.js', 'w') as f:
    f.write(message_api)

print("✅ Message API created: api/message.js")