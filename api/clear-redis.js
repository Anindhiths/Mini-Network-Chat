// api/clear-redis.js
// Utility endpoint to clear corrupted Redis data

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

  try {
    // Clear all chat data
    await redis.del('chat:messages');
    await redis.del('chat:users');
    
    console.log('Redis chat data cleared successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Redis chat data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing Redis data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear Redis data'
    });
  }
}
