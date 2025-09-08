# script_4.py

import os

# Create the api directory if it doesn't exist
os.makedirs('api', exist_ok=True)

# Message sending API using Upstash Redis
message_api = '''import { Redis } from '@upstash/redis';

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

  const { username, message } = body;

  if (!username or not message) {
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

  // Add user to Redis set
  await redis.sadd('chat:users', trimmedUsername);

  // Add message to Redis list
  const newMessage = {
    id: Date.now(),
    type: 'message',
    message: trimmedMessage,
    timestamp: new Date().toISOString(),
    username: trimmedUsername
  };

  await redis.rpush('chat:messages', JSON.stringify(newMessage));
  // Keep only last 100 messages
  await redis.ltrim('chat:messages', -100, -1);

  return res.status(200).json({
    success: true,
    messageId: newMessage.id
  });
}
'''

# Save message API
with open('api/message.js', 'w') as f:
    f.write(message_api)

print("✅ Message API created: api/message.js")
