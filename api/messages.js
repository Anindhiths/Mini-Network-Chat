// api/messages.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
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

    // Get all messages from Redis
    let rawMessages = await redis.lrange('chat:messages', 0, -1);
    let messages = rawMessages.map(msg => {
      try {
        return typeof msg === 'string' ? JSON.parse(msg) : msg;
      } catch (error) {
        console.error('Error parsing message in messages:', msg, error);
        return null;
      }
    }).filter(msg => msg !== null);

    // Filter messages since the specified ID
    const newMessages = messages.filter(msg => msg.id > sinceId);

    // Get user count from Redis
    const users = await redis.smembers('chat:users');

    // Find the highest message ID
    const lastMessageId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) : 0;

    return res.status(200).json({
      success: true,
      messages: newMessages,
      userCount: users.length,
      lastMessageId,
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
