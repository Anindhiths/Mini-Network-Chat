// api/join.js

let chatData = {
  users: new Set(),
  messages: [],
  messageId: 0
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;

  // If body is not parsed, parse it manually
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON body'
      });
    }
  }

  const { username } = body;

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

  if (chatData.users.has(trimmedUsername)) {
    return res.status(409).json({ 
      success: false, 
      error: 'Username already taken' 
    });
  }

  chatData.users.add(trimmedUsername);

  const joinMessage = {
    id: ++chatData.messageId,
    type: 'system',
    message: `${trimmedUsername} joined the chat`,
    timestamp: new Date().toISOString(),
    username: null
  };

  chatData.messages.push(joinMessage);

  if (chatData.messages.length > 100) {
    chatData.messages = chatData.messages.slice(-100);
  }

  return res.status(200).json({
    success: true,
    userCount: chatData.users.size,
    messageId: chatData.messageId
  });
}
