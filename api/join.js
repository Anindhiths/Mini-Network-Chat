// api/join.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

  // Get users and messages from Redis
  let users = (await redis.smembers('chat:users')) || [];
  let rawMessages = await redis.lrange('chat:messages', 0, -1);
  let messages = rawMessages.map(msg => {
    try {
      return typeof msg === 'string' ? JSON.parse(msg) : msg;
    } catch (error) {
      console.error('Error parsing message in join:', msg, error);
      return null;
    }
  }).filter(msg => msg !== null);

  if (users.includes(trimmedUsername)) {
    return res.status(409).json({ 
      success: false, 
      error: 'Username already taken' 
    });
  }

  // Add user to Redis set
  await redis.sadd('chat:users', trimmedUsername);

  // Add system message
  const joinMessage = {
    id: Date.now(),
    type: 'system',
    message: `${trimmedUsername} joined the chat`,
    timestamp: new Date().toISOString(),
    username: null
  };

  await redis.rpush('chat:messages', JSON.stringify(joinMessage));
  // Keep only last 100 messages
  await redis.ltrim('chat:messages', -100, -1);

  users.push(trimmedUsername);

  return res.status(200).json({
    success: true,
    userCount: users.length,
    messageId: joinMessage.id
  });
}

