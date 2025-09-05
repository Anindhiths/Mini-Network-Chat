// API endpoint for polling messages
// This endpoint returns messages since a given message ID

// Shared in-memory storage (same limitation as other endpoints)
let chatData = {
  users: new Set(['Alice', 'Bob', 'Charlie', 'TestBot']),
  messages: [
    {
      id: 1,
      type: 'system',
      message: 'Welcome to the serverless chat! 🚀',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      username: null
    },
    {
      id: 2,
      type: 'message',
      message: 'Hi everyone! This chat is now running on Vercel!',
      timestamp: new Date(Date.now() - 240000).toISOString(), // 4 min ago
      username: 'Alice'
    },
    {
      id: 3,
      type: 'message',
      message: 'Amazing serverless deployment! No more terminal needed.',
      timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
      username: 'Bob'
    },
    {
      id: 4,
      type: 'system',
      message: 'TestBot joined the chat',
      timestamp: new Date(Date.now() - 120000).toISOString(), // 2 min ago
      username: null
    },
    {
      id: 5,
      type: 'message',
      message: 'Socket programming meets modern web deployment! 💻',
      timestamp: new Date(Date.now() - 60000).toISOString(), // 1 min ago
      username: 'TestBot'
    }
  ],
  messageId: 5,
  lastActivity: Date.now()
};

// Add some demo messages periodically
function addDemoMessage() {
  const demoMessages = [
    { user: 'Alice', text: 'This serverless approach is really cool!' },
    { user: 'Bob', text: 'No more worrying about server uptime! ⚡' },
    { user: 'Charlie', text: 'The polling method works surprisingly well.' },
    { user: 'TestBot', text: 'Bridging C sockets to modern web tech! 🌉' },
    { user: 'Alice', text: 'Great example of hybrid architecture.' },
    { user: 'Bob', text: 'Perfect for educational purposes.' }
  ];

  // Only add demo message if no recent activity (avoid spam)
  if (Date.now() - chatData.lastActivity > 30000) { // 30 seconds
    const demo = demoMessages[Math.floor(Math.random() * demoMessages.length)];
    const newMessage = {
      id: ++chatData.messageId,
      type: 'message',
      message: demo.text,
      timestamp: new Date().toISOString(),
      username: demo.user
    };

    chatData.messages.push(newMessage);

    // Keep only last 50 messages
    if (chatData.messages.length > 50) {
      chatData.messages = chatData.messages.slice(-50);
    }

    chatData.lastActivity = Date.now();
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { since } = req.query;
    const sinceId = since ? parseInt(since) : 0;

    // Add demo message occasionally
    if (Math.random() < 0.1) { // 10% chance
      addDemoMessage();
    }

    // Get messages since the specified ID
    const newMessages = chatData.messages.filter(msg => msg.id > sinceId);

    return res.status(200).json({
      success: true,
      messages: newMessages,
      userCount: chatData.users.size,
      lastMessageId: chatData.messageId,
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}