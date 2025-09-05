# Create API endpoints for Vercel serverless functions

# Join endpoint
join_api = '''// API endpoint for joining the chat
let chatData = {
  users: new Set(),
  messages: [],
  messageId: 0
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
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      });
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username must be between 2 and 30 characters' 
      });
    }

    // Check if username is already taken
    if (chatData.users.has(trimmedUsername)) {
      return res.status(409).json({ 
        success: false, 
        error: 'Username already taken' 
      });
    }

    // Add user
    chatData.users.add(trimmedUsername);
    
    // Add system message
    const joinMessage = {
      id: ++chatData.messageId,
      type: 'system',
      message: `${trimmedUsername} joined the chat`,
      timestamp: new Date().toISOString(),
      username: null
    };
    
    chatData.messages.push(joinMessage);

    // Keep only last 100 messages to prevent memory issues
    if (chatData.messages.length > 100) {
      chatData.messages = chatData.messages.slice(-100);
    }

    return res.status(200).json({
      success: true,
      userCount: chatData.users.size,
      messageId: chatData.messageId
    });

  } catch (error) {
    console.error('Join API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}'''

# Save join API
with open('api/join.js', 'w') as f:
    f.write(join_api)

print("✅ Join API created: api/join.js")