
// Server-Sent Events endpoint for real-time chat
// Provides WebSocket-like functionality on Vercel

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

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { since } = req.query;
  const sinceId = since ? parseInt(since) : 0;

  try {
    // Get messages from Redis and filter since last ID
    let messages = (await redis.lrange('chat:messages', 0, -1)).map(JSON.parse);
    const recentMessages = messages.filter(msg => msg.id > sinceId);

    recentMessages.forEach(msg => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });

    // Get user count from Redis
    const users = await redis.smembers('chat:users');
    res.write(`data: ${JSON.stringify({
      type: 'user_count',
      count: users.length,
      users: users
    })}\n\n`);

    // Keep connection alive and poll for new messages
    let lastCheckedId = messages.length > 0 ? Math.max(...messages.map(m => m.id || 0)) : 0;

    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({type: 'ping'})}\n\n`);
    }, 30000);

    // Poll for new messages every 3 seconds
    const messageCheck = setInterval(async () => {
      try {
        // Get latest messages from Redis
        const latestMessages = (await redis.lrange('chat:messages', 0, -1)).map(JSON.parse);
        const newMessages = latestMessages.filter(msg => msg.id > lastCheckedId);
        
        if (newMessages.length > 0) {
          newMessages.forEach(msg => {
            res.write(`data: ${JSON.stringify(msg)}\n\n`);
          });
          lastCheckedId = Math.max(...newMessages.map(m => m.id));
        }

        // Also send updated user count
        const currentUsers = await redis.smembers('chat:users');
        res.write(`data: ${JSON.stringify({
          type: 'user_count',
          count: currentUsers.length,
          users: currentUsers
        })}\n\n`);

      } catch (error) {
        console.error('Error polling for messages:', error);
        clearInterval(messageCheck);
        clearInterval(keepAlive);
        res.end();
      }
    }, 3000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      clearInterval(messageCheck);
    });

    req.on('error', () => {
      clearInterval(keepAlive);
      clearInterval(messageCheck);
    });

  } catch (error) {
    console.error('SSE error:', error);
    res.status(500).end();
  }
}
