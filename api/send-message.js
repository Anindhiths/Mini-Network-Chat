// api/send-message.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

  let body = req.body;
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

  const { username, message, action = 'message' } = body;

  if (!username) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username is required' 
    });
  }

  const now = new Date();
  let newMessage;

  if (action === 'join') {
    // Add user to Redis set
    await redis.sadd('chat:users', username);

    newMessage = {
      id: Date.now(),
      type: 'system',
      message: `${username} joined the chat`,
      timestamp: now.toISOString(),
      username: null
    };
  } else if (action === 'leave') {
    // Remove user from Redis set
    await redis.srem('chat:users', username);

    newMessage = {
      id: Date.now(),
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

    // Add user to Redis set (if not already present)
    await redis.sadd('chat:users', username);

    newMessage = {
      id: Date.now(),
      type: 'message',
      message: message.trim(),
      timestamp: now.toISOString(),
      username: username
    };
  }

  // Add to message history in Redis
  await redis.rpush('chat:messages', JSON.stringify(newMessage));
  // Keep only last 100 messages
  await redis.ltrim('chat:messages', -100, -1);

  // Get user count from Redis
  const users = await redis.smembers('chat:users');

  return res.status(200).json({
    success: true,
    messageId: newMessage.id,
    userCount: users.length
  });
}
