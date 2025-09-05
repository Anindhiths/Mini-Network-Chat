// Send message endpoint that broadcasts to all SSE connections
// This creates real multi-user chat functionality

// Shared state with SSE endpoint (in production, use Redis or database)
let chatState = {
  messages: [],
  users: new Map(), // username -> connection info
  messageId: 0,
  sseConnections: new Map() // SSE connections for broadcasting
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, message, action = 'message' } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      });
    }

    const now = new Date();
    let newMessage;

    if (action === 'join') {
      // User joining
      chatState.users.set(username, {
        joinedAt: now,
        lastSeen: now
      });

      newMessage = {
        id: ++chatState.messageId,
        type: 'system',
        message: `${username} joined the chat`,
        timestamp: now.toISOString(),
        username: null
      };
    } else if (action === 'leave') {
      // User leaving
      chatState.users.delete(username);

      newMessage = {
        id: ++chatState.messageId,
        type: 'system', 
        message: `${username} left the chat`,
        timestamp: now.toISOString(),
        username: null
      };
    } else {
      // Regular message
      if (!message || !message.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message cannot be empty' 
        });
      }

      // Update user activity
      if (chatState.users.has(username)) {
        chatState.users.get(username).lastSeen = now;
      }

      newMessage = {
        id: ++chatState.messageId,
        type: 'message',
        message: message.trim(),
        timestamp: now.toISOString(),
        username: username
      };
    }

    // Add to message history
    chatState.messages.push(newMessage);

    // Keep only last 100 messages
    if (chatState.messages.length > 100) {
      chatState.messages = chatState.messages.slice(-100);
    }

    // Broadcast to all SSE connections
    broadcastToSSE(newMessage);

    return res.status(200).json({
      success: true,
      messageId: chatState.messageId,
      userCount: chatState.users.size
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Function to broadcast messages via SSE (shared with sse endpoint)
function broadcastToSSE(message) {
  // In a real app, this would be handled by the SSE endpoint
  // For now, we store the message and SSE clients will pick it up
  global.latestMessage = message;
}

// Export state for SSE endpoint to access
export { chatState };
